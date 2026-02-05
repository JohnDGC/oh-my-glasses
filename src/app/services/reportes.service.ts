import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ReporteVentas {
  fecha: string;
  total_ventas: number;
  total_monturas: number;
  dinero_total: number;
  abonos_pagados: number;
}

export interface ReporteInventario {
  seccion: string;
  tipo_montura: string;
  stock_actual: number;
  stock_minimo: number;
  total_vendido: number;
  rotacion: number; // (ventas / stock_actual)
}

export interface ReporteCliente {
  cliente_id: string;
  cliente_nombre: string;
  cliente_cedula?: string | null;
  total_compras: number;
  dinero_total: number;
  abonos_pagados: number;
  saldo_pendiente: number;
  ultima_compra: string;
  monturas: string; // Lista de tipos de monturas compradas
}

export interface MetricasDashboard {
  ventas_mes_actual: number;
  dinero_mes_actual: number;
  clientes_nuevos_mes: number;
  stock_total: number;
  stock_bajo_minimo: number;
  top_secciones: { seccion: string; ventas: number }[];
  top_monturas: {
    tipo_montura: string;
    tipo_lente?: string | null;
    tipo_compra?: string | null;
    ventas: number;
    descripcion: string; // Human-readable description
  }[];
  lentes_sin_montura: {
    tipo_lente: string;
    tipo_compra?: string | null;
    ventas: number;
    descripcion: string;
  }[];
  tendencia_ventas: { mes: string; ventas: number; dinero: number }[];
}

export interface FiltrosReporte {
  fechaDesde?: string;
  fechaHasta?: string;
  seccion?: string;
  tipoMontura?: string;
  clienteId?: string;
}

export interface ReportesConfig {
  id?: string;
  dia_corte: number;
  updated_at?: string;
  updated_by?: string;
}

export interface PeriodoInventario {
  nombre: string; // "Enero 2026 (06/01 - 05/02)"
  fecha_inicio: string; // "2026-01-06T00:00:00"
  fecha_fin: string; // "2026-02-05T23:59:59"
}

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  constructor(private supabase: SupabaseService) {}

  // ============================================
  // 1. REPORTES DE VENTAS
  // ============================================

  /**
   * Obtiene reporte de ventas agrupado por fecha
   * Usa cliente_compras para incluir datos históricos
   */
  async getReporteVentasPorFecha(
    filtros: FiltrosReporte,
  ): Promise<ReporteVentas[]> {
    let query = this.supabase.client
      .from('cliente_compras')
      .select(
        'id, created_at, precio_total, tipo_montura, seccion, cliente_abonos(monto)',
      )
      .not('tipo_montura', 'is', null); // Solo ventas con montura

    if (filtros.fechaDesde) {
      query = query.gte('created_at', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      query = query.lte('created_at', filtros.fechaHasta);
    }
    if (filtros.seccion) {
      query = query.eq('seccion', filtros.seccion);
    }
    if (filtros.tipoMontura) {
      query = query.eq('tipo_montura', filtros.tipoMontura);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener reporte de ventas:', error);
      throw error;
    }

    // Agrupar por fecha
    const ventasPorFecha = new Map<string, ReporteVentas>();

    data?.forEach((compra: any) => {
      // Convertir a fecha local para evitar problemas de zona horaria
      const fechaUTC = new Date(compra.created_at);
      const fecha = `${fechaUTC.getFullYear()}-${String(fechaUTC.getMonth() + 1).padStart(2, '0')}-${String(fechaUTC.getDate()).padStart(2, '0')}`;
      const monto = compra.precio_total || 0;

      // Calcular abonos de esta compra
      const abonosCompra = compra.cliente_abonos || [];
      const totalAbonosCompra = abonosCompra.reduce(
        (sum: number, abono: any) => sum + (abono.monto || 0),
        0,
      );

      if (!ventasPorFecha.has(fecha)) {
        ventasPorFecha.set(fecha, {
          fecha,
          total_ventas: 0,
          total_monturas: 0,
          dinero_total: 0,
          abonos_pagados: 0,
        });
      }

      const reporte = ventasPorFecha.get(fecha)!;
      reporte.total_ventas++;
      reporte.total_monturas++;
      reporte.dinero_total += monto;
      reporte.abonos_pagados += totalAbonosCompra;
    });

    const reportes = Array.from(ventasPorFecha.values());
    return reportes.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  /**
   * Obtiene total de ventas del día actual
   * Usa cliente_compras para datos reales
   */
  async getVentasHoy(): Promise<{
    total_ventas: number;
    dinero_total: number;
  }> {
    const hoy = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase.client
      .from('cliente_compras')
      .select('precio_total')
      .not('tipo_montura', 'is', null)
      .gte('created_at', `${hoy}T00:00:00`)
      .lte('created_at', `${hoy}T23:59:59`);

    if (error) {
      console.error('Error al obtener ventas de hoy:', error);
      return { total_ventas: 0, dinero_total: 0 };
    }

    const total_ventas = data?.length || 0;
    const dinero_total =
      data?.reduce((sum, m) => sum + (m.precio_total || 0), 0) || 0;

    return { total_ventas, dinero_total };
  }

  /**
   * Obtiene total de ventas de los últimos N días
   * Usa cliente_compras para datos históricos
   */
  async getVentasUltimosDias(dias: number): Promise<{
    total_ventas: number;
    dinero_total: number;
  }> {
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - dias);

    const { data, error } = await this.supabase.client
      .from('cliente_compras')
      .select('precio_total')
      .not('tipo_montura', 'is', null)
      .gte('created_at', fechaDesde.toISOString());

    if (error) {
      console.error(`Error al obtener ventas de últimos ${dias} días:`, error);
      return { total_ventas: 0, dinero_total: 0 };
    }

    const total_ventas = data?.length || 0;
    const dinero_total =
      data?.reduce((sum, m) => sum + (m.precio_total || 0), 0) || 0;

    return { total_ventas, dinero_total };
  }

  // ============================================
  // 2. REPORTES DE INVENTARIO
  // ============================================

  /**
   * Obtiene reporte de stock con rotación
   */
  async getReporteInventario(
    filtros: FiltrosReporte,
  ): Promise<ReporteInventario[]> {
    let stockQuery = this.supabase.client
      .from('inventario_stock')
      .select(
        'seccion, tipo_montura, stock_actual, stock_minimo, stock_salidas',
      );

    if (filtros.seccion) {
      stockQuery = stockQuery.eq('seccion', filtros.seccion);
    }
    if (filtros.tipoMontura) {
      stockQuery = stockQuery.eq('tipo_montura', filtros.tipoMontura);
    }

    const { data: stockData, error: stockError } = await stockQuery;

    if (stockError) {
      console.error('Error al obtener reporte de inventario:', stockError);
      throw stockError;
    }

    return (
      stockData?.map((item) => {
        const rotacion =
          item.stock_actual > 0 ? item.stock_salidas / item.stock_actual : 0;
        return {
          seccion: item.seccion,
          tipo_montura: item.tipo_montura,
          stock_actual: item.stock_actual,
          stock_minimo: item.stock_minimo || 0,
          total_vendido: item.stock_salidas,
          rotacion: Math.round(rotacion * 100) / 100,
        };
      }) || []
    );
  }

  /**
   * Obtiene monturas con stock bajo mínimo
   */
  async getStockBajoMinimo(): Promise<ReporteInventario[]> {
    const { data, error } = await this.supabase.client
      .from('inventario_stock')
      .select(
        'seccion, tipo_montura, stock_actual, stock_minimo, stock_salidas',
      );

    if (error) {
      console.error('Error al obtener stock bajo mínimo:', error);
      return [];
    }

    // Filtrar en el cliente para stock_actual < stock_minimo
    return (
      data
        ?.filter((item) => item.stock_actual < (item.stock_minimo || 0))
        .map((item) => ({
          seccion: item.seccion,
          tipo_montura: item.tipo_montura,
          stock_actual: item.stock_actual,
          stock_minimo: item.stock_minimo || 0,
          total_vendido: item.stock_salidas,
          rotacion: 0,
        })) || []
    );
  }

  /**
   * Obtiene el total de stock disponible
   */
  async getTotalStock(): Promise<number> {
    const { data, error } = await this.supabase.client
      .from('inventario_stock')
      .select('stock_actual');

    if (error) {
      console.error('Error al obtener total de stock:', error);
      return 0;
    }

    return data?.reduce((sum, item) => sum + item.stock_actual, 0) || 0;
  }

  // ============================================
  // 3. REPORTES DE CLIENTES
  // ============================================

  /**
   * Obtiene análisis de clientes
   */
  async getReporteClientes(filtros: FiltrosReporte): Promise<ReporteCliente[]> {
    // Consultar compras con abonos incluidos (similar a clientes.component)
    let comprasQuery = this.supabase.client.from('cliente_compras').select(
      `
        id,
        cliente_id,
        precio_total,
        created_at,
        tipo_montura,
        clientes!inner(nombres, cedula),
        cliente_abonos(monto)
      `,
    );

    if (filtros.fechaDesde) {
      comprasQuery = comprasQuery.gte('created_at', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      comprasQuery = comprasQuery.lte('created_at', filtros.fechaHasta);
    }
    if (filtros.clienteId) {
      comprasQuery = comprasQuery.eq('cliente_id', filtros.clienteId);
    }

    const { data: comprasData, error: comprasError } = await comprasQuery;

    if (comprasError) {
      console.error('Error al obtener reporte de clientes:', comprasError);
      throw comprasError;
    }

    // Agrupar por cliente
    const clientesMap = new Map<string, ReporteCliente>();

    for (const compra of comprasData || []) {
      const clienteId = compra.cliente_id;
      const clienteNombre = (compra.clientes as any)?.nombres || 'Sin nombre';
      const clienteCedula = (compra.clientes as any)?.cedula || null;

      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          cliente_id: clienteId,
          cliente_nombre: clienteNombre,
          cliente_cedula: clienteCedula,
          total_compras: 0,
          dinero_total: 0,
          abonos_pagados: 0,
          saldo_pendiente: 0,
          ultima_compra: compra.created_at,
          monturas: '',
        });
      }

      const reporte = clientesMap.get(clienteId)!;
      reporte.total_compras++;
      reporte.dinero_total += compra.precio_total || 0;

      // Sumar abonos de esta compra directamente
      const abonosCompra = (compra as any).cliente_abonos || [];
      const totalAbonosCompra = abonosCompra.reduce(
        (sum: number, abono: any) => sum + (abono.monto || 0),
        0,
      );
      reporte.abonos_pagados += totalAbonosCompra;

      // Agregar tipo de montura a la lista (sin duplicados)
      const tipoMontura = (compra as any).tipo_montura;
      if (tipoMontura) {
        const monturasArray = reporte.monturas
          ? reporte.monturas.split(', ')
          : [];
        if (!monturasArray.includes(tipoMontura)) {
          monturasArray.push(tipoMontura);
          reporte.monturas = monturasArray.join(', ');
        }
      }

      // Actualizar última compra
      if (compra.created_at > reporte.ultima_compra) {
        reporte.ultima_compra = compra.created_at;
      }
    }

    // Calcular saldo pendiente
    for (const reporte of clientesMap.values()) {
      reporte.saldo_pendiente = reporte.dinero_total - reporte.abonos_pagados;
    }

    // Ordenar por fecha de última compra (más reciente primero)
    return Array.from(clientesMap.values()).sort(
      (a, b) =>
        new Date(b.ultima_compra).getTime() -
        new Date(a.ultima_compra).getTime(),
    );
  }

  /**
   * Obtiene clientes nuevos del mes actual
   */
  async getClientesNuevosMes(): Promise<number> {
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);
    primerDiaMes.setHours(0, 0, 0, 0);

    const { count, error } = await this.supabase.client
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', primerDiaMes.toISOString());

    if (error) {
      console.error('Error al obtener clientes nuevos del mes:', error);
      return 0;
    }

    return count || 0;
  }

  // ============================================
  // 4. DASHBOARD EJECUTIVO
  // ============================================

  /**
   * Obtiene métricas para el dashboard ejecutivo
   */
  async getMetricasDashboard(): Promise<MetricasDashboard> {
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);
    primerDiaMes.setHours(0, 0, 0, 0);

    // Ventas del mes (desde cliente_compras para datos históricos)
    const { data: ventasMes } = await this.supabase.client
      .from('cliente_compras')
      .select('precio_total')
      .not('tipo_montura', 'is', null)
      .gte('created_at', primerDiaMes.toISOString());

    const ventas_mes_actual = ventasMes?.length || 0;
    const dinero_mes_actual =
      ventasMes?.reduce((sum, m) => sum + (m.precio_total || 0), 0) || 0;

    // Clientes nuevos del mes
    const clientes_nuevos_mes = await this.getClientesNuevosMes();

    // Stock total
    const stock_total = await this.getTotalStock();

    // Stock bajo mínimo
    const stockBajo = await this.getStockBajoMinimo();
    const stock_bajo_minimo = stockBajo.length;

    // Top secciones (más vendidas) - desde cliente_compras
    const { data: topSeccionesData } = await this.supabase.client
      .from('cliente_compras')
      .select('seccion')
      .not('tipo_montura', 'is', null)
      .not('seccion', 'is', null)
      .gte('created_at', primerDiaMes.toISOString());

    const seccionesCount = new Map<string, number>();
    topSeccionesData?.forEach((m) => {
      const count = seccionesCount.get(m.seccion) || 0;
      seccionesCount.set(m.seccion, count + 1);
    });

    const top_secciones = Array.from(seccionesCount.entries())
      .map(([seccion, ventas]) => ({ seccion, ventas }))
      .sort((a, b) => b.ventas - a.ventas);

    // Top monturas (más vendidas) - desde cliente_compras
    // Incluye tipo_lente y tipo_compra para mostrar información completa
    // IMPORTANTE: Obtener TODAS las compras del mes (incluyendo las que podrían no tener tipo_montura inicialmente)
    const { data: topMonturasData } = await this.supabase.client
      .from('cliente_compras')
      .select('tipo_montura, tipo_lente, tipo_compra, seccion')
      .gte('created_at', primerDiaMes.toISOString());

    // Group differently based on tipo_montura:
    // - Sin Montura: separate list (lentes_sin_montura)
    // - Others: group only by tipo_montura (aggregate all variations)
    const monturasCount = new Map<
      string,
      {
        tipo_montura: string;
        tipo_lente: string | null;
        tipo_compra: string | null;
        ventas: number;
        descripcion: string;
      }
    >();

    const lentesSinMonturaCount = new Map<
      string,
      {
        tipo_lente: string;
        tipo_compra: string | null;
        ventas: number;
        descripcion: string;
      }
    >();

    topMonturasData?.forEach((m) => {
      let key: string;
      let descripcion: string;
      let tipoMontura = (m.tipo_montura || 'Sin especificar').trim();

      if (m.tipo_montura === 'Sin Montura' && m.tipo_lente) {
        const lenteKey = m.tipo_lente.trim();
        const existingLente = lentesSinMonturaCount.get(lenteKey);
        if (existingLente) {
          existingLente.ventas++;
        } else {
          lentesSinMonturaCount.set(lenteKey, {
            tipo_lente: lenteKey,
            tipo_compra: m.tipo_compra,
            ventas: 1,
            descripcion: lenteKey,
          });
        }
        return;
      } else if (m.tipo_compra === 'Gafas de sol') {
        // For sunglasses, group by montura + "(Sol)" indicator
        key = `${tipoMontura}|Sol`;
        descripcion = `${tipoMontura} (Sol)`;
      } else if (!m.tipo_montura && m.seccion) {
        // If no tipo_montura but has seccion, use seccion as reference
        key = m.seccion.trim();
        descripcion = m.seccion.trim();
        tipoMontura = m.seccion.trim();
      } else {
        // For regular glasses, group only by montura type
        key = tipoMontura;
        descripcion = tipoMontura;
      }

      const existing = monturasCount.get(key);

      if (existing) {
        existing.ventas++;
      } else {
        monturasCount.set(key, {
          tipo_montura: tipoMontura,
          tipo_lente: m.tipo_lente,
          tipo_compra: m.tipo_compra,
          ventas: 1,
          descripcion,
        });
      }
    });

    const top_monturas = Array.from(monturasCount.values()).sort(
      (a, b) => b.ventas - a.ventas,
    );

    const lentes_sin_montura = Array.from(lentesSinMonturaCount.values()).sort(
      (a, b) => b.ventas - a.ventas,
    );

    // Tendencia de ventas (últimos 6 meses)
    const tendencia_ventas = await this.getTendenciaVentas(6);

    return {
      ventas_mes_actual,
      dinero_mes_actual,
      clientes_nuevos_mes,
      stock_total,
      stock_bajo_minimo,
      top_secciones,
      top_monturas,
      lentes_sin_montura,
      tendencia_ventas,
    };
  }

  /**
   * Obtiene tendencia de ventas de los últimos N meses
   * Usa cliente_compras para incluir todo el histórico
   */
  async getTendenciaVentas(
    meses: number,
  ): Promise<{ mes: string; ventas: number; dinero: number }[]> {
    const fechaDesde = new Date();
    fechaDesde.setMonth(fechaDesde.getMonth() - meses);

    const { data, error } = await this.supabase.client
      .from('cliente_compras')
      .select('created_at, precio_total')
      .not('tipo_montura', 'is', null)
      .gte('created_at', fechaDesde.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al obtener tendencia de ventas:', error);
      return [];
    }

    // Agrupar por mes
    const mesesMap = new Map<string, { ventas: number; dinero: number }>();

    data?.forEach((compra) => {
      const fecha = new Date(compra.created_at);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      if (!mesesMap.has(mesKey)) {
        mesesMap.set(mesKey, { ventas: 0, dinero: 0 });
      }

      const datos = mesesMap.get(mesKey)!;
      datos.ventas++;
      datos.dinero += compra.precio_total || 0;
    });

    return Array.from(mesesMap.entries())
      .map(([mes, datos]) => ({
        mes,
        ventas: datos.ventas,
        dinero: datos.dinero,
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }

  // ============================================
  // 5. UTILIDADES DE EXPORTACIÓN
  // ============================================

  /**
   * Convierte datos a CSV para exportación
   * Usa punto y coma (;) como separador para compatibilidad con Excel en español
   */
  exportToCSV(
    data: any[],
    filename: string,
    excludeColumns: string[] = [],
  ): void {
    if (data.length === 0) return;

    // Filtrar columnas excluidas
    const allHeaders = Object.keys(data[0]);
    const headers = allHeaders.filter((h) => !excludeColumns.includes(h));

    // Crear filas CSV correctamente con punto y coma como separador
    const rows = data.map(
      (row) =>
        headers
          .map((header) => {
            let value = row[header];

            // Formatear fechas ISO a hora colombiana
            if (value && typeof value === 'string' && this.isISODate(value)) {
              value = this.formatDateToColombia(value);
            }

            // Escapar valores que contienen punto y coma, comillas o saltos de línea
            if (value == null) return '';
            const stringValue = String(value);
            // Si contiene punto y coma, comillas o saltos de línea, envolver en comillas
            if (
              stringValue.includes(';') ||
              stringValue.includes('"') ||
              stringValue.includes('\n') ||
              stringValue.includes(',')
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(';'), // Usar punto y coma como separador
    );

    // UTF-8 BOM para que Excel reconozca caracteres especiales
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(';'), ...rows].join('\r\n'); // Windows line endings

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${filename}_${new Date().toISOString().split('T')[0]}.csv`,
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Verifica si un string es una fecha ISO
   */
  private isISODate(value: string): boolean {
    // Formato ISO: YYYY-MM-DDTHH:mm:ss o similar
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return isoDateRegex.test(value);
  }

  /**
   * Convierte fecha UTC a hora colombiana (UTC-5)
   */
  private formatDateToColombia(isoDate: string): string {
    const date = new Date(isoDate);

    // Formatear a hora colombiana
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('es-CO', options);
    return formatter.format(date);
  }

  // ============================================
  // 6. CONFIGURACIÓN DE PERÍODOS
  // ============================================

  /**
   * Obtiene la configuración de día de corte
   */
  async getConfig(): Promise<ReportesConfig> {
    const { data, error } = await this.supabase.client
      .from('reportes_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error al obtener configuración:', error);
      // Return default if not found
      return { dia_corte: 5 };
    }

    return data;
  }

  /**
   * Actualiza el día de corte de períodos
   */
  async updateConfig(diaCorte: number, userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('reportes_config')
      .update({
        dia_corte: diaCorte,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  }

  /**
   * Calcula períodos basados en día de corte
   * Genera últimos 6 períodos
   * Cada período va del (diaCorte + 1) de un mes hasta diaCorte del siguiente
   * Ejemplo: Si diaCorte = 5, el período es del 6 de enero al 5 de febrero
   */
  calcularPeriodos(diaCorte: number): PeriodoInventario[] {
    const periodos: PeriodoInventario[] = [];
    const hoy = new Date();

    for (let i = 0; i < 6; i++) {
      // Calculate period END date (día de corte del mes actual - i meses atrás)
      const finMes = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - i,
        diaCorte,
        23,
        59,
        59,
      );

      // Calculate period START date (día después del corte anterior, es decir, diaCorte + 1 del mes anterior)
      const inicioMes = new Date(finMes);
      inicioMes.setMonth(inicioMes.getMonth() - 1);
      inicioMes.setDate(diaCorte + 1);
      inicioMes.setHours(0, 0, 0, 0);

      // Format period name using START month: "Enero 2026 (06/01 - 05/02)"
      const nombreMes = inicioMes.toLocaleDateString('es-CO', {
        month: 'long',
        year: 'numeric',
      });
      const formatoCorto = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const nombre = `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} (${formatoCorto(inicioMes)} - ${formatoCorto(finMes)})`;

      periodos.push({
        nombre,
        fecha_inicio: inicioMes.toISOString(),
        fecha_fin: finMes.toISOString(),
      });
    }

    return periodos;
  }

  /**
   * Convierte período a filtros de fecha
   */
  periodoToFiltros(periodo: PeriodoInventario): {
    fechaDesde: string;
    fechaHasta: string;
  } {
    return {
      fechaDesde: periodo.fecha_inicio,
      fechaHasta: periodo.fecha_fin,
    };
  }
}
