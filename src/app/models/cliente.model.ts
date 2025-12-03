export interface Cliente {
  id?: string;
  nombres: string;
  cedula: string;
  fecha_nacimiento: string;
  telefono: string;
  correo: string;
  fecha_registro?: string;
  es_referido?: boolean;
  cliente_referidor_id?: string | null;
  cashback_acumulado?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClienteCompra {
  id?: string;
  cliente_id: string;
  tipo_lente: TipoLente;
  tipo_montura: TipoMontura;
  rango_precio: RangoPrecio;
  fecha_compra?: string;
  created_at?: string;
}

// Tipos para los enums de compras
export type TipoLente =
  | 'Mono ArBlue'
  | 'Mono FotoBlue'
  | 'Mono Transitions'
  | 'Mono Transitions Colores'
  | 'Progresivo Media ArBlue'
  | 'Progresivo Media FotoBlue'
  | 'Progresivo Digital ArBlue'
  | 'Progresivo Digital FotoBlue'
  | 'Bifocal Invisible ArBlue'
  | 'Bifocal Invisible FotoBlue'
  | 'Sin Lente';

export type TipoMontura = 'Clásica' | 'Premium' | 'Sin Montura';

export type RangoPrecio =
  | '0 - 100.000'
  | '100.000 - 200.000'
  | '200.000 - 300.000'
  | '300.000 - 400.000'
  | '400.000 - 500.000'
  | '500.000 - 600.000'
  | '600.000 - 700.000'
  | '700.000 - 800.000'
  | '800.000 - 900.000'
  | '900.000 - 1.000.000'
  | '1.000.000 - 1.100.000'
  | '1.100.000 - 1.200.000'
  | '1.200.000 - 1.300.000'
  | '1.300.000 - 1.400.000'
  | '1.400.000 - 1.500.000';

// Arrays con todas las opciones para dropdowns
export const TIPOS_LENTE: TipoLente[] = [
  'Mono ArBlue',
  'Mono FotoBlue',
  'Mono Transitions',
  'Mono Transitions Colores',
  'Progresivo Media ArBlue',
  'Progresivo Media FotoBlue',
  'Progresivo Digital ArBlue',
  'Progresivo Digital FotoBlue',
  'Bifocal Invisible ArBlue',
  'Bifocal Invisible FotoBlue',
  'Sin Lente',
];

export const TIPOS_MONTURA: TipoMontura[] = [
  'Clásica',
  'Premium',
  'Sin Montura',
];

export const RANGOS_PRECIO: RangoPrecio[] = [
  '0 - 100.000',
  '100.000 - 200.000',
  '200.000 - 300.000',
  '300.000 - 400.000',
  '400.000 - 500.000',
  '500.000 - 600.000',
  '600.000 - 700.000',
  '700.000 - 800.000',
  '800.000 - 900.000',
  '900.000 - 1.000.000',
  '1.000.000 - 1.100.000',
  '1.100.000 - 1.200.000',
  '1.200.000 - 1.300.000',
  '1.300.000 - 1.400.000',
  '1.400.000 - 1.500.000',
];

export interface ClienteReferido {
  id?: string;
  cliente_referidor_id: string;
  cliente_referido_id: string;
  fecha_referido: string;
  estado: 'activo' | 'inactivo';
  created_at?: string;
}
