-- Fix for check constraint violations in cliente_compras table
-- This script updates the allowed values for 'tipo_lente' and 'tipo_montura' to match the application code.
-- It also includes LEGACY values ('Clásica', 'Premium') to prevent increasing violations for existing data.

-- 1. Update tipo_lente constraint
ALTER TABLE public.cliente_compras DROP CONSTRAINT IF EXISTS cliente_compras_tipo_lente_check;

ALTER TABLE public.cliente_compras ADD CONSTRAINT cliente_compras_tipo_lente_check CHECK (
  tipo_lente::text = ANY (ARRAY[
    -- Nuevos valores
    'Poli Blanco'::text,
    'Poli ArVerde'::text,
    'Poli ArBlue'::text,
    'Poli FotoBlue'::text,

    -- Valores existentes
    'Mono ArBlue'::text,
    'Mono ArVerde'::text,
    'Mono FotoBlue'::text,
    'Mono Transitions'::text,
    'Mono Transitions Colores'::text,
    'Progresivo Basico ArBlue'::text,
    'Progresivo Basico FotoBlue'::text,
    'Progresivo Basico Transitions'::text,
    'Progresivo Medio ArBlue'::text,
    'Progresivo Medio FotoBlue'::text,
    'Progresivo Medio Transitions'::text,
    'Progresivo Alto ArBlue'::text,
    'Progresivo Alto FotoBlue'::text,
    'Progresivo Alto Transitions'::text,
    'Progresivo Premium ArBlue'::text,
    'Progresivo Premium FotoBlue'::text,
    'Progresivo Premium Transitions'::text,
    'Bifocal Invisible ArBlue'::text,
    'Bifocal Invisible FotoBlue'::text,
    'Sin Lente'::text
  ])
);

-- 2. Update tipo_montura constraint
ALTER TABLE public.cliente_compras DROP CONSTRAINT IF EXISTS cliente_compras_tipo_montura_check;

ALTER TABLE public.cliente_compras ADD CONSTRAINT cliente_compras_tipo_montura_check CHECK (
  tipo_montura::text = ANY (ARRAY[
    -- Valores nuevos
    'Clásica 1'::text,
    'Clásica 2'::text,
    'Clásica 3'::text,
    'Taizu'::text,
    'Fento'::text,
    'MH'::text,
    'Lacoste'::text,
    'CK'::text,
    'RayBan'::text,
    'Sin Montura'::text,

    -- Valores antiguos (LEGACY - necesarios para datos existentes)
    'Clásica'::text,
    'Premium'::text
  ])
);
