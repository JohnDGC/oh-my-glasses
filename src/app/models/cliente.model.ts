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
  cashback_redimido?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClienteCompra {
  id?: string;
  cliente_id: string;
  tipo_lente: TipoLente;
  tipo_montura: TipoMontura;
  rango_precio: RangoPrecio;
  precio_total?: number;
  abono?: number;
  abonos?: ClienteAbono[];
  fecha_compra?: string;
  created_at?: string;
}

export interface ClienteAbono {
  id?: string;
  compra_id: string;
  monto: number;
  fecha_abono: string;
  nota?: string;
  created_at?: string;
}

export type TipoLente =
  | 'Mono ArBlue'
  | 'Mono ArVerde'
  | 'Mono FotoBlue'
  | 'Mono Transitions'
  | 'Mono Transitions Colores'
  | 'Poli Blanco'
  | 'Poli ArVerde'
  | 'Poli ArBlue'
  | 'Poli FotoBlue'
  | 'Progresivo Basico ArBlue'
  | 'Progresivo Basico FotoBlue'
  | 'Progresivo Basico Transitions'
  | 'Progresivo Medio ArBlue'
  | 'Progresivo Medio FotoBlue'
  | 'Progresivo Medio Transitions'
  | 'Progresivo Alto ArBlue'
  | 'Progresivo Alto FotoBlue'
  | 'Progresivo Alto Transitions'
  | 'Progresivo Premium ArBlue'
  | 'Progresivo Premium FotoBlue'
  | 'Progresivo Premium Transitions'
  | 'Bifocal Invisible ArBlue'
  | 'Bifocal Invisible FotoBlue'
  | 'Sin Lente';

export type TipoMontura =
  | 'Clásica 1'
  | 'Clásica 2'
  | 'Clásica 3'
  | 'Taizu'
  | 'Fento'
  | 'MH'
  | 'Lacoste'
  | 'CK'
  | 'RayBan'
  | 'Sin Montura';

export type RangoPrecio =
  | '$0 - $300.000'
  | '$300.000 - $600.000'
  | '$600.000 - $1.000.000'
  | '$1.000.000 - $1.500.000'
  | '$1.500.000 - $2.000.000'
  | '$2.000.000 en adelante';

export const TIPOS_LENTE: TipoLente[] = [
  'Mono ArBlue',
  'Mono ArVerde',
  'Mono FotoBlue',
  'Mono Transitions',
  'Mono Transitions Colores',
  'Poli Blanco',
  'Poli ArVerde',
  'Poli ArBlue',
  'Poli FotoBlue',
  'Progresivo Basico ArBlue',
  'Progresivo Basico FotoBlue',
  'Progresivo Basico Transitions',
  'Progresivo Medio ArBlue',
  'Progresivo Medio FotoBlue',
  'Progresivo Medio Transitions',
  'Progresivo Alto ArBlue',
  'Progresivo Alto FotoBlue',
  'Progresivo Alto Transitions',
  'Progresivo Premium ArBlue',
  'Progresivo Premium FotoBlue',
  'Progresivo Premium Transitions',
  'Bifocal Invisible ArBlue',
  'Bifocal Invisible FotoBlue',
  'Sin Lente',
];

export const TIPOS_MONTURA: TipoMontura[] = [
  'Clásica 1',
  'Clásica 2',
  'Clásica 3',
  'Taizu',
  'Fento',
  'MH',
  'Lacoste',
  'CK',
  'RayBan',
  'Sin Montura',
];

export const RANGOS_PRECIO: RangoPrecio[] = [
  '$0 - $300.000',
  '$300.000 - $600.000',
  '$600.000 - $1.000.000',
  '$1.000.000 - $1.500.000',
  '$1.500.000 - $2.000.000',
  '$2.000.000 en adelante',
];

export interface ClienteReferido {
  id?: string;
  cliente_referidor_id: string;
  cliente_referido_id: string;
  fecha_referido: string;
  estado: 'activo' | 'redimido';
  cashback_generado?: number;
  rango_precio_compra?: string;
  fecha_redimido?: string;
  created_at?: string;
}
