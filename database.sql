-- Tabla 1: USUARIOS
CREATE TABLE USUARIOS (
    id_usuario SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('Admin', 'Protagonista', 'Cliente')) DEFAULT 'Cliente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 2: PROTAGONISTAS
-- Un usuario puede tener un perfil de protagonista
CREATE TABLE PROTAGONISTAS (
    id_protagonista SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    nombre_negocio VARCHAR(100) NOT NULL,
    telefono_whatsapp VARCHAR(20) NOT NULL,
    departamento VARCHAR(50) NOT NULL,
    descripcion_negocio TEXT,
    estado_verificacion BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE CASCADE
);

-- Tabla 3: CATEGORIAS
CREATE TABLE CATEGORIAS (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- Tabla 4: PRODUCTOS
-- Un producto pertenece a un protagonista y a una categoría
CREATE TABLE PRODUCTOS (
    id_producto SERIAL PRIMARY KEY,
    id_protagonista INT NOT NULL,
    id_categoria INT NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    imagen VARCHAR(255),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('Activo', 'Inactivo')) DEFAULT 'Activo',
    FOREIGN KEY (id_protagonista) REFERENCES PROTAGONISTAS(id_protagonista) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES CATEGORIAS(id_categoria) ON DELETE RESTRICT
);

-- Tabla 5: INTERACCIONES
-- Permite registrar las acciones realizadas sobre los productos (clics en WhatsApp)
CREATE TABLE INTERACCIONES (
    id_interaccion SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    id_usuario INT, -- Puede ser NULL si el visitante no está autenticado
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_accion VARCHAR(50) NOT NULL DEFAULT 'Clic en WhatsApp',
    FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE SET NULL
);
