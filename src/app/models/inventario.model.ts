import { Seccion, TipoMontura, TipoCompra } from './cliente.model';

// ============================================================================
// NEW INVENTORY SYSTEM - MODELS (February 2026 Redesign)
// ============================================================================

// Movement types for the new system (focus on stock only)
export type TipoMovimientoNuevo = 'reestock' | 'adicion' | 'venta';

// Operation types for historical tracking
export type TipoOperacion = 'reestock_global' | 'adicion_minima';

/**
 * InventarioConfiguracion - System configuration
 */
export interface InventarioConfiguracion {
  id?: string;
  clave: string;
  valor: string;
  descripcion?: string;
  tipo_dato: 'date' | 'boolean' | 'number' | 'text';
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// MAIN INVENTORY MODELS
// ============================================================================

/**
 * InventarioStock - Main stock table
 * One row per section/frame/tipo_compra combination with periodic tracking
 */
export interface InventarioStock {
  id?: string;
  seccion: Seccion | 'Piedras Preciosas';
  tipo_montura: TipoMontura;
  tipo_compra: TipoCompra; // NEW: Differentiate prescription glasses vs sunglasses
  stock_inicial: number; // Stock at beginning of current period
  stock_agregado: number; // Stock added during period (restock + additions)
  stock_salidas: number; // Stock sold during period
  stock_actual: number; // Calculated: inicial + agregado - salidas
  stock_minimo: number; // Alert threshold
  periodo_inicio: string; // When current period started
  created_at?: string;
  updated_at?: string;
}

/**
 * HistoricoPeriodo - Historical snapshots of restock operations
 */
export interface HistoricoPeriodo {
  id?: string;
  tipo_operacion: TipoOperacion;
  descripcion?: string;
  fecha_operacion: string;
  created_by?: string;
  detalles: PeriodoDetalles;
  created_at?: string;
}

/**
 * PeriodoDetalles - JSONB structure for historical snapshots
 */
export interface PeriodoDetalles {
  periodo_anterior: {
    inicio: string;
    fin: string;
  };
  stock_por_montura: StockSnapshot[];
  totales: {
    total_inicial: number;
    total_agregado: number;
    total_salidas: number;
    total_final: number;
  };
  nota?: string;
}

/**
 * StockSnapshot - Individual frame stock at a point in time
 */
export interface StockSnapshot {
  seccion: string;
  tipo_montura: string;
  stock_inicial: number;
  stock_agregado: number;
  stock_salidas: number;
  stock_final: number;
}

/**
 * MovimientoDetalle - Detailed movement log
 */
export interface MovimientoDetalle {
  id?: string;
  operacion_id?: string | null;
  seccion: Seccion | 'Piedras Preciosas';
  tipo_montura: TipoMontura;
  tipo_compra: TipoCompra; // NEW: Track if movement is for prescription or sunglasses
  tipo_movimiento: TipoMovimientoNuevo;
  cantidad: number; // Always positive (direction implicit in tipo_movimiento)
  nota?: string | null;
  referencia_compra_id?: string | null; // FK to cliente_compras (for sales)
  cliente_nombre?: string | null; // Denormalized for easier querying
  created_at?: string;
}

// ============================================================================
// UI/DISPLAY MODELS
// ============================================================================

/**
 * StockCard - Grouped data for UI cards
 */
export interface StockCard {
  seccion: Seccion | 'Piedras Preciosas';
  periodo_inicio: string;
  monturas: StockMonturaDisplay[];
  totales: {
    stock_inicial: number;
    stock_agregado: number;
    stock_salidas: number;
    stock_actual: number;
  };
}

/**
 * StockMonturaDisplay - Individual frame display in card
 */
export interface StockMonturaDisplay {
  tipo_montura: TipoMontura;
  tipo_compra: TipoCompra; // NEW: Show if it's prescription or sunglasses
  stock_inicial: number;
  stock_agregado: number;
  stock_salidas: number;
  stock_actual: number;
  stock_minimo: number;
  alerta: boolean; // true if stock_actual < stock_minimo
}

/**
 * ReestockGlobalData - DTO for global restock operation
 */
export interface ReestockGlobalData {
  descripcion?: string;
  stock_nuevo: ReestockItem[];
}

/**
 * ReestockItem - Individual frame restock data
 */
export interface ReestockItem {
  seccion: Seccion | 'Piedras Preciosas';
  tipo_montura: TipoMontura;
  tipo_compra: TipoCompra; // NEW: Specify if restocking prescription or sunglasses
  cantidad_nueva: number; // New stock to add
}

/**
 * AdicionEspecificaData - DTO for specific addition
 */
export interface AdicionEspecificaData {
  seccion: Seccion | 'Piedras Preciosas';
  tipo_montura: TipoMontura;
  tipo_compra: TipoCompra; // NEW: Specify if adding prescription or sunglasses
  cantidad: number;
  nota?: string;
}

// ============================================================================
// DEPRECATED MODELS (Keep for backward compatibility during migration)
// ============================================================================

/** @deprecated Use InventarioStock instead */
export type TipoMovimientoInventario =
  | 'entrada'
  | 'salida'
  | 'venta'
  | 'ajuste';

/** @deprecated Use InventarioStock instead */
export interface InventarioSeccion {
  id?: string;
  nombre: Seccion | 'Piedras Preciosas';
  stock_actual: number;
  stock_minimo?: number;
  created_at?: string;
  updated_at?: string;
}

/** @deprecated Use MovimientoDetalle instead */
export interface InventarioMovimiento {
  id?: string;
  seccion_id?: string | null;
  seccion_nombre?: string;
  cliente_nombre?: string;
  tipo_montura?: TipoMontura | null;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  monto?: number | null;
  nota?: string | null;
  referencia?: string | null;
  created_by?: string | null;
  created_at?: string;
}

/** @deprecated Moved to Reportes module */
export interface InventarioDashboard {
  periodo: 'day' | 'week' | 'month';
  monturas_vendidas: number;
  entradas: number;
  salidas: number;
  ajustes: number;
  dinero_acumulado: number;
  dinero_real_entrado: number;
  dinero_pendiente: number;
}

/** @deprecated Moved to Reportes module */
export interface ClienteDeudor {
  cliente_id: string;
  cliente_nombre: string;
  cliente_cedula: string;
  total_compras: number;
  total_abonado: number;
  saldo_pendiente: number;
  compras_pendientes: number;
}
