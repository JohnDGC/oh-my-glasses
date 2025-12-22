-- Add seccion column to cliente_compras table
ALTER TABLE public.cliente_compras
ADD COLUMN seccion text;

-- Add check constraint for valid sections
ALTER TABLE public.cliente_compras
ADD CONSTRAINT cliente_compras_seccion_check CHECK (
  seccion IS NULL OR seccion IN (
    'Labradorita',
    'Piedras Preciosas',
    'Cianita',
    'Obsidiana',
    'Cuarzo',
    'Citrino'
  )
);

COMMENT ON COLUMN cliente_compras.seccion IS 'Sección del producto (opcional)';
