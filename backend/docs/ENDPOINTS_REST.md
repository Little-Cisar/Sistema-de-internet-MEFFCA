# Contrato REST — MEFCCA (autenticación, catálogo, perfiles y administración)

Base local: `http://localhost:3000/api`. Respuestas JSON. Las rutas privadas requieren `Authorization: Bearer <JWT>`.

## Autenticación

- `POST /auth/registro` — público; registra Cliente o Protagonista. No admite crear Admin. Un protagonista queda pendiente de verificación.
- `POST /auth/login` — público; verifica credenciales y devuelve JWT.
- `GET /auth/perfil` — autenticado; devuelve la cuenta actual y, cuando corresponda, los datos del perfil protagonista.

## Productos

- `GET /productos?q=&id_categoria=&id_protagonista=&min_precio=&max_precio=&page=1&limit=100&orden=recientes` — público; devuelve `{ productos, paginacion }`. Solo activos de protagonistas verificados.
- `GET /productos/:id` — público; detalle de producto activo publicado.
- `GET /productos/mios` — Protagonista; productos propios activos e inactivos.
- `POST /productos` — Protagonista verificado; recibe `nombre_producto`, `id_categoria`, `precio`, `stock_actual`, con `descripcion` e `imagen` opcionales.
- `PUT /productos/:id` — propietario protagonista; actualiza los datos del producto.
- `PATCH /productos/:id/estado` — propietario protagonista; recibe `{ "estado": "Activo" | "Inactivo" }`. Para reactivar, el perfil debe estar verificado.
- `DELETE /productos/:id` — propietario protagonista; baja lógica (cambia a Inactivo, no borra el registro).

## Categorías

- `GET /categorias` — público; devuelve `{ categorias, total }`.
- `POST /categorias` — Admin; recibe `{ "nombre_categoria": "...", "descripcion": "..." }`.
- `PUT /categorias/:id` — Admin; edita una categoría. No se implementa borrado físico porque los productos mantienen una clave foránea hacia categorías.

## Perfiles de protagonistas

- `GET /protagonistas` — público; lista solo perfiles verificados, con datos básicos y recuento de productos activos.
- `GET /protagonistas/:id` — público; consulta un perfil público verificado. Devuelve 404 para perfiles pendientes/no publicados.
- `GET /protagonistas/me` — Protagonista autenticado; devuelve su propio perfil, incluido estado de verificación y correo de la cuenta.
- `PUT /protagonistas/:id` — Protagonista autenticado; actualiza solo el perfil cuyo propietario coincide con el token. Campos editables: `nombre_negocio`, `telefono_whatsapp`, `departamento`, `descripcion_negocio`.

## Administración

Todos estos endpoints requieren JWT y rol `Admin`.

- `GET /admin/usuarios` — lista cuentas con `id_usuario`, `email`, `rol` y `fecha_creacion`; nunca devuelve `password_hash`.
- `GET /admin/protagonistas/pendientes` — lista perfiles que necesitan verificación institucional.
- `PATCH /admin/protagonistas/:id/verificacion` — recibe `{ "estado_verificacion": true | false }` para verificar o devolver un perfil al estado pendiente.

## Ventas e historial comercial

- `POST /ventas` — requiere JWT y rol `Protagonista`; además exige que el perfil esté verificado. Registra de 1 a 30 productos activos que pertenezcan al vendedor, valida el stock e inserta venta/detalles y descuento de existencias en una transacción. El cuerpo admite `comprador_email` opcional (cuenta Cliente o Protagonista distinta del vendedor), `metodo_pago`, `metodo_entrega`, `observaciones` y el arreglo `detalles` con `id_producto` y `cantidad`.
- `GET /ventas/mias` — requiere JWT y rol `Protagonista`; devuelve hasta 200 ventas propias, incluyendo anuladas para conservar el historial.
- `GET /ventas/compras` — requiere JWT y rol `Cliente` o `Protagonista`; devuelve hasta 200 ventas vinculadas al usuario autenticado.
- `GET /ventas` — requiere JWT y rol `Admin`; devuelve hasta 200 operaciones de la plataforma.
- `GET /ventas/:id` — requiere JWT; solo responde a Admin, al protagonista vendedor dueño de la operación o al comprador vinculado.
- `PATCH /ventas/:id/anular` — requiere JWT y rol `Admin` o `Protagonista`; solo el dueño vendedor o Admin pueden anularla. El backend restaura las existencias y evita anular dos veces.

La aplicación registra operaciones una vez concretadas fuera del sitio (por ejemplo, a través de WhatsApp o presencialmente). No procesa pagos, no crea pedidos pendientes y no acredita que el pago se haya recibido. Vincular `comprador_email` requiere que el comprador haya proporcionado ese correo para aparecer en su historial.

## Interacciones y reportes

- `GET /interacciones/mis` — requiere JWT y rol `Protagonista`; devuelve métricas y hasta 10 interacciones recientes solamente de productos pertenecientes al usuario autenticado.
- `POST /interacciones` — público; acepta visita anónima o usuario autenticado. Recibe `id_producto` y `tipo_accion` (actualmente `Clic en WhatsApp`). El id de usuario, si existe, se obtiene del token y nunca del cuerpo. Solo registra publicaciones activas de protagonistas verificados.
- `GET /reportes/interacciones` — requiere JWT y rol `Admin`. Devuelve métricas generales, los cinco productos con más interacciones y hasta 200 eventos recientes.
- `GET /reportes/ventas` — requiere JWT y rol `Admin`. Devuelve recuentos de operaciones registradas/anuladas, importe de las ventas no anuladas, ventas del día y cinco productos con más unidades vendidas.

## Códigos de respuesta relevantes

- `200`: consulta o actualización correcta.
- `201`: registro creado.
- `400`: datos inválidos o relación referenciada que no existe.
- `401`: falta un JWT válido.
- `403`: rol insuficiente, perfil no verificado o recurso ajeno.
- `404`: recurso inexistente o no disponible públicamente.
- `409`: valor único duplicado, como correo o nombre de categoría.

## Estado de esta versión

Las rutas principales de autenticación, catálogo, perfiles, verificación, interacciones, reportes, ventas e historial comercial están documentadas. Aún es obligatorio ejecutar las pruebas de integración contra la instancia SQL Server local y comprobar la interfaz en el navegador antes de considerar la entrega lista para revisión.
