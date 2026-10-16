# Permisos SQL necesarios

El backend se conecta mediante Autenticación de SQL Server. Crear un login dedicado para la aplicación y mapearlo como usuario de `MEFCCA_DB`. Para desarrollo se sugieren los roles de base de datos `db_datareader` y `db_datawriter`; no conceder `sysadmin` ni usar el login `sa`.

No guardar contraseñas reales en scripts compartidos o Git. La contraseña configurada en SQL Server debe coincidir con `DB_PASSWORD` en el `.env` local, que está excluido de Git.
