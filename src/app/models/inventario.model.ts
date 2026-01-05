import { Seccion, TipoMontura } from './cliente.model';

export type TipoMovimientoInventario =
  | 'entrada'
  | 'salida'
  | 'venta'
  | 'ajuste';

export interface InventarioSeccion {
  id?: string;
  nombre: Seccion | 'Piedras Preciosas';
  stock_actual: number;
  stock_minimo?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventarioMovimiento {
  id?: string;
  seccion_id?: string | null;
  seccion_nombre?: string; // conveniencia para UI
  cliente_nombre?: string; // nombre del cliente desde compra
  tipo_montura?: TipoMontura | null;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  monto?: number | null;
  nota?: string | null;
  referencia?: string | null;
  created_by?: string | null;
  created_at?: string;
}

export interface InventarioDashboard {
  periodo: 'day' | 'week' | 'month';
  monturas_vendidas: number;
  entradas: number;
  salidas: number;
  ajustes: number;
  dinero_acumulado: number;
  dinero_real_entrado: number; // Dinero que realmente entró (abonos o total si está pagado)
  dinero_pendiente: number; // Lo que aún deben los clientes
}

export interface ClienteDeudor {
  cliente_id: string;
  cliente_nombre: string;
  cliente_cedula: string;
  total_compras: number;
  total_abonado: number;
  saldo_pendiente: number;
  compras_pendientes: number;
}
