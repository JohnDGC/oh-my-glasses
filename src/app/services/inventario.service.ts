import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  InventarioMovimiento,
  InventarioSeccion,
  InventarioDashboard,
  TipoMovimientoInventario,
} from '../models/inventario.model';
import { Seccion } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Resolver sección sin forzar Labradorita cuando no viene sección y no es premium
   * - Si el usuario seleccionó sección → usar esa
   * - Si es montura premium → Piedras Preciosas
   * - Caso contrario → undefined (no impacta stock)
   */
  private resolveSeccionNombre(
    tipoMontura: any,
    seccion?: Seccion | null
  ): Seccion | 'Piedras Preciosas' | undefined {
    if (seccion) return seccion;

    const PREMIUM_MONTURAS = [
      'Taizu',
      'Fento',
      'MH',
      'Lacoste',
      'CK',
      'RayBan',
    ];
    if (tipoMontura && PREMIUM_MONTURAS.includes(tipoMontura)) {
      return 'Piedras Preciosas';
    }

    return undefined;
  }

  async getSecciones(): Promise<InventarioSeccion[]> {
    const { data, error } = await this.supabase.client
      .from('inventario_secciones')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo secciones de inventario:', error);
      throw error;
    }

    return data || [];
  }

  async upsertSeccion(nombre: Seccion | 'Piedras Preciosas') {
    const { data, error } = await this.supabase.client
      .from('inventario_secciones')
      .upsert({ nombre })
      .select()
      .single();

    if (error) {
      console.error('Error creando/actualizando sección:', error);
      throw error;
    }

    return data;
  }

  async findSeccionId(
    nombre: Seccion | 'Piedras Preciosas'
  ): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('inventario_secciones')
      .select('id')
      .eq('nombre', nombre)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error buscando sección:', error);
      throw error;
    }

    return data?.id || null;
  }

  async crearMovimiento(
    movimiento:
      | Omit<InventarioMovimiento, 'id'>
      | Omit<InventarioMovimiento, 'id' | 'created_at'>
  ): Promise<InventarioMovimiento> {
    let seccionId: string | null = movimiento.seccion_id || null;

    // Solo buscar/crear sección si se proporciona seccion_nombre
    if (movimiento.seccion_nombre && !seccionId) {
      const seccionNombre = movimiento.seccion_nombre as
        | Seccion
        | 'Piedras Preciosas';

      seccionId = (await this.findSeccionId(seccionNombre)) || null;
      if (!seccionId) {
        const seccion = await this.upsertSeccion(seccionNombre);
        seccionId = seccion.id;
      }
    }

    const payload: any = {
      seccion_id: seccionId, // Puede ser null
      tipo_montura: movimiento.tipo_montura || null,
      tipo: movimiento.tipo as TipoMovimientoInventario,
      cantidad: movimiento.cantidad,
      monto: movimiento.monto ?? null,
      nota: movimiento.nota || null,
      referencia: movimiento.referencia || null,
      created_by: movimiento.created_by || null,
    };

    // Si se proporciona created_at, usarlo (para sincronización histórica)
    if ('created_at' in movimiento && movimiento.created_at) {
      payload.created_at = movimiento.created_at;
    }

    const { data, error } = await this.supabase.client
      .from('inventario_movimientos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creando movimiento de inventario:', error);
      throw error;
    }

    return data;
  }

  async getMovimientos(params?: {
    desde?: string;
    hasta?: string;
    tipo?: TipoMovimientoInventario;
    seccionId?: string;
  }): Promise<InventarioMovimiento[]> {
    let query = this.supabase.client
      .from('inventario_movimientos')
      .select(
        `
        *,
        seccion:inventario_secciones(nombre),
        compra:cliente_compras(
          cliente:clientes(
            nombres
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    if (params?.tipo) query = query.eq('tipo', params.tipo);
    if (params?.seccionId) query = query.eq('seccion_id', params.seccionId);
    if (params?.desde) query = query.gte('created_at', params.desde);
    if (params?.hasta) query = query.lte('created_at', params.hasta);

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo movimientos de inventario:', error);
      throw error;
    }

    return (data || []).map((m) => ({
      ...m,
      seccion_nombre: (m as any).seccion?.nombre,
      cliente_nombre:
        (m as any).compra?.cliente?.nombres || (m as any).created_by,
    }));
  }

  async getDashboard(
    periodo: 'day' | 'week' | 'month'
  ): Promise<InventarioDashboard> {
    const now = new Date();
    let desde = new Date();
    if (periodo === 'week') {
      desde.setDate(now.getDate() - 7);
    } else if (periodo === 'month') {
      desde.setMonth(now.getMonth() - 1);
    }

    const desdeISO = desde.toISOString();

    // 1. Obtener movimientos del período
    const { data: movimientos, error: errorMov } = await this.supabase.client
      .from('inventario_movimientos')
      .select('tipo, cantidad, monto, referencia, nota')
      .gte('created_at', desdeISO);

    if (errorMov) {
      console.error('Error obteniendo dashboard de inventario:', errorMov);
      throw errorMov;
    }

    let monturasVendidas = 0;
    let entradas = 0;
    let salidas = 0;
    let ajustes = 0;
    let dinero = 0;
    let reversionVentasCantidad = 0;
    let reversionVentasMonto = 0;

    // IDs de compras con ventas en el período
    const compraIdsConVenta = new Set<string>();

    (movimientos || []).forEach((m) => {
      const nota = (m as any).nota || '';

      if (m.tipo === 'venta') {
        monturasVendidas += Math.abs(m.cantidad || 0);
        dinero += Number(m.monto || 0);
        if (m.referencia) {
          compraIdsConVenta.add(m.referencia);
        }
      } else if (m.tipo === 'ajuste' && nota.includes('Reversión de venta')) {
        reversionVentasCantidad += Math.abs(m.cantidad || 0);
        reversionVentasMonto += Math.abs(Number(m.monto || 0));
      } else if (m.tipo === 'entrada') {
        entradas += Math.abs(m.cantidad || 0);
      } else if (m.tipo === 'salida') {
        salidas += Math.abs(m.cantidad || 0);
      } else if (m.tipo === 'ajuste') {
        ajustes += m.cantidad || 0;
      }
    });

    // Restar reversiones de ventas
    monturasVendidas = monturasVendidas - reversionVentasCantidad;
    dinero = dinero - reversionVentasMonto;

    // 2. Obtener compras del período con sus abonos
    const { data: compras, error: errorCompras } = await this.supabase.client
      .from('cliente_compras')
      .select(
        `
        id,
        precio_total,
        cliente_abonos (
          monto
        )
      `
      )
      .gte('created_at', desdeISO);

    if (errorCompras) {
      console.error('Error obteniendo compras para dashboard:', errorCompras);
      throw errorCompras;
    }

    let dineroRealEntrado = 0;
    let dineroPendiente = 0;

    (compras || []).forEach((compra: any) => {
      const precioTotal = Number(compra.precio_total || 0);
      const abonos = compra.cliente_abonos || [];
      const totalAbonado = abonos.reduce(
        (sum: number, abono: any) => sum + Number(abono.monto || 0),
        0
      );

      if (totalAbonado > 0) {
        // Si hay abonos, solo cuenta lo que realmente entró
        dineroRealEntrado += totalAbonado;
        dineroPendiente += precioTotal - totalAbonado;
      } else {
        // Si no hay abonos, se asume que pagó todo
        dineroRealEntrado += precioTotal;
      }
    });

    return {
      periodo,
      monturas_vendidas: monturasVendidas,
      entradas,
      salidas,
      ajustes,
      dinero_acumulado: dinero, // Total de ventas (sin considerar abonos)
      dinero_real_entrado: dineroRealEntrado, // Dinero que realmente entró
      dinero_pendiente: dineroPendiente, // Lo que aún deben
    };
  }

  // Helper para registrar venta desde compras
  async registrarVentaDesdeCompra(compra: {
    id?: string;
    tipo_montura: any;
    seccion?: Seccion | null;
    precio_total?: number | null;
    cliente_nombre?: string | null;
  }) {
    try {
      const seccion = this.resolveSeccionNombre(
        compra.tipo_montura,
        compra.seccion || null
      );
      await this.crearMovimiento({
        seccion_nombre: seccion,
        tipo: 'venta',
        tipo_montura: compra.tipo_montura,
        cantidad: 1,
        monto: compra.precio_total || null,
        referencia: compra.id || null,
        nota: 'Venta registrada desde compra',
        created_by: compra.cliente_nombre || null,
      });
    } catch (error) {
      console.error('Error registrando venta en inventario:', error);
      // No propagamos para no romper flujo de venta; queda log
    }
  }

  async updateStockMinimo(
    seccionId: string,
    stockMinimo: number
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('inventario_secciones')
      .update({ stock_minimo: stockMinimo })
      .eq('id', seccionId);

    if (error) {
      console.error('Error actualizando stock mínimo:', error);
      throw error;
    }
  }

  /**
   * Revertir una venta eliminada
   * Cuando se elimina una compra, se debe devolver el stock y ajustar el dinero
   */
  async revertirVentaEliminada(compra: {
    id?: string;
    tipo_montura: any;
    seccion?: any;
    precio_total?: number | null;
    created_at?: string;
    cliente_nombre?: string | null;
  }): Promise<void> {
    try {
      const seccion = this.resolveSeccionNombre(
        compra.tipo_montura,
        compra.seccion || null
      );

      // Crear movimiento de ajuste positivo para devolver el stock
      await this.crearMovimiento({
        seccion_nombre: seccion,
        tipo: 'ajuste',
        tipo_montura: compra.tipo_montura,
        cantidad: 1, // Positivo para incrementar stock
        monto: compra.precio_total ? -Math.abs(compra.precio_total) : null, // Negativo para restar del dinero
        referencia: compra.id || null,
        nota: 'Reversión de venta - Compra eliminada',
        created_by: compra.cliente_nombre || null,
        created_at: compra.created_at, // Usar fecha original para mantener historial correcto
      });
    } catch (error) {
      console.error('Error revirtiendo venta eliminada:', error);
      // No propagamos para no romper flujo de eliminación
    }
  }

  /**
   * Sincronizar compras históricas de cliente_compras a inventario_movimientos
   * Esta función importa todas las compras que NO han sido registradas en inventario
   */
  async sincronizarComprasHistoricas(): Promise<{
    sincronizadas: number;
    errores: number;
  }> {
    try {
      // 1. Obtener todas las compras que NO tienen movimiento en inventario
      const { data: compras, error: errorCompras } = await this.supabase.client
        .from('cliente_compras')
        .select('id, tipo_montura, seccion, precio_total, created_at')
        .order('created_at', { ascending: true });

      if (errorCompras) {
        console.error('Error obteniendo compras:', errorCompras);
        throw errorCompras;
      }

      if (!compras || compras.length === 0) {
        return { sincronizadas: 0, errores: 0 };
      }

      // 2. Obtener IDs de compras ya registradas en inventario
      const { data: movimientosExistentes } = await this.supabase.client
        .from('inventario_movimientos')
        .select('referencia')
        .eq('tipo', 'venta')
        .not('referencia', 'is', null);

      const referenciasSincronizadas = new Set(
        movimientosExistentes?.map((m) => m.referencia) || []
      );

      // 3. Filtrar compras que no están en inventario
      const comprasPendientes = compras.filter(
        (c) => !referenciasSincronizadas.has(c.id)
      );

      let sincronizadas = 0;
      let errores = 0;

      // 4. Registrar cada compra como movimiento de venta
      for (const compra of comprasPendientes) {
        try {
          // Solo asignar sección si la compra tiene sección explícita o es montura premium
          const seccionNombre = this.resolveSeccionNombre(
            compra.tipo_montura,
            compra.seccion
          );

          await this.crearMovimiento({
            seccion_nombre: seccionNombre,
            tipo: 'venta',
            tipo_montura: compra.tipo_montura,
            cantidad: 1,
            monto: compra.precio_total || null,
            referencia: compra.id,
            nota: `Sincronización histórica - Venta ${new Date(
              compra.created_at
            ).toLocaleDateString()}`,
            created_at: compra.created_at, // ⭐ Usar fecha original de la compra
          });
          sincronizadas++;
        } catch (error) {
          console.error(`Error sincronizando compra ${compra.id}:`, error);
          errores++;
        }
      }

      return { sincronizadas, errores };
    } catch (error) {
      console.error('Error en sincronización histórica:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de clientes que tienen saldo pendiente
   */
  async getClientesDeudores(): Promise<any[]> {
    try {
      const { data: compras, error } = await this.supabase.client
        .from('cliente_compras')
        .select(
          `
          id,
          precio_total,
          cliente_id,
          fecha_compra,
          created_at,
          tipo_montura,
          rango_precio,
          seccion,
          clientes (
            id,
            nombres,
            cedula
          ),
          cliente_abonos (
            monto
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo clientes deudores:', error);
        throw error;
      }

      // Agrupar por cliente y calcular saldos
      const clientesMap = new Map<string, any>();

      (compras || []).forEach((compra: any) => {
        const clienteId = compra.cliente_id;
        const precioTotal = Number(compra.precio_total || 0);
        const abonos = compra.cliente_abonos || [];
        const totalAbonado = abonos.reduce(
          (sum: number, abono: any) => sum + Number(abono.monto || 0),
          0
        );
        const saldoPendiente = precioTotal - totalAbonado;
        const fechaCompra = compra.fecha_compra || compra.created_at;

        // Solo considerar compras con saldo pendiente
        if (saldoPendiente > 0) {
          if (!clientesMap.has(clienteId)) {
            clientesMap.set(clienteId, {
              cliente_id: clienteId,
              cliente_nombre: compra.clientes?.nombres || 'N/A',
              cliente_cedula: compra.clientes?.cedula || 'N/A',
              total_compras: 0,
              total_abonado: 0,
              saldo_pendiente: 0,
              compras_pendientes: 0,
              latest_compra: fechaCompra,
              compras_pendientes_detalle: [],
            });
          }

          const cliente = clientesMap.get(clienteId);
          cliente.total_compras += precioTotal;
          cliente.total_abonado += totalAbonado;
          cliente.saldo_pendiente += saldoPendiente;
          cliente.compras_pendientes += 1;

          // Track última compra para ordenar por fecha
          if (
            fechaCompra &&
            (!cliente.latest_compra ||
              new Date(fechaCompra) > new Date(cliente.latest_compra))
          ) {
            cliente.latest_compra = fechaCompra;
          }

          cliente.compras_pendientes_detalle.push({
            id: compra.id,
            fecha: fechaCompra,
            tipo_montura: compra.tipo_montura,
            rango_precio: compra.rango_precio,
            precio_total: precioTotal,
            abonado: totalAbonado,
            saldo: saldoPendiente,
            seccion: compra.seccion,
          });
        }
      });

      // Convertir Map a Array y ordenar por fecha de compra (más reciente primero)
      return Array.from(clientesMap.values()).sort(
        (a, b) =>
          new Date(b.latest_compra || 0).getTime() -
          new Date(a.latest_compra || 0).getTime()
      );
    } catch (error) {
      console.error('Error en getClientesDeudores:', error);
      throw error;
    }
  }

  /**
   * Actualizar movimiento de venta asociado a una compra (precio, montura, sección)
   * - Si no existe movimiento, crea uno nuevo
   * - Si cambia sección, ajusta stock: revierte sección anterior (+1) y aplica sección nueva (-1)
   */
  async actualizarVentaDesdeCompra(compra: {
    id: string;
    tipo_montura: any;
    seccion?: Seccion | null;
    precio_total?: number | null;
    cliente_nombre?: string | null;
  }): Promise<void> {
    if (!compra.id) return;

    try {
      const seccionNombre = this.resolveSeccionNombre(
        compra.tipo_montura,
        compra.seccion || null
      );

      // Obtener movimiento existente de venta
      const { data: movimiento } = await this.supabase.client
        .from('inventario_movimientos')
        .select('id, seccion_id')
        .eq('referencia', compra.id)
        .eq('tipo', 'venta')
        .single();

      let nuevoSeccionId: string | null = null;
      if (seccionNombre) {
        nuevoSeccionId = await this.findSeccionId(seccionNombre);
      }

      // Si no existe movimiento, crearlo
      if (!movimiento) {
        await this.registrarVentaDesdeCompra(compra);
        return;
      }

      const seccionAnteriorId = movimiento.seccion_id;

      // Actualizar movimiento
      const { error: updateError } = await this.supabase.client
        .from('inventario_movimientos')
        .update({
          tipo_montura: compra.tipo_montura,
          monto: compra.precio_total || null,
          seccion_id: nuevoSeccionId,
          nota: 'Venta actualizada desde compra',
          created_by: compra.cliente_nombre || null,
        })
        .eq('id', movimiento.id);

      if (updateError) throw updateError;

      // Ajustar stock si cambió la sección
      const cambioSeccion = seccionAnteriorId !== nuevoSeccionId;
      if (cambioSeccion) {
        if (seccionAnteriorId) {
          await this.supabase.client.rpc('increment_stock', {
            seccion_id: seccionAnteriorId,
            cantidad: 1,
          });
        }
        if (nuevoSeccionId) {
          await this.supabase.client.rpc('increment_stock', {
            seccion_id: nuevoSeccionId,
            cantidad: -1,
          });
        }
      }
    } catch (error) {
      console.error('Error actualizando movimiento de venta:', error);
      // No propagamos para no bloquear edición de compra
    }
  }
}
