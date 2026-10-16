# Scripts de base de datos

- `01_crear_MEFCCA_DB_SQLServer2022.sql`: crea el esquema inicial de `MEFCCA_DB` con tablas, relaciones, restricciones, índices, datos iniciales de categorías y la vista comercial incluida en el diseño.
- `02_verificar_modulo_ventas.sql`: consulta de solo lectura para comprobar objetos requeridos para ventas.

Usar el script de creación en una instancia/base de desarrollo nueva. Para cambios de estructura posteriores, preparar scripts de migración incrementales y no depender de recrear toda la base.
