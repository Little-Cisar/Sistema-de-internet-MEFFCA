# Sistema de Información Web para la Gestión de Compras y Ventas de los Miembros del MEFCCA

Proyecto académico de Diseño de Sistemas en Internet.

## Estructura

- `frontend/`: interfaz web React + Vite.
- `backend/`: API REST Node.js + Express, autenticación JWT, acceso a SQL Server, OpenAPI y colección Postman.
- `database/`: scripts SQL para crear el esquema y verificar objetos del módulo comercial.
- `docs/`: documentación general adicional del proyecto.

## Requisitos locales

- Node.js y npm compatibles con la versión indicada en los `package.json`.
- SQL Server 2022 y SQL Server Management Studio (SSMS).
- Postman (opcional, recomendado para probar los endpoints).

## Preparar la base de datos

1. En una instancia de SQL Server para desarrollo, abre y ejecuta `database/01_crear_MEFCCA_DB_SQLServer2022.sql` para crear la base y el esquema inicial.
2. Configura un login de aplicación de SQL Server con permisos mínimos necesarios. No utilices `sa` desde el backend.
3. Para verificar la estructura del módulo de ventas de una base ya existente, ejecuta `database/02_verificar_modulo_ventas.sql`; este script es de solo lectura.
4. No vuelvas a ejecutar un script de creación como mecanismo de actualización de una base con datos reales. Usa scripts de migración revisados y copia de seguridad.

El repositorio contiene scripts SQL, no una copia física de la base. No se deben subir archivos `.mdf`, `.ldf`, `.bak`, datos privados ni credenciales.

## Preparar el backend

1. Abre `backend/` en una terminal.
2. Copia `.env.example` como `.env` y completa la configuración local de SQL Server y un `JWT_SECRET` aleatorio.
3. Instala y ejecuta:

```powershell
npm install
npm run check
npm run dev
```

La API local se espera en `http://localhost:3000`. Consulta `backend/docs/openapi.yaml`, `backend/docs/ENDPOINTS_REST.md` y `backend/postman/MEFCCA_Backend.postman_collection.json`.

## Preparar el frontend

En otra terminal, dentro de `frontend/`:

```powershell
npm install
npm run dev
```

Vite normalmente mostrará `http://localhost:5173`. El archivo `frontend/.env.example` documenta la configuración de la API para desarrollo.

## Seguridad y archivos que NO deben subirse

- Nunca subir `.env`, claves, tokens, contraseñas ni datos personales reales.
- Mantener los archivos `.env.example` con valores ficticios/indicativos.
- No subir `node_modules/`, `dist/`, copias de bases de datos o backups.
- Revisar `git status` antes de cada commit.

## Flujo de contribución

Cada integrante debe trabajar en tareas que comprenda, probar sus cambios y registrarlos con commits que describan el trabajo real. No crear commits ficticios ni atribuir a una persona trabajo que no realizó.
