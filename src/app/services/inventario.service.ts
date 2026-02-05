import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  InventarioStock,
  StockCard,
  StockMonturaDisplay,
  HistoricoPeriodo,
  MovimientoDetalle,
  ReestockGlobalData,
  AdicionEspecificaData,
  PeriodoDetalles,
  TipoMovimientoNuevo,
} from '../models/inventario.model';
import { Seccion, TipoMontura } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly SECCIONES: (Seccion | 'Piedras Preciosas')[] = [
    'Labradorita',
    'Piedras Preciosas',
    'Cianita',
    'Obsidiana',
    'Cuarzo',
    'Citrino',
  ];

  private readonly MONTURAS_CLASICAS: TipoMontura[] = [
    'Clásica 1',
    'Clásica 2',
    'Clásica 3',
    'Clásica 4',
  ];

  private readonly MONTURAS_PREMIUM: TipoMontura[] = [
    'Taizu',
    'Fento',
    'MH',
    'Lacoste',
    'CK',
    'RayBan',
  ];

  // Sunglasses frames (used when tipo_compra = 'Gafas de sol')
  private readonly MONTURAS_SOL_CLASICAS: TipoMontura[] = ['Clásica'];

  private readonly MONTURAS_SOL_PREMIUM: TipoMontura[] = ['RayBan', 'Fento'];

  // Total expected stock rows with tipo_compra differentiation:
  // Prescription glasses (tipo_compra='Gafas formuladas'):
  //   - Labradorita: 4 (Clásica 1-4) = 4
  //   - Cianita, Obsidiana, Cuarzo, Citrino: 4 × 4 = 16
  //   - Piedras Preciosas: 6 (Taizu, Fento, MH, Lacoste, CK, RayBan) = 6
  //   Subtotal: 26 rows
  //
  // Sunglasses (tipo_compra='Gafas de sol'):
  //   - Labradorita, Cianita, Obsidiana, Cuarzo, Citrino: 1 (Clásica) × 5 = 5
  //   - Piedras Preciosas: 2 (RayBan, Fento) = 2
  //   Subtotal: 7 rows
  //
  // TOTAL: 26 + 7 = 33 rows
  private readonly TOTAL_STOCK_ROWS = 33;

  constructor(private supabase: SupabaseService) {}

  // ============================================================================
  // SECTION HELPERS
  // ============================================================================

  /**
   * Get valid frame types for a specific section and tipo_compra
   * - For 'Gafas formuladas': Classic (1-4) or Premium frames (Taizu, Fento, MH, etc.)
   * - For 'Gafas de sol': Simple names (Clásica, RayBan, Fento)
   */
  getMonturasPorSeccion(
    seccion: Seccion | 'Piedras Preciosas',
    tipoCompra: 'Gafas formuladas' | 'Gafas de sol' = 'Gafas formuladas',
  ): TipoMontura[] {
    if (tipoCompra === 'Gafas de sol') {
      // Sunglasses use simple names
      if (seccion === 'Piedras Preciosas') {
        return this.MONTURAS_SOL_PREMIUM; // ['RayBan', 'Fento']
      }
      return this.MONTURAS_SOL_CLASICAS; // ['Clásica']
    }

    // Prescription glasses use numbered/branded names
    if (seccion === 'Piedras Preciosas') {
      return this.MONTURAS_PREMIUM; // ['Taizu', 'Fento', 'MH', ...]
    }
    return this.MONTURAS_CLASICAS; // ['Clásica 1', 'Clásica 2', ...]
  }

  /**
   * Resolve section based on frame type, tipo_compra, and user selection
   * - User selection takes priority
   * - For sunglasses: RayBan/Fento → Piedras Preciosas, Clásica → undefined (needs user selection)
   * - For prescription: Premium frames → Piedras Preciosas, Classic → undefined
   */
  resolveSeccionNombre(
    tipoMontura: TipoMontura,
    tipoCompra: 'Gafas formuladas' | 'Gafas de sol' = 'Gafas formuladas',
    seccion?: Seccion | null,
  ): Seccion | 'Piedras Preciosas' | undefined {
    if (seccion) return seccion;

    if (tipoCompra === 'Gafas de sol') {
      // Sunglasses: RayBan/Fento are premium
      if (this.MONTURAS_SOL_PREMIUM.includes(tipoMontura)) {
        return 'Piedras Preciosas';
      }
      return undefined; // 'Clásica' sunglasses need section selection
    }

    // Prescription glasses: Premium brands go to Piedras Preciosas
    if (this.MONTURAS_PREMIUM.includes(tipoMontura)) {
      return 'Piedras Preciosas';
    }

    return undefined; // Classic frames need section selection
  }

  // ============================================================================
  // STOCK QUERIES - Main inventory display
  // ============================================================================

  /**
   * Get all stock rows from inventario_stock table
   */
  async getAllStock(): Promise<InventarioStock[]> {
    const { data, error } = await this.supabase.client
      .from('inventario_stock')
      .select('*')
      .order('seccion', { ascending: true })
      .order('tipo_montura', { ascending: true });

    if (error) {
      console.error('Error getting stock:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get stock grouped by section for card display
   */
  async getStockBySection(): Promise<StockCard[]> {
    const allStock = await this.getAllStock();

    const cards: StockCard[] = [];

    for (const seccion of this.SECCIONES) {
      const monturas = allStock.filter((s) => s.seccion === seccion);

      // Include section even if no stock (will show available monturas)
      const monturaDisplays: StockMonturaDisplay[] = monturas.map((m) => ({
        tipo_montura: m.tipo_montura,
        tipo_compra: m.tipo_compra,
        stock_inicial: m.stock_inicial,
        stock_agregado: m.stock_agregado,
        stock_salidas: m.stock_salidas,
        stock_actual: m.stock_actual,
        stock_minimo: m.stock_minimo,
        alerta: m.stock_actual < m.stock_minimo,
      }));

      const totales = {
        stock_inicial: monturas.reduce((sum, m) => sum + m.stock_inicial, 0),
        stock_agregado: monturas.reduce((sum, m) => sum + m.stock_agregado, 0),
        stock_salidas: monturas.reduce((sum, m) => sum + m.stock_salidas, 0),
        stock_actual: monturas.reduce((sum, m) => sum + m.stock_actual, 0),
      };

      cards.push({
        seccion,
        periodo_inicio: monturas[0]?.periodo_inicio || new Date().toISOString(),
        monturas: monturaDisplays,
        totales,
      });
    }

    return cards;
  }

  /**
   * Get single stock row by section, frame, and tipo_compra
   */
  async getStock(
    seccion: Seccion | 'Piedras Preciosas',
    tipoMontura: TipoMontura,
    tipoCompra: 'Gafas formuladas' | 'Gafas de sol' = 'Gafas formuladas',
  ): Promise<InventarioStock | null> {
    const { data, error } = await this.supabase.client
      .from('inventario_stock')
      .select('*')
      .eq('seccion', seccion)
      .eq('tipo_montura', tipoMontura)
      .eq('tipo_compra', tipoCompra)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error getting stock:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update stock minimum threshold
   */
  async updateStockMinimo(
    seccion: Seccion | 'Piedras Preciosas',
    tipoMontura: TipoMontura,
    tipoCompra: 'Gafas formuladas' | 'Gafas de sol',
    stockMinimo: number,
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('inventario_stock')
      .update({ stock_minimo: stockMinimo })
      .eq('seccion', seccion)
      .eq('tipo_montura', tipoMontura)
      .eq('tipo_compra', tipoCompra);

    if (error) {
      console.error('Error updating stock_minimo:', error);
      throw error;
    }
  }

  // ============================================================================
  // RESTOCK OPERATIONS
  // ============================================================================

  /**
   * Perform global restock - closes current period and starts new one
   * 1. Capture snapshot of current state
   * 2. Create historical period
   * 3. Update all stock rows (current becomes initial, reset counters)
   * 4. Create movement records
   */
  async realizarReestockGlobal(
    data: ReestockGlobalData,
    userId?: string,
  ): Promise<HistoricoPeriodo> {
    try {
      // Step 1: Get current state for snapshot
      const currentStock = await this.getAllStock();

      const snapshot: PeriodoDetalles = {
        periodo_anterior: {
          inicio: currentStock[0]?.periodo_inicio || new Date().toISOString(),
          fin: new Date().toISOString(),
        },
        stock_por_montura: currentStock.map((s) => ({
          seccion: s.seccion,
          tipo_montura: s.tipo_montura,
          stock_inicial: s.stock_inicial,
          stock_agregado: s.stock_agregado,
          stock_salidas: s.stock_salidas,
          stock_final: s.stock_actual,
        })),
        totales: {
          total_inicial: currentStock.reduce(
            (sum, s) => sum + s.stock_inicial,
            0,
          ),
          total_agregado: currentStock.reduce(
            (sum, s) => sum + s.stock_agregado,
            0,
          ),
          total_salidas: currentStock.reduce(
            (sum, s) => sum + s.stock_salidas,
            0,
          ),
          total_final: currentStock.reduce((sum, s) => sum + s.stock_actual, 0),
        },
        nota: data.descripcion,
      };

      // Step 2: Create historical period
      const { data: periodo, error: periodoError } = await this.supabase.client
        .from('inventario_historico_periodos')
        .insert({
          tipo_operacion: 'reestock_global',
          descripcion: data.descripcion || 'Reestock global',
          fecha_operacion: new Date().toISOString(),
          created_by: userId || 'unknown',
          detalles: snapshot,
        })
        .select()
        .single();

      if (periodoError) throw periodoError;

      // Step 3: Update all stock rows
      const now = new Date().toISOString();
      const updatePromises: Promise<any>[] = [];
      const movementRecords: any[] = [];

      for (const item of data.stock_nuevo) {
        const currentItem = currentStock.find(
          (s) =>
            s.seccion === item.seccion &&
            s.tipo_montura === item.tipo_montura &&
            s.tipo_compra === item.tipo_compra,
        );

        if (!currentItem) continue;

        // Update: current stock becomes initial, add new stock, reset counters
        const updatePromise = this.supabase.client
          .from('inventario_stock')
          .update({
            stock_inicial: currentItem.stock_actual, // Current becomes initial
            stock_agregado: item.cantidad_nueva, // New stock added
            stock_salidas: 0, // Reset sales counter
            periodo_inicio: now,
          })
          .eq('seccion', item.seccion)
          .eq('tipo_montura', item.tipo_montura)
          .eq('tipo_compra', item.tipo_compra);

        updatePromises.push(updatePromise as unknown as Promise<any>);

        // Create movement record
        if (item.cantidad_nueva > 0) {
          movementRecords.push({
            operacion_id: periodo.id,
            seccion: item.seccion,
            tipo_montura: item.tipo_montura,
            tipo_compra: item.tipo_compra,
            tipo_movimiento: 'reestock',
            cantidad: item.cantidad_nueva,
            nota: data.descripcion,
            created_at: now,
          });
        }
      }

      await Promise.all(updatePromises);

      // Step 4: Insert movement records
      if (movementRecords.length > 0) {
        const { error: movError } = await this.supabase.client
          .from('inventario_movimientos_detalle')
          .insert(movementRecords);

        if (movError) throw movError;
      }

      return periodo;
    } catch (error) {
      console.error('Error en reestock global:', error);
      throw error;
    }
  }

  /**
   * Add specific stock to a single section/frame/tipo_compra (not a full restock)
   */
  async agregarStockEspecifico(
    data: AdicionEspecificaData,
    userId?: string,
  ): Promise<void> {
    try {
      // Filter out Consulta optometria - only track glasses inventory
      const tipoCompra =
        data.tipo_compra === 'Consulta optometria'
          ? 'Gafas formuladas'
          : data.tipo_compra;

      // Step 1: Get current stock (with tipo_compra)
      const currentStock = await this.getStock(
        data.seccion,
        data.tipo_montura,
        tipoCompra,
      );

      if (!currentStock) {
        throw new Error(
          `Stock not found for ${data.seccion} - ${data.tipo_montura} (${data.tipo_compra})`,
        );
      }

      // Step 2: Create historical period for this addition
      const snapshot: PeriodoDetalles = {
        periodo_anterior: {
          inicio: currentStock.periodo_inicio,
          fin: new Date().toISOString(),
        },
        stock_por_montura: [
          {
            seccion: currentStock.seccion,
            tipo_montura: currentStock.tipo_montura,
            stock_inicial: currentStock.stock_inicial,
            stock_agregado: currentStock.stock_agregado,
            stock_salidas: currentStock.stock_salidas,
            stock_final: currentStock.stock_actual,
          },
        ],
        totales: {
          total_inicial: currentStock.stock_inicial,
          total_agregado: currentStock.stock_agregado + data.cantidad,
          total_salidas: currentStock.stock_salidas,
          total_final: currentStock.stock_actual + data.cantidad,
        },
      };

      const { data: periodo, error: periodoError } = await this.supabase.client
        .from('inventario_historico_periodos')
        .insert({
          tipo_operacion: 'adicion_minima',
          descripcion: `Adición: ${data.cantidad} ${data.tipo_montura} (${data.tipo_compra}) en ${data.seccion}`,
          fecha_operacion: new Date().toISOString(),
          created_by: userId || 'unknown',
          detalles: snapshot,
        })
        .select()
        .single();

      if (periodoError) throw periodoError;

      // Step 3: Update stock (increment agregado and actual)
      const { error: updateError } = await this.supabase.client
        .from('inventario_stock')
        .update({
          stock_agregado: currentStock.stock_agregado + data.cantidad,
        })
        .eq('seccion', data.seccion)
        .eq('tipo_montura', data.tipo_montura)
        .eq('tipo_compra', data.tipo_compra); // NEW: Include tipo_compra

      if (updateError) throw updateError;

      // Step 4: Create movement record
      const { error: movError } = await this.supabase.client
        .from('inventario_movimientos_detalle')
        .insert({
          operacion_id: periodo.id,
          seccion: data.seccion,
          tipo_montura: data.tipo_montura,
          tipo_compra: data.tipo_compra, // NEW: Include tipo_compra
          tipo_movimiento: 'adicion',
          cantidad: data.cantidad,
          nota: data.nota,
          created_at: new Date().toISOString(),
        });

      if (movError) throw movError;
    } catch (error) {
      console.error('Error en adición específica:', error);
      throw error;
    }
  }

  // ============================================================================
  // SALE REGISTRATION (Automatic from Clientes module)
  // ============================================================================

  /**
   * Register sale from purchase (called by ClienteService)
   * Decrements stock_salidas and stock_actual
   */
  async registrarVenta(
    tipoMontura: TipoMontura,
    tipoCompra: 'Gafas formuladas' | 'Gafas de sol',
    seccion: Seccion | null | undefined,
    compraId: string,
    clienteNombre?: string,
    fechaOriginal?: string,
  ): Promise<void> {
    try {
      const seccionResuelta = this.resolveSeccionNombre(
        tipoMontura,
        tipoCompra,
        seccion,
      );

      if (!seccionResuelta) {
        // No section assigned = no stock impact
        return;
      }

      // Get current stock
      const currentStock = await this.getStock(
        seccionResuelta,
        tipoMontura,
        tipoCompra,
      );

      if (!currentStock) {
        console.warn(
          `Stock not found for sale: ${seccionResuelta} - ${tipoMontura} (${tipoCompra})`,
        );
        return;
      }

      // Check if we have stock available
      if (currentStock.stock_actual <= 0) {
        console.warn(
          `Warning: Stock is 0 but sale was registered for ${seccionResuelta} - ${tipoMontura} (${tipoCompra})`,
        );
        // Continue anyway to track the sale
      }

      // Update stock (increment salidas, stock_actual will recalculate via trigger)
      const { error: updateError } = await this.supabase.client
        .from('inventario_stock')
        .update({
          stock_salidas: currentStock.stock_salidas + 1,
        })
        .eq('seccion', seccionResuelta)
        .eq('tipo_montura', tipoMontura)
        .eq('tipo_compra', tipoCompra); // NEW

      if (updateError) {
        console.error(
          `❌ Error actualizando stock_salidas para ${seccionResuelta} - ${tipoMontura}:`,
          updateError,
        );
        throw updateError;
      }

      // Create movement record
      const { error: movError } = await this.supabase.client
        .from('inventario_movimientos_detalle')
        .insert({
          operacion_id: null, // Sales don't belong to a period operation
          seccion: seccionResuelta,
          tipo_montura: tipoMontura,
          tipo_compra: tipoCompra, // NEW
          tipo_movimiento: 'venta',
          cantidad: 1,
          nota: `Venta registrada${clienteNombre ? ` - ${clienteNombre}` : ''}`,
          referencia_compra_id: compraId,
          cliente_nombre: clienteNombre,
          created_at: fechaOriginal || new Date().toISOString(),
        });

      if (movError) throw movError;
    } catch (error) {
      console.error('Error registrando venta en inventario:', error);
      throw error;
    }
  }

  /**
   * Update existing sale when purchase is modified
   */
  async actualizarVenta(
    compraId: string,
    nuevoTipoMontura: TipoMontura,
    nuevoTipoCompra: 'Gafas formuladas' | 'Gafas de sol',
    nuevaSeccion: Seccion | null | undefined,
    viejoTipoMontura?: TipoMontura,
    viejoTipoCompra?: 'Gafas formuladas' | 'Gafas de sol',
    viejaSeccion?: Seccion | null | undefined,
  ): Promise<void> {
    try {
      // If frame/section changed, we need to:
      // 1. Revert old sale (increment old section stock)
      // 2. Register new sale (decrement new section stock)

      const viejaSeccionResuelta =
        viejoTipoMontura && viejoTipoCompra
          ? this.resolveSeccionNombre(
              viejoTipoMontura,
              viejoTipoCompra,
              viejaSeccion,
            )
          : undefined;
      const nuevaSeccionResuelta = this.resolveSeccionNombre(
        nuevoTipoMontura,
        nuevoTipoCompra,
        nuevaSeccion,
      );

      // Check if section/frame changed
      const cambioSeccion = viejaSeccionResuelta !== nuevaSeccionResuelta;
      const cambioMontura = viejoTipoMontura !== nuevoTipoMontura;

      if (!cambioSeccion && !cambioMontura) {
        // No inventory impact, just update movement record
        const { error } = await this.supabase.client
          .from('inventario_movimientos_detalle')
          .update({
            seccion: nuevaSeccionResuelta || '',
            tipo_montura: nuevoTipoMontura,
          })
          .eq('referencia_compra_id', compraId)
          .eq('tipo_movimiento', 'venta');

        if (error) throw error;
        return;
      }

      // Revert old sale if it had stock impact
      if (viejaSeccionResuelta && viejoTipoMontura && viejoTipoCompra) {
        const oldStock = await this.getStock(
          viejaSeccionResuelta,
          viejoTipoMontura,
          viejoTipoCompra,
        );
        if (oldStock && oldStock.stock_salidas > 0) {
          await this.supabase.client
            .from('inventario_stock')
            .update({
              stock_salidas: oldStock.stock_salidas - 1,
            })
            .eq('seccion', viejaSeccionResuelta)
            .eq('tipo_montura', viejoTipoMontura)
            .eq('tipo_compra', viejoTipoCompra);
        }
      }

      // Register new sale if it has stock impact
      if (nuevaSeccionResuelta) {
        const newStock = await this.getStock(
          nuevaSeccionResuelta,
          nuevoTipoMontura,
          nuevoTipoCompra,
        );
        if (newStock) {
          await this.supabase.client
            .from('inventario_stock')
            .update({
              stock_salidas: newStock.stock_salidas + 1,
            })
            .eq('seccion', nuevaSeccionResuelta)
            .eq('tipo_montura', nuevoTipoMontura)
            .eq('tipo_compra', nuevoTipoCompra);
        }
      }

      // Update movement record
      const { error: movError } = await this.supabase.client
        .from('inventario_movimientos_detalle')
        .update({
          seccion: nuevaSeccionResuelta || '',
          tipo_montura: nuevoTipoMontura,
          nota: 'Venta actualizada',
        })
        .eq('referencia_compra_id', compraId)
        .eq('tipo_movimiento', 'venta');

      if (movError) throw movError;
    } catch (error) {
      console.error('Error actualizando venta en inventario:', error);
      throw error;
    }
  }

  /**
   * Revert sale when purchase is deleted
   */
  async revertirVenta(
    compraId: string,
    tipoMontura: TipoMontura,
    tipoCompra: 'Gafas formuladas' | 'Gafas de sol',
    seccion: Seccion | null | undefined,
  ): Promise<void> {
    try {
      console.log(
        `[revertirVenta] Revirtiendo: ${tipoMontura} | ${tipoCompra} | Sección: ${seccion}`,
      );

      const seccionResuelta = this.resolveSeccionNombre(
        tipoMontura,
        tipoCompra,
        seccion,
      );

      if (!seccionResuelta) {
        // No stock impact to revert
        console.log(
          `❌ No hay sección resuelta para revertir: ${tipoMontura} (${tipoCompra})`,
        );
        return;
      }

      // Decrement stock_salidas (stock_actual will increase via trigger)
      const currentStock = await this.getStock(
        seccionResuelta,
        tipoMontura,
        tipoCompra,
      );

      if (!currentStock) {
        console.warn(
          `⚠️ Stock no encontrado para revertir: ${seccionResuelta} - ${tipoMontura} (${tipoCompra})`,
        );
        return;
      }

      if (currentStock.stock_salidas > 0) {
        const { error: updateError } = await this.supabase.client
          .from('inventario_stock')
          .update({
            stock_salidas: currentStock.stock_salidas - 1,
          })
          .eq('seccion', seccionResuelta)
          .eq('tipo_montura', tipoMontura)
          .eq('tipo_compra', tipoCompra);

        if (updateError) throw updateError;

        console.log(
          `✅ stock_salidas decrementado: ${seccionResuelta} | ${tipoMontura} (${currentStock.stock_salidas} → ${currentStock.stock_salidas - 1})`,
        );
      }

      // Delete movement record
      const { error: delError } = await this.supabase.client
        .from('inventario_movimientos_detalle')
        .delete()
        .eq('referencia_compra_id', compraId)
        .eq('tipo_movimiento', 'venta');

      if (delError) {
        console.error(`❌ Error borrando movimiento de venta:`, delError);
      } else {
        console.log(`✅ Movimiento de venta eliminado: ${compraId}`);
      }
    } catch (error) {
      console.error('❌ Error revirtiendo venta en inventario:', error);
      throw error;
    }
  }

  // ============================================================================
  // HISTORICAL TRACKING
  // ============================================================================

  /**
   * Get historical periods with optional filters
   */
  async getHistoricoPeriodos(filters?: {
    tipo?: 'reestock_global' | 'adicion_minima';
    desde?: string;
    hasta?: string;
    limit?: number;
  }): Promise<HistoricoPeriodo[]> {
    let query = this.supabase.client
      .from('inventario_historico_periodos')
      .select('*')
      .order('fecha_operacion', { ascending: false });

    if (filters?.tipo) {
      query = query.eq('tipo_operacion', filters.tipo);
    }

    if (filters?.desde) {
      query = query.gte('fecha_operacion', filters.desde);
    }

    if (filters?.hasta) {
      query = query.lte('fecha_operacion', filters.hasta);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting historico periodos:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get detailed movements with optional filters
   */
  async getMovimientosDetalle(filters?: {
    tipo?: TipoMovimientoNuevo;
    operacion_id?: string;
    seccion?: Seccion | 'Piedras Preciosas';
    desde?: string;
    hasta?: string;
    limit?: number;
  }): Promise<MovimientoDetalle[]> {
    let query = this.supabase.client
      .from('inventario_movimientos_detalle')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.tipo) {
      query = query.eq('tipo_movimiento', filters.tipo);
    }

    if (filters?.operacion_id) {
      query = query.eq('operacion_id', filters.operacion_id);
    }

    if (filters?.seccion) {
      query = query.eq('seccion', filters.seccion);
    }

    if (filters?.desde) {
      query = query.gte('created_at', filters.desde);
    }

    if (filters?.hasta) {
      query = query.lte('created_at', filters.hasta);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting movimientos detalle:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get single historical period by ID
   */
  async getHistoricoPeriodo(id: string): Promise<HistoricoPeriodo | null> {
    const { data, error } = await this.supabase.client
      .from('inventario_historico_periodos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error getting historico periodo:', error);
      throw error;
    }

    return data;
  }

  // ============================================================================
  // CONFIGURATION MANAGEMENT
  // ============================================================================

  /**
   * Get inventory configuration by key
   */
  async getConfig(clave: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('inventario_configuracion')
      .select('valor')
      .eq('clave', clave)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error getting config:', error);
      throw error;
    }

    return data?.valor || null;
  }

  /**
   * Get all inventory configuration
   */
  async getAllConfig(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('inventario_configuracion')
      .select('*')
      .order('clave');

    if (error) {
      console.error('Error getting all config:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update inventory configuration
   */
  async updateConfig(clave: string, valor: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('inventario_configuracion')
      .update({ valor, updated_at: new Date().toISOString() })
      .eq('clave', clave);

    if (error) {
      console.error('Error updating config:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Check if a purchase date is after the tracking cutoff date
   * Returns true if tracking should apply, false otherwise
   */
  async shouldTrackPurchase(fechaCompra: string): Promise<boolean> {
    try {
      const trackingActivo = await this.getConfig('tracking_activo');
      if (trackingActivo !== 'true') {
        return false; // Tracking is disabled
      }

      const fechaInicio = await this.getConfig('fecha_inicio_tracking');
      if (!fechaInicio) {
        return true; // No cutoff date = track everything
      }

      // Parse dates more reliably - compare only the date part (YYYY-MM-DD)
      const compraDate = new Date(fechaCompra);
      const cutoffDate = new Date(fechaInicio + 'T00:00:00Z'); // Ensure cutoff is at start of day UTC

      return compraDate >= cutoffDate;
    } catch (error) {
      console.error('Error checking tracking config:', error);
      return true; // Default to tracking if error
    }
  }

  // ============================================================================
  // HISTORICAL REPORTS
  // ============================================================================

  /**
   * Get restock history (entradas)
   * Groups by date and shows what was added to stock
   */
  async getHistoricoReestock(filters?: { desde?: string; hasta?: string }) {
    let query = this.supabase.client
      .from('inventario_movimientos_detalle')
      .select('*')
      .in('tipo_movimiento', ['reestock', 'adicion'])
      .order('created_at', { ascending: false });

    if (filters?.desde) {
      query = query.gte('created_at', filters.desde);
    }

    if (filters?.hasta) {
      query = query.lte('created_at', filters.hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting historico reestock:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get sales history by section
   * Shows what has been sold from each section
   */
  async getHistoricoVentasPorSeccion(filters?: {
    desde?: string;
    hasta?: string;
    seccion?: string;
  }) {
    let query = this.supabase.client
      .from('inventario_movimientos_detalle')
      .select('*')
      .eq('tipo_movimiento', 'venta')
      .order('created_at', { ascending: false });

    if (filters?.seccion) {
      query = query.eq('seccion', filters.seccion);
    }

    if (filters?.desde) {
      query = query.gte('created_at', filters.desde);
    }

    if (filters?.hasta) {
      query = query.lte('created_at', filters.hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting historico ventas:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get sales statistics by section
   */
  async getEstadisticasVentasPorSeccion(filters?: {
    desde?: string;
    hasta?: string;
  }) {
    const ventas = await this.getHistoricoVentasPorSeccion(filters);

    // Group by section
    const groupedBySeccion = ventas.reduce(
      (acc, venta) => {
        if (!acc[venta.seccion]) {
          acc[venta.seccion] = {
            seccion: venta.seccion,
            total_ventas: 0,
            monturas: {} as Record<string, number>,
          };
        }
        acc[venta.seccion].total_ventas += venta.cantidad;

        if (!acc[venta.seccion].monturas[venta.tipo_montura]) {
          acc[venta.seccion].monturas[venta.tipo_montura] = 0;
        }
        acc[venta.seccion].monturas[venta.tipo_montura] += venta.cantidad;

        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(groupedBySeccion);
  }

  // ============================================================================
  // SYNCHRONIZATION - Retroactive sync for manually inserted purchases
  // ============================================================================

  /**
   * Sincronizar compras antiguas que no se registraron en inventario
   * Busca todas las compras >= fecha_inicio_tracking que no estén en inventario_movimientos_detalle
   * y las registra automáticamente
   */
  async sincronizarComprasAnteriores(): Promise<{
    totalCompras: number;
    totalSincronizadas: number;
    error?: string;
  }> {
    try {
      // 1. Obtener fecha de inicio del tracking
      const fechaInicio = await this.getConfig('fecha_inicio_tracking');
      if (!fechaInicio) {
        return {
          totalCompras: 0,
          totalSincronizadas: 0,
          error: 'No hay fecha de inicio de tracking configurada',
        };
      }

      // 2. Obtener todas las compras >= fecha_inicio_tracking
      const { data: comprasDesdeTracking, error: comprasError } =
        await this.supabase.client
          .from('cliente_compras')
          .select('*')
          .gte('fecha_compra', fechaInicio + 'T00:00:00Z')
          .eq('tipo_compra', 'Gafas formuladas')
          .neq('tipo_montura', 'Sin Montura')
          .order('fecha_compra', { ascending: true });

      if (comprasError) throw comprasError;

      const totalCompras = comprasDesdeTracking?.length || 0;

      // 3. Obtener IDs de compras ya registradas en inventario
      const { data: comprasRegistradas, error: registroError } =
        await this.supabase.client
          .from('inventario_movimientos_detalle')
          .select('referencia_compra_id')
          .eq('tipo_movimiento', 'venta')
          .gte('created_at', fechaInicio + 'T00:00:00Z');

      if (registroError) throw registroError;

      const idsRegistrados = new Set(
        (comprasRegistradas || [])
          .map((r) => r.referencia_compra_id)
          .filter(Boolean),
      );

      // 4. Filtrar compras que NO están registradas
      const comprasPendientes = (comprasDesdeTracking || []).filter(
        (compra) => !idsRegistrados.has(compra.id),
      );

      // 5. Obtener nombres de clientes para compras pendientes
      const clientesIds = Array.from(
        new Set(comprasPendientes.map((c) => c.cliente_id)),
      ).filter(Boolean);

      const { data: clientesData } = await this.supabase.client
        .from('clientes')
        .select('id, nombres')
        .in('id', clientesIds);

      const clientesMap = new Map(
        (clientesData || []).map((c) => [c.id, c.nombres]),
      );

      // 6. Registrar cada compra pendiente con nombre de cliente y fecha original
      let sincronizadas = 0;
      for (const compra of comprasPendientes) {
        try {
          const nombreCliente = clientesMap.get(compra.cliente_id);
          await this.registrarVenta(
            compra.tipo_montura,
            compra.tipo_compra as 'Gafas formuladas' | 'Gafas de sol',
            compra.seccion || null,
            compra.id,
            nombreCliente || undefined,
            compra.fecha_compra, // Usar fecha original de la compra
          );
          sincronizadas++;
          console.log(
            `✅ Sincronizada compra ${compra.id} - ${nombreCliente} (${compra.fecha_compra})`,
          );
        } catch (error) {
          console.error(`❌ Error sincronizando compra ${compra.id}:`, error);
          // Continuar con las siguientes
        }
      }

      return {
        totalCompras,
        totalSincronizadas: sincronizadas,
      };
    } catch (error) {
      console.error('Error en sincronizarComprasAnteriores:', error);
      return {
        totalCompras: 0,
        totalSincronizadas: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }

    return data || [];
  }

  /**
   * Actualizar movimientos de venta con datos correctos
   * - Rellenar cliente_nombre si está vacío
   * - Usar fecha_compra real en lugar de created_at actual
   */
  async actualizarMovimientosDesincronizados(): Promise<{
    totalActualizados: number;
    error?: string;
  }> {
    try {
      console.log(
        '[actualizarMovimientosDesincronizados] Iniciando actualización de movimientos...',
      );

      // 1. Obtener todos los movimientos de venta que necesitan actualización
      const { data: movimientos, error: movError } = await this.supabase.client
        .from('inventario_movimientos_detalle')
        .select('id, referencia_compra_id, cliente_nombre, created_at')
        .eq('tipo_movimiento', 'venta')
        .or('cliente_nombre.is.null,cliente_nombre.eq.""');

      if (movError) {
        console.error(
          '[actualizarMovimientosDesincronizados] Error obteniendo movimientos:',
          movError,
        );
        throw movError;
      }

      if (!movimientos || movimientos.length === 0) {
        console.log(
          '[actualizarMovimientosDesincronizados] No hay movimientos para actualizar',
        );
        return { totalActualizados: 0 };
      }

      console.log(
        `[actualizarMovimientosDesincronizados] Encontrados ${movimientos.length} movimientos para actualizar`,
      );

      // 2. Obtener todas las compras y clientes para mapearlas
      const comprasIds = movimientos
        .map((m) => m.referencia_compra_id)
        .filter(Boolean);

      const { data: compras } = await this.supabase.client
        .from('cliente_compras')
        .select('id, cliente_id, fecha_compra')
        .in('id', comprasIds);

      const clientesIds = Array.from(
        new Set((compras || []).map((c) => c.cliente_id)),
      ).filter(Boolean);

      const { data: clientes } = await this.supabase.client
        .from('clientes')
        .select('id, nombres')
        .in('id', clientesIds);

      const comprasMap = new Map(
        (compras || []).map((c) => [
          c.id,
          { cliente_id: c.cliente_id, fecha_compra: c.fecha_compra },
        ]),
      );

      const clientesMap = new Map(
        (clientes || []).map((c) => [c.id, c.nombres]),
      );

      // 3. Actualizar cada movimiento
      let actualizado = 0;
      for (const movimiento of movimientos) {
        try {
          const compraData = comprasMap.get(movimiento.referencia_compra_id);
          if (!compraData) {
            console.warn(
              `⚠️ No se encontró compra para movimiento ${movimiento.id}`,
            );
            continue;
          }

          const nombreCliente =
            clientesMap.get(compraData.cliente_id) || 'Desconocido';
          const fechaReal = compraData.fecha_compra;

          const { error: updateError } = await this.supabase.client
            .from('inventario_movimientos_detalle')
            .update({
              cliente_nombre: nombreCliente,
              created_at: fechaReal,
            })
            .eq('id', movimiento.id);

          if (updateError) {
            console.error(
              `❌ Error actualizando movimiento ${movimiento.id}:`,
              updateError,
            );
          } else {
            actualizado++;
            console.log(
              `✅ Movimiento ${movimiento.id} actualizado: ${nombreCliente} - ${fechaReal}`,
            );
          }
        } catch (error) {
          console.error(
            `❌ Error procesando movimiento ${movimiento.id}:`,
            error,
          );
        }
      }

      console.log(
        `[actualizarMovimientosDesincronizados] Actualización completada: ${actualizado} de ${movimientos.length}`,
      );

      return { totalActualizados: actualizado };
    } catch (error) {
      console.error(
        '[actualizarMovimientosDesincronizados] Error general:',
        error,
      );
      return {
        totalActualizados: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}
