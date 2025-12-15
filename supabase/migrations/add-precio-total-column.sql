-- Migration: Agregar columnas precio_total y abono a cliente_compras
-- Fecha: 2024
-- Descripción: Agrega campos opcionales para registrar el precio exacto y abono de cada compra

-- Agregar la columna precio_total a la tabla cliente_compras
ALTER TABLE cliente_compras
ADD COLUMN IF NOT EXISTS precio_total INTEGER;

-- Agregar la columna abono a la tabla cliente_compras
ALTER TABLE cliente_compras
ADD COLUMN IF NOT EXISTS abono INTEGER;

-- Comentarios para documentación
COMMENT ON COLUMN cliente_compras.precio_total IS 'Precio exacto de la compra en COP (opcional)';
COMMENT ON COLUMN cliente_compras.abono IS 'Abono inicial del cliente en COP (opcional)';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cliente_compras'
AND column_name IN ('precio_total', 'abono');
