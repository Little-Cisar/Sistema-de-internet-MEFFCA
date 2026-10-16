# Frontend MEFCCA — Manos de Nicaragua

Interfaz React + Vite para el proyecto **Sistema de Información Web para la Gestión de Compras y Ventas de los Miembros del MEFCCA**. Está pensada como un mercado digital de emprendimientos nicaragüenses, no como un dashboard corporativo genérico.

## Tecnologías

- React y Vite
- React Router DOM
- Axios para consumir la API REST
- Context API para la sesión
- CSS tradicional responsive (sin Bootstrap ni Tailwind)
- Lucide React para iconografía

## Requisitos

- Node.js LTS y npm.
- El backend Node/Express debe ejecutarse en `http://localhost:3000`.
- Visual Studio Code es suficiente. No se necesita instalar otra IDE.

## Instalar y ejecutar

1. Descomprimir el proyecto y abrir la carpeta `MEFCCA_Frontend` desde VS Code.
2. Abrir **Terminal > New Terminal**.
3. Ejecutar:

   ```powershell
   npm install
   npm run dev
   ```

4. Abrir `http://localhost:5173`.
5. En otra terminal, dejar el backend ejecutándose con `npm run dev` desde su carpeta.

Vite reenvía las peticiones `/api` a `http://localhost:3000`, por lo que no hace falta modificar CORS en el backend durante el desarrollo local.

## Integración real y estado actual

La interfaz consulta la API; no usa productos inventados como si fueran registros reales. Para que los productos sean públicos, el protagonista debe estar verificado por una cuenta Admin y la publicación debe tener estado `Activo`.

### Endpoints disponibles en el backend 1.4.0

- Salud y autenticación: `GET /api/health`, `POST /api/auth/registro`, `POST /api/auth/login`, `GET /api/auth/perfil`.
- Productos: `GET /api/productos`, `GET /api/productos/:id`, `GET /api/productos/mios`, `POST /api/productos`, `PUT /api/productos/:id`, `PATCH /api/productos/:id/estado`, `DELETE /api/productos/:id` (desactivación lógica).
- Categorías: `GET /api/categorias`, `POST /api/categorias` y `PUT /api/categorias/:id`.
- Perfiles: `GET /api/protagonistas`, `GET /api/protagonistas/:id`, `GET /api/protagonistas/me` y `PUT /api/protagonistas/:id`.
- Administración: `GET /api/admin/usuarios`, `GET /api/admin/protagonistas/pendientes`, `PATCH /api/admin/protagonistas/:id/verificacion`.
- Interacciones e informes: `POST /api/interacciones`, `GET /api/interacciones/mis`, `GET /api/reportes/interacciones` y `GET /api/reportes/ventas` (reportes solo Admin).
- Operaciones comerciales: `POST /api/ventas`, `GET /api/ventas/mias`, `GET /api/ventas/compras`, `GET /api/ventas` (solo Admin), `GET /api/ventas/:id` y `PATCH /api/ventas/:id/anular`.

### Alcance del módulo comercial

El protagonista registra una venta después de que comprador y vendedor hayan acordado la operación fuera del sitio. La API ajusta el inventario dentro de una transacción SQL, conserva nombre y precio históricos por línea y permite consultar o anular la operación. Si la venta se vincula al correo proporcionado por el comprador, se verá en su historial. No hay carrito, pedidos pendientes ni procesamiento de pagos en línea.

## Pruebas básicas

- Abre `http://localhost:5173` y verifica que carga la portada.
- Abre `/login` para probar inicio de sesión con la API real.
- Abre `/registro` y prueba el registro.
- Si el catálogo está vacío, confirma que se haya activado un protagonista de prueba y que tenga productos en estado `Activo`. Si una ruta falla, revisa la respuesta de la API, la consola del backend y la conexión con SQL Server. Un perfil pendiente de verificación no puede publicar; el administrador debe aprobarlo primero.
- Comprueba producción del frontend sin publicarlo con `npm run build`.

## Extensiones de VS Code (opcionales)

No es obligatorio instalar extensiones para que el proyecto funcione. **Prettier - Code formatter** ayuda a mantener el formato, pero es opcional. Postman puede utilizarse como aplicación independiente para probar la API; tampoco es necesario instalar una extensión de VS Code.

## Seguridad

- El token se mantiene en `sessionStorage` durante la sesión del navegador; esto no sustituye medidas de seguridad del backend.
- Las rutas privadas del frontend mejoran la navegación, pero la autorización real siempre debe verificarse en la API.
- El registro público permite únicamente Cliente o Protagonista. Nunca se ofrece crear cuentas Admin desde la interfaz pública.
- No colocar contraseñas, secretos JWT ni credenciales SQL en variables `VITE_*`: cualquier variable Vite puede terminar en el bundle visible para el navegador.


## Integración de perfiles y administración

Esta versión del frontend consume el directorio de protagonistas verificados (`GET /api/protagonistas`), el detalle de perfil (`GET /api/protagonistas/:id`), el perfil propio (`GET /api/protagonistas/me`) y el guardado de perfil (`PUT /api/protagonistas/:id`). Las vistas administrativas de usuarios y verificación consumen `/api/admin/usuarios`, `/api/admin/protagonistas/pendientes` y `/api/admin/protagonistas/:id/verificacion`.

Para que un perfil aparezca en el directorio y sus productos sean públicos, el administrador debe verificarlo. Las cuentas de prueba se crean localmente y sus credenciales no deben subir al repositorio.

Los reportes de interacciones y ventas, la actividad reciente del protagonista, el historial de ventas propias, el historial de compras vinculadas y la consulta administrativa de operaciones consumen endpoints del backend 1.4.0. Las ventas se registran después de una operación acordada fuera del sitio; no existe procesamiento de pagos ni checkout en línea.
