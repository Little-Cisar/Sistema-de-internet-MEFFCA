# Backend MEFCCA — SQL Server 2022 — v1.4.0

Backend REST del **Sistema de Información Web para la Gestión de Compras y Ventas de los Miembros del MEFCCA**. Versión 1.4.0. La arquitectura se mantiene separada: React/Vite → API REST Node.js/Express → SQL Server 2022.

## Funcionalidad incluida

- Registro e inicio de sesión con bcrypt y JWT; el registro público no permite asignar el rol `Admin`.
- Consulta del perfil autenticado.
- Catálogo público con búsqueda, filtros, orden y paginación.
- Alta, consulta, edición y desactivación lógica de productos propios.
- Gestión de categorías restringida al administrador.
- Directorio de protagonistas verificados, detalle público, edición del perfil propio y flujo administrativo de verificación.
- Registro de clics en WhatsApp en `INTERACCIONES`, con registro anónimo o asociado a un JWT válido.
- Resumen privado de actividad del protagonista, limitado a sus productos: total de interacciones y hasta 10 eventos recientes sin revelar el correo del visitante.
- Reportes administrativos de interacciones: total general, actividad del día, productos con actividad, cinco productos con más interacciones e historial reciente (máximo 200 registros).
- Registro transaccional de ventas ya concretadas por el protagonista, con detalle histórico de nombre/precio, descuento seguro de existencias, comprador opcional vinculado a un correo registrado, historial de ventas y compras, detalle por permisos y anulación con restauración de inventario.
- Reporte administrativo de ventas con operaciones registradas/anuladas, importe de operaciones no anuladas, ventas del día y cinco productos más vendidos.
- Consultas parametrizadas, validaciones, limitación de intentos de autenticación y limitación de peticiones al endpoint público de interacciones.

El registro de ventas e historiales ya dispone de API y pantallas. El sistema no procesa pedidos ni pagos en línea: el protagonista registra una venta después de acordar y concretar la operación fuera del sistema. Si proporciona el correo de una cuenta Cliente o Protagonista, la venta se vincula al historial de esa cuenta; no se crea un pedido pendiente ni se confirma un pago. La integración final debe probarse contra SQL Server local.

## Requisitos

- Node.js LTS y npm.
- SQL Server 2022 y base de datos `MEFCCA_DB`, creada con el script `MEFCCA_DB_SQLServer2022.sql` entregado anteriormente.
- Un login SQL Server exclusivo para la aplicación, con permisos de lectura y escritura sobre `MEFCCA_DB`. No utilizar `sa` ni otorgar `sysadmin` al usuario de la aplicación.
- Visual Studio Code. Postman es recomendado para las pruebas, pero no se requiere ninguna extensión de VS Code para ejecutar el backend.

## 1. Instalar y configurar

Abre en VS Code la carpeta `MEFCCA_Backend_Inicial`, donde se encuentra `package.json`. En la terminal integrada ejecuta:

```powershell
npm install
Copy-Item .env.example .env
```

Si ya tienes un archivo `.env` funcional, **no lo reemplaces**: conserva sus valores y agrega únicamente las variables que falten. Edita las credenciales de SQL Server según tu instancia. Ejemplo:

```dotenv
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173
DB_SERVER=localhost
DB_INSTANCE=SQLEXPRESS
DB_PORT=1433
DB_NAME=MEFCCA_DB
DB_USER=mefcca_app
DB_PASSWORD=CAMBIA_ESTA_CLAVE
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_DE_48_BYTES
JWT_EXPIRES_IN=2h
BCRYPT_ROUNDS=12
```

La configuración exacta de `DB_SERVER`, `DB_INSTANCE` y `DB_PORT` depende de cómo te conectas a SQL Server desde SSMS. Si usas una instancia predeterminada, normalmente `DB_INSTANCE` se deja vacío; no copies automáticamente el ejemplo si no coincide con tu equipo.

Genera un secreto aleatorio JWT desde la terminal:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copia el resultado en `JWT_SECRET`. No subas `.env` a GitHub ni incluyas secretos en variables `VITE_*` del frontend.

Valida y arranca el backend:

```powershell
npm run check
npm run dev
```

La API estará disponible en `http://localhost:3000`. En `http://localhost:3000/` se puede comprobar la versión del backend y en `http://localhost:3000/api/health` la conexión con SQL Server.

## 2. Crear el primer administrador local

El registro público solo acepta los roles `Cliente` y `Protagonista`. Para crear la primera cuenta administrativa de desarrollo, agrega temporalmente al final de `.env`:

```dotenv
INITIAL_ADMIN_EMAIL=admin.prueba@mefcca.local
INITIAL_ADMIN_PASSWORD=ESCRIBE_UNA_CLAVE_PROPIA_DE_12_CARACTERES_O_MAS
```

Elige una contraseña propia, larga y no reutilizada. Ejecuta:

```powershell
npm run crear-admin
```

Cuando el script confirme la creación, elimina las variables `INITIAL_ADMIN_*` de `.env`. Usa el correo y la contraseña elegidos para iniciar sesión como administrador en el frontend o en Postman. El script no promueve cuentas existentes ni crea una contraseña predeterminada.

## 3. Crear y verificar un protagonista para pruebas

1. Registra una cuenta con rol `Protagonista` desde `/registro`. Completa los datos del emprendimiento. El sistema crea la cuenta y el perfil con `estado_verificacion = 0`.
2. Inicia sesión con la cuenta `Admin`.
3. En el panel de administración abre **Verificación de protagonistas** (`/administracion/verificaciones`) y aprueba el perfil de prueba.
4. Cierra sesión y entra con la cuenta protagonista. Si ya tenías abierta la página de productos antes de la aprobación, vuelve a cargarla para consultar el estado actualizado.
5. Ya verificado, crea un producto y confirma que aparezca como activo en el catálogo público.

El mensaje de que el perfil debe ser verificado antes de publicar es un bloqueo de negocio deliberado, no un error que deba quitarse. La cuenta pública nunca puede verificar su propio perfil. Para una revisión local, si la pantalla administrativa falla, primero usa Postman para comprobar `GET /api/admin/protagonistas/pendientes` y `PATCH /api/admin/protagonistas/:id/verificacion`; no cambies manualmente la base de datos mientras el endpoint administrativo esté disponible.

## 4. Endpoints REST disponibles

Todas las respuestas son JSON. Las rutas privadas requieren `Authorization: Bearer <JWT>` salvo donde se indica que admiten visitante anónimo.

### Autenticación

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| `POST` | `/api/auth/registro` | Público | Registrar Cliente o Protagonista. Un protagonista queda pendiente de verificación. |
| `POST` | `/api/auth/login` | Público | Validar credenciales y devolver un JWT. |
| `GET` | `/api/auth/perfil` | Autenticado | Consultar los datos de la cuenta y del perfil protagonista si corresponde. |

### Productos

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| `GET` | `/api/productos` | Público | Listar productos activos de protagonistas verificados, con filtros y paginación. |
| `GET` | `/api/productos/:id` | Público | Consultar detalle de una publicación disponible. |
| `GET` | `/api/productos/mios` | Protagonista | Consultar los productos propios, incluidos los inactivos. |
| `POST` | `/api/productos` | Protagonista verificado | Crear una publicación para el perfil asociado al token. |
| `PUT` | `/api/productos/:id` | Propietario protagonista | Editar los datos de un producto propio. |
| `PATCH` | `/api/productos/:id/estado` | Propietario protagonista | Cambiar el estado entre `Activo` e `Inactivo`. Para reactivar, el perfil debe estar verificado. |
| `DELETE` | `/api/productos/:id` | Propietario protagonista | Desactivación lógica; no elimina físicamente el registro. |

Filtros de `GET /api/productos`: `q`, `id_categoria`, `id_protagonista`, `min_precio`, `max_precio`, `page`, `limit` (1 a 100) y `orden` (`recientes`, `precio_asc`, `precio_desc`, `nombre_asc`).

Cuerpo para crear o editar un producto:

```json
{
  "nombre_producto": "Taza de cerámica artesanal",
  "id_categoria": 2,
  "descripcion": "Pieza elaborada por un emprendimiento local.",
  "precio": 250.00,
  "imagen": null,
  "stock_actual": 10
}
```

El cliente no envía `id_protagonista`; el backend obtiene el propietario desde el token, evitando publicar a nombre de otro negocio.

### Categorías

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| `GET` | `/api/categorias` | Público | Consultar las categorías disponibles. |
| `POST` | `/api/categorias` | Admin | Crear una categoría. |
| `PUT` | `/api/categorias/:id` | Admin | Editar nombre y descripción. |

Cuerpo de ejemplo:

```json
{
  "nombre_categoria": "Artesanía local",
  "descripcion": "Productos elaborados de forma artesanal."
}
```

No hay borrado físico de categorías en este módulo porque los productos las referencian mediante clave foránea.

### Perfiles y verificación administrativa

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| `GET` | `/api/protagonistas` | Público | Listar perfiles verificados. |
| `GET` | `/api/protagonistas/:id` | Público | Consultar un perfil verificado. |
| `GET` | `/api/protagonistas/me` | Protagonista | Consultar el perfil propio, incluido estado de verificación. |
| `PUT` | `/api/protagonistas/:id` | Propietario protagonista | Actualizar nombre, WhatsApp, departamento y descripción del negocio. |
| `GET` | `/api/admin/usuarios` | Admin | Listar usuarios sin exponer hashes de contraseñas. |
| `GET` | `/api/admin/protagonistas/pendientes` | Admin | Consultar los perfiles que requieren revisión. |
| `PATCH` | `/api/admin/protagonistas/:id/verificacion` | Admin | Aprobar un perfil o devolverlo a pendiente con `{ "estado_verificacion": true }` o `false`. |

### Ventas e historial comercial

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| `POST` | `/api/ventas` | Protagonista verificado | Registrar una venta ya concretada, actualizar existencias e insertar sus detalles en una transacción SQL. |
| `GET` | `/api/ventas/mias` | Protagonista | Consultar las últimas 200 ventas propias. |
| `GET` | `/api/ventas/compras` | Cliente o Protagonista | Consultar ventas asociadas a la cuenta autenticada mediante `id_comprador_usuario`. |
| `GET` | `/api/ventas` | Admin | Consultar las últimas 200 operaciones de la plataforma. |
| `GET` | `/api/ventas/:id` | Admin, vendedor dueño o comprador vinculado | Consultar el encabezado y detalle, con autorización por relación con la operación. |
| `PATCH` | `/api/ventas/:id/anular` | Admin o vendedor dueño | Anular una venta registrada y restaurar las existencias una sola vez. |

Cuerpo de `POST /api/ventas`:

```json
{
  "detalles": [
    { "id_producto": 12, "cantidad": 2 },
    { "id_producto": 18, "cantidad": 1 }
  ],
  "comprador_email": "cliente@ejemplo.com",
  "metodo_pago": "Efectivo",
  "metodo_entrega": "Entrega presencial",
  "observaciones": "Operación acordada en la feria"
}
```

`comprador_email` es opcional. Si se proporciona, debe corresponder a una cuenta `Cliente` o `Protagonista` distinta de la cuenta vendedora; el correo debe haber sido proporcionado por el comprador para vincular el registro a su historial. Si queda vacío, solo el historial del vendedor y la vista administrativa mostrarán esa operación. `detalles` acepta de 1 a 30 productos, cada uno una sola vez. El backend valida que los artículos pertenezcan al protagonista, estén activos y tengan stock suficiente.

La operación completa se guarda en una transacción SQL serializable. Si cualquier línea falla, se revierte la cabecera, los detalles y los cambios de stock. Los precios/nombres quedan copiados en `DETALLE_VENTA` como fotografía histórica. Al anular una venta se cambian estado y existencias en la misma transacción; una venta anulada no puede anularse de nuevo. El estado no se usa como prueba de pago procesado.

### Interacciones y reportes

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| `GET` | `/api/interacciones/mis` | Protagonista | Resumen y hasta 10 interacciones recientes de los productos propios; no expone el correo de visitantes. |
| `POST` | `/api/interacciones` | Público; visitante anónimo o usuario con JWT válido | Registra el clic de contacto por WhatsApp de un producto disponible. |
| `GET` | `/api/reportes/interacciones` | Admin | Devuelve métricas generales, los cinco productos con más interacciones y hasta 200 eventos recientes. |

Cuerpo de `POST /api/interacciones`:

```json
{
  "id_producto": 1,
  "tipo_accion": "Clic en WhatsApp"
}
```

El servidor nunca acepta `id_usuario` desde el cuerpo. Si la solicitud incluye un JWT válido, asocia la interacción con ese usuario; si no, la registra con `id_usuario = NULL`. Solo registra publicaciones activas de perfiles verificados. El endpoint tiene un límite de frecuencia básico para reducir abuso.

Respuesta ilustrativa de `GET /api/reportes/interacciones`:

```json
{
  "reporte": {
    "resumen": {
      "total_interacciones": 1,
      "clics_whatsapp": 1,
      "interacciones_hoy": 1,
      "productos_con_interacciones": 1
    },
    "productos_mas_contactados": [],
    "interacciones": []
  }
}
```

Los números y arreglos anteriores son ilustrativos de la estructura, no datos precargados.

## 5. Probar con Postman

Importa `postman/MEFCCA_Backend.postman_collection.json` en Postman. Ajusta los dos inicios de sesión a las credenciales locales creadas. Ejecuta en este orden general:

1. `01 - Salud de la API y SQL Server` y `02 - Categorías públicas`.
2. Inicia sesión como Admin para obtener `tokenAdmin` y como protagonista para obtener `tokenProtagonista`.
3. Con Admin, consulta perfiles pendientes y aprueba el protagonista de prueba.
4. Con el protagonista aprobado, crea un producto activo; las solicitudes de producto guardan su ID en la variable `productId`.
5. Ejecuta `20 - Registrar interacción de WhatsApp` para registrar una interacción anónima de prueba sobre ese producto.
6. Ejecuta `21 - Reporte administrativo de interacciones` con `tokenAdmin` para ver el resumen y el historial.
7. Ejecuta `22 - Mis interacciones (Protagonista)` con `tokenProtagonista` para comprobar que el panel del emprendimiento consulta solamente actividad de sus propios productos.
8. Registra una cuenta `Cliente` desde el frontend si todavía no existe. En las solicitudes `23 - Login cliente para historial` y `24 - Registrar venta concretada`, usa el correo y contraseña reales de esa misma cuenta. La venta requiere un protagonista verificado, el `productId` generado por una publicación activa y existencias de al menos una unidad.
9. Ejecuta `23` para guardar `tokenCliente`, `24` para crear una venta y guardar `saleId`, luego `25` (ventas propias), `26` (compras del cliente vinculado), `27` (detalle) y `28` (consulta general de Admin). Si la venta se vinculó al correo correcto, aparecerá en la respuesta de `26`.
10. Ejecuta `30 - Reporte administrativo de ventas` con `tokenAdmin`. Ejecuta `29 - Anular venta` solo al final de la prueba: la venta se marca `Anulada` y las existencias se restauran una vez.

La solicitud 20 es anónima intencionalmente porque no lleva encabezado `Authorization`; la interfaz React sí envía su JWT cuando hay una sesión válida. Para verificar ambos comportamientos, compara las filas en SQL Server: las interacciones anónimas tienen `id_usuario = NULL`.

## 6. Consultar interacciones directamente en SQL Server

```sql
USE MEFCCA_DB;
GO

SELECT TOP (50)
    i.id_interaccion,
    p.nombre_producto,
    pr.nombre_negocio,
    i.tipo_accion,
    i.fecha_hora,
    i.id_usuario
FROM dbo.INTERACCIONES AS i
INNER JOIN dbo.PRODUCTOS AS p ON p.id_producto = i.id_producto
INNER JOIN dbo.PROTAGONISTAS AS pr ON pr.id_protagonista = p.id_protagonista
ORDER BY i.fecha_hora DESC, i.id_interaccion DESC;

SELECT
    COUNT_BIG(1) AS total_interacciones,
    SUM(CASE WHEN tipo_accion = N'Clic en WhatsApp' THEN 1 ELSE 0 END) AS clics_whatsapp
FROM dbo.INTERACCIONES;
```

## 7. Seguridad y reglas de negocio

- Consultas SQL parametrizadas; no se concatena entrada de usuario como valor SQL.
- El propietario de producto se deduce del JWT.
- Publicar y reactivar exige un protagonista verificado.
- Cada protagonista solo modifica productos de su perfil.
- Solo Admin gestiona categorías, usuarios y verificación institucional.
- El registro público no admite crear Admin.
- No se devuelve `password_hash` en respuestas.
- Las interacciones no confían en un `id_usuario` enviado por el frontend.
- La desactivación de productos es lógica, para conservar referencias e historial.

## 8. Comprobación y límites de la revisión

```powershell
npm run check
```

Este comando valida la sintaxis JavaScript, pero no sustituye una prueba de integración con la instancia de SQL Server de tu computadora. Después de ejecutar `npm install` y `npm run dev`, prueba el flujo de producto e interacciones con Postman y revisa la consola si una consulta falla.

## Pendiente para cerrar la integración

Ejecutar las pruebas de Postman contra la base local, comprobar la interfaz desde los tres roles y validar los casos de error (stock insuficiente, doble anulación, detalle de operación ajena y venta por perfil no verificado). El despliegue público se realiza como fase separada.
