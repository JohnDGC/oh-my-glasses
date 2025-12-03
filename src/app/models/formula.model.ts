// Cliente que solo viene por fórmula médica (no compra lentes)
export interface ClienteFormula {
  id?: string;
  identificacion: string;
  nombres: string;
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  created_at?: string;
  updated_at?: string;
}

// Fórmula médica óptica
export interface Formula {
  id?: string;

  // Relaciones con clientes
  cliente_compra_id?: string | null;
  cliente_formula_id?: string | null;

  // Datos del paciente (snapshot al momento de crear la fórmula)
  identificacion: string;
  nombres: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  edad?: number;
  regimen?: string; // Régimen de salud
  afiliacion?: string; // Afiliación EPS

  // Ojo Derecho (OD)
  od_esfera?: string;
  od_cilindro?: string;
  od_eje?: string;
  od_adicion?: string;
  od_prisma_base?: string;
  od_av_lejos?: string; // Agudeza Visual Lejos
  od_av_cerca?: string; // Agudeza Visual Cerca
  od_grados?: string; // Grados

  // Ojo Izquierdo (OI)
  oi_esfera?: string;
  oi_cilindro?: string;
  oi_eje?: string;
  oi_adicion?: string;
  oi_prisma_base?: string;
  oi_av_lejos?: string; // Agudeza Visual Lejos
  oi_av_cerca?: string; // Agudeza Visual Cerca
  oi_grados?: string; // Grados

  // Diagnóstico (Relaciones)
  diagnostico?: string;
  diagnostico_relacion_1?: string;
  diagnostico_relacion_2?: string;
  diagnostico_relacion_3?: string;

  // Tipo de Lentes y Detalles
  tipo_lentes: string; // LEJOS, CERCA, BIFOCALES, PROGRESIVOS (requerido)
  tipo_lentes_detalle?: string; // Detalle del tipo de lente
  altura?: string; // Altura de montaje

  // Color y Tratamientos
  color?: string; // Color de los lentes
  tratamientos?: string; // Tratamientos aplicados (anti-reflejo, fotocromático, etc.)

  // Distancia Pupilar
  dp?: string; // Distancia pupilar

  // Uso y Control
  uso_dispositivo?: string; // Uso de dispositivos (PC, tablet, etc.)
  control?: string; // Fecha o periodo de control
  duracion_tratamiento?: string; // Duración del tratamiento

  // Observaciones
  observaciones?: string;

  // Control y auditoría
  optometra_id?: string;
  numero_formula?: string;
  created_at?: string;
  updated_at?: string;
}

// Fórmula expandida con información del cliente para la tabla
export interface FormulaConCliente extends Formula {
  tipo_cliente?: 'compra' | 'formula'; // De dónde viene el cliente
  tiene_historial?: boolean;
  total_formulas?: number;
}

// Constantes
export const TIPOS_LENTES = [
  'SIN ESPECIFICAR',
  'LEJOS',
  'CERCA',
  'BIFOCALES',
  'PROGRESIVOS',
] as const;

export type TipoLentes = (typeof TIPOS_LENTES)[number];

// Rangos de valores comunes para validación
export const RANGOS_FORMULA = {
  ESFERA: { min: -20, max: 20, step: 0.25 },
  CILINDRO: { min: -8, max: 8, step: 0.25 },
  EJE: { min: 0, max: 180, step: 1 },
  ADICION: { min: 0, max: 4, step: 0.25 },
  DP: { min: 40, max: 80, step: 0.5 },
} as const;
