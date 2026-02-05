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
  cliente_abonos?: ClienteAbono[];
  seccion?: Seccion;
  fecha_compra?: string;
  metodo_pago?: MetodoPago;
  tipo_compra?: TipoCompra;
  nota_pago?: string;
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
  | 'Mono Crizal'
  | 'Mono FotoBlue'
  | 'Mono Transitions'
  | 'Mono Transitions Colores'
  | 'Mono Transitions Crizal'
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
  | 'Progresivo Premium Transitions Crizal'
  | 'Bifocal Invisible ArBlue'
  | 'Bifocal Invisible FotoBlue'
  | 'Sin Lente';

export type TipoMontura =
  | 'Clásica 1'
  | 'Clásica 2'
  | 'Clásica 3'
  | 'Clásica 4'
  | 'Clásica' // For sunglasses
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

export type Seccion =
  | 'Labradorita'
  | 'Piedras Preciosas'
  | 'Cianita'
  | 'Obsidiana'
  | 'Cuarzo'
  | 'Citrino'
  | 'Sin Seccion';

export type MetodoPago =
  | 'Bancolombia'
  | 'Addi'
  | 'Bold'
  | 'Efectivo'
  | 'Nequi'
  | 'Daviplata'
  | 'Acuerdo interno';

export type TipoCompra =
  | 'Gafas formuladas'
  | 'Gafas de sol'
  | 'Consulta optometria';

export const TIPOS_LENTE: TipoLente[] = [
  'Mono ArBlue',
  'Mono ArVerde',
  'Mono Crizal',
  'Mono FotoBlue',
  'Mono Transitions',
  'Mono Transitions Colores',
  'Mono Transitions Crizal',
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
  'Progresivo Premium Transitions Crizal',
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
  'Clásica 4',
  'Clásica', // For sunglasses
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

export const SECCIONES: Seccion[] = [
  'Labradorita',
  'Piedras Preciosas',
  'Cianita',
  'Obsidiana',
  'Cuarzo',
  'Citrino',
  'Sin Seccion',
];

export const METODOS_PAGO: MetodoPago[] = [
  'Bancolombia',
  'Addi',
  'Bold',
  'Efectivo',
  'Nequi',
  'Daviplata',
  'Acuerdo interno',
];

export const TIPOS_COMPRA: TipoCompra[] = [
  'Gafas formuladas',
  'Gafas de sol',
  'Consulta optometria',
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
