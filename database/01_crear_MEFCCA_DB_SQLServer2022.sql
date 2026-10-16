/* ============================================================================
   PROYECTO: Sistema de Información Web para la Gestión de Compras y Ventas
             de los Miembros del MEFCCA
   BASE DE DATOS: MEFCCA_DB
   MOTOR: Microsoft SQL Server 2022
   HERRAMIENTA: SQL Server Management Studio (SSMS)

   Notas de diseño:
   - Conserva las cinco entidades principales planteadas en la Fase 1.
   - Agrega VENTAS y DETALLE_VENTA para representar las operaciones de compra/
     venta requeridas en RF-05 y su consulta en RF-06.
   - Las compras de un cliente se consultan desde VENTAS mediante
     id_comprador_usuario; no se duplica la misma operación en una tabla COMPRAS.
   - Agrega stock_actual a PRODUCTOS para soportar disponibilidad/inventario.
   - Las contraseñas deben almacenarse como hash bcrypt desde el backend.
   - Las reglas de negocio (roles autorizados, verificación de protagonistas,
     actualización de inventario y transacciones) se implementarán también en
     el backend. Este script no reemplaza esas validaciones.

   EJECUCIÓN:
   1. Abrir SSMS y conectarse a una instancia local de SQL Server 2022.
   2. Abrir este archivo y ejecutar todo el script.
   3. El script no elimina tablas ni datos existentes. En una base que ya tenga
      tablas con otra estructura, se recomienda respaldar y revisar antes.
   ============================================================================ */

/* 1. Crear la base de datos solo si todavía no existe. */
IF DB_ID(N'MEFCCA_DB') IS NULL
BEGIN
    CREATE DATABASE [MEFCCA_DB];
END;
GO

USE [MEFCCA_DB];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* 2. Usuarios del sistema. */
IF OBJECT_ID(N'dbo.USUARIOS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.USUARIOS
    (
        id_usuario      INT IDENTITY(1,1) NOT NULL,
        email           NVARCHAR(254) NOT NULL,
        password_hash   NVARCHAR(255) NOT NULL,
        rol             NVARCHAR(20) NOT NULL
                            CONSTRAINT DF_USUARIOS_rol DEFAULT (N'Cliente'),
        fecha_creacion  DATETIME2(0) NOT NULL
                            CONSTRAINT DF_USUARIOS_fecha_creacion DEFAULT (GETDATE()),

        CONSTRAINT PK_USUARIOS PRIMARY KEY (id_usuario),
        CONSTRAINT UQ_USUARIOS_email UNIQUE (email),
        CONSTRAINT CK_USUARIOS_rol
            CHECK (rol IN (N'Admin', N'Protagonista', N'Cliente'))
    );
END;
GO

/* 3. Perfil de negocio de cada usuario protagonista. Un usuario puede tener
      como máximo un perfil de protagonista. */
IF OBJECT_ID(N'dbo.PROTAGONISTAS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PROTAGONISTAS
    (
        id_protagonista       INT IDENTITY(1,1) NOT NULL,
        id_usuario            INT NOT NULL,
        nombre_negocio        NVARCHAR(100) NOT NULL,
        telefono_whatsapp     NVARCHAR(20) NOT NULL,
        departamento          NVARCHAR(50) NOT NULL,
        descripcion_negocio   NVARCHAR(MAX) NULL,
        estado_verificacion   BIT NOT NULL
                                  CONSTRAINT DF_PROTAGONISTAS_estado_verificacion DEFAULT (0),

        CONSTRAINT PK_PROTAGONISTAS PRIMARY KEY (id_protagonista),
        CONSTRAINT UQ_PROTAGONISTAS_id_usuario UNIQUE (id_usuario),
        CONSTRAINT FK_PROTAGONISTAS_USUARIOS
            FOREIGN KEY (id_usuario) REFERENCES dbo.USUARIOS(id_usuario)
    );
END;
GO

/* 4. Catálogo administrable de categorías. */
IF OBJECT_ID(N'dbo.CATEGORIAS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CATEGORIAS
    (
        id_categoria     INT IDENTITY(1,1) NOT NULL,
        nombre_categoria NVARCHAR(50) NOT NULL,
        descripcion      NVARCHAR(MAX) NULL,

        CONSTRAINT PK_CATEGORIAS PRIMARY KEY (id_categoria),
        CONSTRAINT UQ_CATEGORIAS_nombre UNIQUE (nombre_categoria)
    );
END;
GO

/* 5. Productos publicados por protagonistas.
      stock_actual se incorpora para representar la disponibilidad mencionada
      en los flujos del sistema. */
IF OBJECT_ID(N'dbo.PRODUCTOS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PRODUCTOS
    (
        id_producto      INT IDENTITY(1,1) NOT NULL,
        id_protagonista  INT NOT NULL,
        id_categoria     INT NOT NULL,
        nombre_producto  NVARCHAR(150) NOT NULL,
        descripcion      NVARCHAR(MAX) NULL,
        precio           DECIMAL(10,2) NOT NULL
                             CONSTRAINT DF_PRODUCTOS_precio DEFAULT (0.00),
        imagen           NVARCHAR(500) NULL,
        estado           NVARCHAR(10) NOT NULL
                             CONSTRAINT DF_PRODUCTOS_estado DEFAULT (N'Activo'),
        stock_actual     INT NOT NULL
                             CONSTRAINT DF_PRODUCTOS_stock DEFAULT (0),
        fecha_creacion   DATETIME2(0) NOT NULL
                             CONSTRAINT DF_PRODUCTOS_fecha_creacion DEFAULT (GETDATE()),

        CONSTRAINT PK_PRODUCTOS PRIMARY KEY (id_producto),
        CONSTRAINT FK_PRODUCTOS_PROTAGONISTAS
            FOREIGN KEY (id_protagonista)
            REFERENCES dbo.PROTAGONISTAS(id_protagonista),
        CONSTRAINT FK_PRODUCTOS_CATEGORIAS
            FOREIGN KEY (id_categoria)
            REFERENCES dbo.CATEGORIAS(id_categoria),
        CONSTRAINT CK_PRODUCTOS_precio CHECK (precio >= 0),
        CONSTRAINT CK_PRODUCTOS_estado CHECK (estado IN (N'Activo', N'Inactivo')),
        CONSTRAINT CK_PRODUCTOS_stock CHECK (stock_actual >= 0)
    );
END;
GO

/* 6. Interacciones de usuarios o visitantes con productos.
      id_usuario puede ser NULL para visitantes no autenticados. Si una cuenta
      se elimina físicamente, la interacción se conserva como anónima. */
IF OBJECT_ID(N'dbo.INTERACCIONES', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.INTERACCIONES
    (
        id_interaccion INT IDENTITY(1,1) NOT NULL,
        id_producto    INT NOT NULL,
        id_usuario     INT NULL,
        fecha_hora     DATETIME2(0) NOT NULL
                           CONSTRAINT DF_INTERACCIONES_fecha_hora DEFAULT (GETDATE()),
        tipo_accion    NVARCHAR(50) NOT NULL
                           CONSTRAINT DF_INTERACCIONES_tipo_accion DEFAULT (N'Clic en WhatsApp'),

        CONSTRAINT PK_INTERACCIONES PRIMARY KEY (id_interaccion),
        CONSTRAINT FK_INTERACCIONES_PRODUCTOS
            FOREIGN KEY (id_producto) REFERENCES dbo.PRODUCTOS(id_producto),
        CONSTRAINT FK_INTERACCIONES_USUARIOS
            FOREIGN KEY (id_usuario) REFERENCES dbo.USUARIOS(id_usuario)
            ON DELETE SET NULL
    );
END;
GO

/* 7. Registro de operaciones de venta.
      Las compras de un cliente se consultan por id_comprador_usuario.
      El comprador puede ser NULL cuando se registra una operación sin cuenta.
      No se almacena un total duplicado: se obtiene sumando los subtotales
      de DETALLE_VENTA para evitar inconsistencias entre cabecera y detalles. */
IF OBJECT_ID(N'dbo.VENTAS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VENTAS
    (
        id_venta              INT IDENTITY(1,1) NOT NULL,
        id_vendedor           INT NOT NULL,
        id_comprador_usuario  INT NULL,
        fecha_venta           DATETIME2(0) NOT NULL
                                  CONSTRAINT DF_VENTAS_fecha DEFAULT (GETDATE()),
        estado                NVARCHAR(15) NOT NULL
                                  CONSTRAINT DF_VENTAS_estado DEFAULT (N'Registrada'),
        metodo_pago           NVARCHAR(50) NULL,
        metodo_entrega        NVARCHAR(50) NULL,
        observaciones         NVARCHAR(500) NULL,

        CONSTRAINT PK_VENTAS PRIMARY KEY (id_venta),
        CONSTRAINT FK_VENTAS_PROTAGONISTAS
            FOREIGN KEY (id_vendedor)
            REFERENCES dbo.PROTAGONISTAS(id_protagonista),
        CONSTRAINT FK_VENTAS_COMPRADOR
            FOREIGN KEY (id_comprador_usuario)
            REFERENCES dbo.USUARIOS(id_usuario)
            ON DELETE SET NULL,
        CONSTRAINT CK_VENTAS_estado
            CHECK (estado IN (N'Registrada', N'Anulada'))
    );
END;
GO

/* 8. Líneas de cada venta. El nombre y el precio unitario se guardan como
      fotografía histórica; cambios posteriores al producto no deben modificar
      automáticamente una venta ya registrada. */
IF OBJECT_ID(N'dbo.DETALLE_VENTA', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DETALLE_VENTA
    (
        id_detalle_venta INT IDENTITY(1,1) NOT NULL,
        id_venta         INT NOT NULL,
        id_producto      INT NOT NULL,
        nombre_producto  NVARCHAR(150) NOT NULL,
        cantidad         INT NOT NULL,
        precio_unitario  DECIMAL(10,2) NOT NULL,
        subtotal         AS (CONVERT(DECIMAL(18,2), cantidad * precio_unitario)) PERSISTED,

        CONSTRAINT PK_DETALLE_VENTA PRIMARY KEY (id_detalle_venta),
        CONSTRAINT FK_DETALLE_VENTA_VENTAS
            FOREIGN KEY (id_venta) REFERENCES dbo.VENTAS(id_venta),
        CONSTRAINT FK_DETALLE_VENTA_PRODUCTOS
            FOREIGN KEY (id_producto) REFERENCES dbo.PRODUCTOS(id_producto),
        CONSTRAINT CK_DETALLE_VENTA_cantidad CHECK (cantidad > 0),
        CONSTRAINT CK_DETALLE_VENTA_precio CHECK (precio_unitario >= 0)
    );
END;
GO

/* 9. Índices para consultas habituales del catálogo, paneles y reportes. */
IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_PRODUCTOS_categoria_estado'
      AND object_id = OBJECT_ID(N'dbo.PRODUCTOS')
)
    CREATE INDEX IX_PRODUCTOS_categoria_estado
        ON dbo.PRODUCTOS(id_categoria, estado);
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_PRODUCTOS_protagonista_estado'
      AND object_id = OBJECT_ID(N'dbo.PRODUCTOS')
)
    CREATE INDEX IX_PRODUCTOS_protagonista_estado
        ON dbo.PRODUCTOS(id_protagonista, estado);
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_INTERACCIONES_producto_fecha'
      AND object_id = OBJECT_ID(N'dbo.INTERACCIONES')
)
    CREATE INDEX IX_INTERACCIONES_producto_fecha
        ON dbo.INTERACCIONES(id_producto, fecha_hora);
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_INTERACCIONES_usuario_fecha'
      AND object_id = OBJECT_ID(N'dbo.INTERACCIONES')
)
    CREATE INDEX IX_INTERACCIONES_usuario_fecha
        ON dbo.INTERACCIONES(id_usuario, fecha_hora);
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_VENTAS_vendedor_fecha'
      AND object_id = OBJECT_ID(N'dbo.VENTAS')
)
    CREATE INDEX IX_VENTAS_vendedor_fecha
        ON dbo.VENTAS(id_vendedor, fecha_venta);
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_VENTAS_comprador_fecha'
      AND object_id = OBJECT_ID(N'dbo.VENTAS')
)
    CREATE INDEX IX_VENTAS_comprador_fecha
        ON dbo.VENTAS(id_comprador_usuario, fecha_venta);
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_DETALLE_VENTA_id_venta'
      AND object_id = OBJECT_ID(N'dbo.DETALLE_VENTA')
)
    CREATE INDEX IX_DETALLE_VENTA_id_venta
        ON dbo.DETALLE_VENTA(id_venta);
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_DETALLE_VENTA_id_producto'
      AND object_id = OBJECT_ID(N'dbo.DETALLE_VENTA')
)
    CREATE INDEX IX_DETALLE_VENTA_id_producto
        ON dbo.DETALLE_VENTA(id_producto);
GO

/* 10. Vista para consultar ventas con su total calculado a partir del detalle.
       También puede utilizarse para consultar las compras de un cliente
       filtrando por id_comprador_usuario en el backend. */
CREATE OR ALTER VIEW dbo.vw_ventas_con_total
AS
    SELECT
        v.id_venta,
        v.id_vendedor,
        v.id_comprador_usuario,
        v.fecha_venta,
        v.estado,
        v.metodo_pago,
        v.metodo_entrega,
        v.observaciones,
        ISNULL(SUM(d.subtotal), CONVERT(DECIMAL(18,2), 0)) AS total
    FROM dbo.VENTAS AS v
    LEFT JOIN dbo.DETALLE_VENTA AS d
        ON d.id_venta = v.id_venta
    GROUP BY
        v.id_venta,
        v.id_vendedor,
        v.id_comprador_usuario,
        v.fecha_venta,
        v.estado,
        v.metodo_pago,
        v.metodo_entrega,
        v.observaciones;
GO

/* 11. Categorías iniciales de demostración. Se insertan solo si no existen.
       Son ejemplos iniciales y pueden ajustarse a la clasificación acordada. */
INSERT INTO dbo.CATEGORIAS (nombre_categoria, descripcion)
SELECT datos.nombre_categoria, datos.descripcion
FROM
(
    VALUES
        (N'Alimentos',   N'Productos alimenticios y transformados.'),
        (N'Artesanía',   N'Productos artesanales elaborados por emprendimientos.'),
        (N'Textiles',    N'Prendas, tejidos y otros productos textiles.'),
        (N'Agropecuario',N'Productos agrícolas y pecuarios.'),
        (N'Otros',       N'Productos que aún no cuentan con una categoría específica.')
) AS datos(nombre_categoria, descripcion)
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.CATEGORIAS AS c
    WHERE c.nombre_categoria = datos.nombre_categoria
);
GO

/* 12. Comprobación al terminar: tablas y categorías cargadas. */
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = N'BASE TABLE'
ORDER BY TABLE_NAME;
GO

SELECT id_categoria, nombre_categoria, descripcion
FROM dbo.CATEGORIAS
ORDER BY nombre_categoria;
GO

PRINT N'Base de datos MEFCCA_DB preparada. Revise cualquier mensaje de error en SSMS antes de continuar.';
GO
