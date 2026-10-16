/* Script de SOLO LECTURA para comprobar que la base MEFCCA_DB contiene el
   esquema esperado por el módulo de ventas. No crea, altera ni elimina datos. */
USE [MEFCCA_DB];
GO

SELECT objeto, disponible
FROM (VALUES
    (N'dbo.VENTAS', CASE WHEN OBJECT_ID(N'dbo.VENTAS', N'U') IS NOT NULL THEN N'SÍ' ELSE N'NO' END),
    (N'dbo.DETALLE_VENTA', CASE WHEN OBJECT_ID(N'dbo.DETALLE_VENTA', N'U') IS NOT NULL THEN N'SÍ' ELSE N'NO' END),
    (N'dbo.vw_ventas_con_total', CASE WHEN OBJECT_ID(N'dbo.vw_ventas_con_total', N'V') IS NOT NULL THEN N'SÍ' ELSE N'NO' END)
) AS estado(objeto, disponible);
GO

SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = N'dbo'
  AND TABLE_NAME IN (N'VENTAS', N'DETALLE_VENTA')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
GO
