import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { AuthService } from '../../services/auth.service';
import {
  StockCard,
  HistoricoPeriodo,
  MovimientoDetalle,
  ReestockGlobalData,
  AdicionEspecificaData,
  ReestockItem,
} from '../../models/inventario.model';
import {
  Seccion,
  TipoMontura,
  TIPOS_MONTURA,
  SECCIONES,
} from '../../models/cliente.model';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  // Main data
  stockCards: StockCard[] = [];
  historicoPeriodos: HistoricoPeriodo[] = [];
  movimientosDetalle: MovimientoDetalle[] = [];

  // Loading states
  isLoading = false;
  isLoadingHistorico = false;

  // Modal states
  showReestockModal = false;
  showAdicionModal = false;
  showHistoricoModal = false;
  showEditStockModal = false;
  showDetalleModal = false;

  // Forms
  reestockForm!: FormGroup;
  adicionForm!: FormGroup;
  editStockForm!: FormGroup;
  configForm!: FormGroup;

  // Tabs
  activeTab:
    | 'stock'
    | 'historico'
    | 'historial-reestock'
    | 'historial-ventas'
    | 'configuracion' = 'stock';

  // Stock editing
  seccionEditando: string = '';
  monturaEditando: TipoMontura | null = null;
  tipoCompraEditando: 'Gafas formuladas' | 'Gafas de sol' | null = null;

  // Historical detail viewing
  periodoDetalle: HistoricoPeriodo | null = null;
  movimientosDelPeriodo: MovimientoDetalle[] = [];

  // Historical filters
  historicoFechaDesde = '';
  historicoFechaHasta = '';
  historicoTipo: 'reestock_global' | 'adicion_minima' | '' = '';

  // New: Historial data
  historicoReestock: MovimientoDetalle[] = [];
  historicoVentas: MovimientoDetalle[] = [];
  estadisticasVentas: any[] = [];

  // New: Filter states for historiales
  reestockFechaDesde = '';
  reestockFechaHasta = '';
  ventasFechaDesde = '';
  ventasFechaHasta = '';
  ventasSeccionFiltro = '';

  // New: Configuration
  configuracion: any = {
    fecha_inicio_tracking: '',
    tracking_activo: 'true',
  };
  showConfigModal = false;

  // Multiple specific additions
  adicionesTemporales: Array<{
    seccion: Seccion | 'Piedras Preciosas';
    tipo_montura: TipoMontura;
    tipo_compra: 'Gafas formuladas' | 'Gafas de sol';
    cantidad: number;
    nota?: string;
  }> = [];

  // Constants
  tiposMontura: TipoMontura[] = TIPOS_MONTURA.filter(
    (m) => m !== 'Sin Montura',
  );
  // Monturas filtradas dinámicamente según la sección seleccionada
  monturasDisponibles: TipoMontura[] = [];
  seccionesDisponibles: (Seccion | 'Piedras Preciosas')[] = [
    'Labradorita',
    'Piedras Preciosas',
    'Cianita',
    'Obsidiana',
    'Cuarzo',
    'Citrino',
  ];

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private authService: AuthService,
  ) {
    this.initForms();
  }

  async ngOnInit() {
    await this.loadStockCards();
    await this.loadConfiguracion();
    this.setupAdicionFormWatchers();
  }

  private setupAdicionFormWatchers() {
    // Watch for section AND tipo_compra changes to filter available monturas
    const updateMonturas = () => {
      const seccion = this.adicionForm.get('seccion')?.value;
      const tipoCompra =
        this.adicionForm.get('tipo_compra')?.value || 'Gafas formuladas';

      if (seccion) {
        this.monturasDisponibles = this.inventarioService.getMonturasPorSeccion(
          seccion,
          tipoCompra,
        );
        // Reset montura selection when section or tipo_compra changes
        this.adicionForm.patchValue(
          { tipo_montura: null },
          { emitEvent: false },
        );
      } else {
        this.monturasDisponibles = [];
      }
    };

    this.adicionForm.get('seccion')?.valueChanges.subscribe(updateMonturas);
    this.adicionForm.get('tipo_compra')?.valueChanges.subscribe(updateMonturas);
  }

  private initForms() {
    // Restock global form with FormArray for editable table
    this.reestockForm = this.fb.group({
      descripcion: [''],
      stockItems: this.fb.array([]),
    });

    // Specific addition form
    this.adicionForm = this.fb.group({
      seccion: [null, Validators.required],
      tipo_compra: ['Gafas formuladas', Validators.required],
      tipo_montura: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      nota: [''],
    });

    // Edit stock minimum form
    this.editStockForm = this.fb.group({
      stock_minimo: [0, [Validators.required, Validators.min(0)]],
    });

    // Configuration form
    this.configForm = this.fb.group({
      fecha_inicio_tracking: ['', Validators.required],
      tracking_activo: ['true', Validators.required],
    });
  }

  get stockItems(): FormArray {
    return this.reestockForm.get('stockItems') as FormArray;
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async loadStockCards() {
    this.isLoading = true;
    try {
      this.stockCards = await this.inventarioService.getStockBySection();
    } catch (error) {
      console.error('Error loading stock cards:', error);
      alert('No se pudo cargar el inventario');
    } finally {
      this.isLoading = false;
    }
  }

  async loadHistorico() {
    this.isLoadingHistorico = true;
    try {
      const filters: any = {};

      if (this.historicoTipo) {
        filters.tipo = this.historicoTipo;
      }
      if (this.historicoFechaDesde) {
        filters.desde = new Date(
          this.historicoFechaDesde + 'T00:00:00',
        ).toISOString();
      }
      if (this.historicoFechaHasta) {
        filters.hasta = new Date(
          this.historicoFechaHasta + 'T23:59:59',
        ).toISOString();
      }

      this.historicoPeriodos =
        await this.inventarioService.getHistoricoPeriodos(filters);
    } catch (error) {
      console.error('Error loading historico:', error);
    } finally {
      this.isLoadingHistorico = false;
    }
  }

  async loadMovimientosDetalle(filters?: any) {
    try {
      this.movimientosDetalle =
        await this.inventarioService.getMovimientosDetalle(filters);
    } catch (error) {
      console.error('Error loading movimientos detalle:', error);
    }
  }

  // ============================================================================
  // TAB NAVIGATION
  // ============================================================================

  setActiveTab(
    tab:
      | 'stock'
      | 'historico'
      | 'historial-reestock'
      | 'historial-ventas'
      | 'configuracion',
  ) {
    this.activeTab = tab;
    if (tab === 'historico' && this.historicoPeriodos.length === 0) {
      this.loadHistorico();
    } else if (tab === 'historial-reestock') {
      this.loadHistoricoReestock();
    } else if (tab === 'historial-ventas') {
      this.loadHistoricoVentas();
    }
  }

  limpiarFiltrosHistorico() {
    this.historicoFechaDesde = '';
    this.historicoFechaHasta = '';
    this.historicoTipo = '';
    this.loadHistorico();
  }

  // ============================================================================
  // RESTOCK GLOBAL MODAL
  // ============================================================================

  async openReestockModal() {
    this.showReestockModal = true;
    this.isLoading = true;

    try {
      // Load current stock to populate the form
      const allStock = await this.inventarioService.getAllStock();

      // Clear existing form array
      this.stockItems.clear();

      // Add each stock item to the form
      allStock.forEach((stock) => {
        this.stockItems.push(
          this.fb.group({
            seccion: [stock.seccion],
            tipo_montura: [stock.tipo_montura],
            tipo_compra: [stock.tipo_compra], // Include tipo_compra for badge display
            stock_actual: [stock.stock_actual],
            cantidad_nueva: [0, [Validators.required, Validators.min(0)]],
          }),
        );
      });

      // Prefill with current stock
      this.copiarStockActual();
    } catch (error) {
      console.error('Error opening restock modal:', error);
      alert('No se pudo cargar los datos para el reestock');
      this.closeReestockModal();
    } finally {
      this.isLoading = false;
    }
  }

  copiarStockActual() {
    this.stockItems.controls.forEach((control) => {
      const stockActual = control.get('stock_actual')?.value || 0;
      control.patchValue({ cantidad_nueva: stockActual });
    });
  }

  closeReestockModal() {
    this.showReestockModal = false;
    this.reestockForm.reset();
    this.stockItems.clear();
  }

  async confirmarReestockGlobal() {
    if (this.reestockForm.invalid) {
      this.reestockForm.markAllAsTouched();
      return;
    }

    const stockTotal = this.stockItems.controls.reduce((sum, control) => {
      return sum + (control.get('cantidad_nueva')?.value || 0);
    }, 0);

    if (
      !confirm(
        `¿Confirmar Reestock Global?\n\n` +
          `Esto cerrará el período actual y archivará todo el histórico.\n` +
          `Total de monturas a agregar: ${stockTotal}\n\n` +
          `¿Deseas continuar?`,
      )
    ) {
      return;
    }

    this.isLoading = true;
    try {
      const reestockData: ReestockGlobalData = {
        descripcion: this.reestockForm.value.descripcion || 'Reestock global',
        stock_nuevo: this.stockItems.controls.map((control) => ({
          seccion: control.value.seccion,
          tipo_montura: control.value.tipo_montura,
          tipo_compra: control.value.tipo_compra,
          cantidad_nueva: control.value.cantidad_nueva || 0,
        })) as ReestockItem[],
      };

      // Resolve current user: prefer in-memory value, fallback to session lookup
      const user =
        this.authService.currentUserValue ??
        (await this.authService.getSession())?.user ??
        null;
      const userId = user?.email || user?.id || 'unknown';

      await this.inventarioService.realizarReestockGlobal(reestockData, userId);

      alert('✅ Reestock global completado. Período anterior archivado.');
      this.closeReestockModal();
      await this.loadStockCards();
    } catch (error) {
      console.error('Error en reestock global:', error);
      alert('No se pudo completar el reestock global');
    } finally {
      this.isLoading = false;
    }
  }

  // ============================================================================
  // SPECIFIC ADDITION MODAL
  // ============================================================================

  openAdicionModal() {
    this.showAdicionModal = true;
    this.adicionesTemporales = [];
    this.adicionForm.reset({
      seccion: null,
      tipo_montura: null,
      cantidad: 1,
      nota: '',
    });
  }

  closeAdicionModal() {
    this.showAdicionModal = false;
    this.adicionesTemporales = [];
  }

  agregarAListaAdicion() {
    if (this.adicionForm.invalid) {
      this.adicionForm.markAllAsTouched();
      return;
    }

    this.adicionesTemporales.push({
      seccion: this.adicionForm.value.seccion,
      tipo_compra: this.adicionForm.value.tipo_compra,
      tipo_montura: this.adicionForm.value.tipo_montura,
      cantidad: this.adicionForm.value.cantidad,
      nota: this.adicionForm.value.nota || '',
    });

    // Reset form except section and tipo_compra (to make adding multiple easier)
    this.adicionForm.patchValue({
      tipo_montura: null,
      cantidad: 1,
      nota: '',
    });
  }

  eliminarDeListaAdicion(index: number) {
    this.adicionesTemporales.splice(index, 1);
  }

  async confirmarAdicion() {
    if (this.adicionesTemporales.length === 0) {
      alert('Debes agregar al menos una adición a la lista');
      return;
    }

    this.isLoading = true;
    try {
      // Resolve current user: prefer in-memory value, fallback to session lookup
      const user =
        this.authService.currentUserValue ??
        (await this.authService.getSession())?.user ??
        null;
      const userId = user?.email || user?.id || 'unknown';

      // Process all additions sequentially
      for (const adicion of this.adicionesTemporales) {
        await this.inventarioService.agregarStockEspecifico(adicion, userId);
      }

      const totalUnidades = this.adicionesTemporales.reduce(
        (sum, a) => sum + a.cantidad,
        0,
      );
      alert(
        `✅ Stock agregado exitosamente: ${totalUnidades} unidades en ${this.adicionesTemporales.length} adición(es)`,
      );
      this.closeAdicionModal();
      await this.loadStockCards();
    } catch (error) {
      console.error('Error en adición específica:', error);
      alert('No se pudo agregar el stock');
    } finally {
      this.isLoading = false;
    }
  }

  // ============================================================================
  // EDIT STOCK MINIMUM
  // ============================================================================

  openEditStockModal(
    seccion: string,
    montura: TipoMontura,
    stockMinimo: number,
    tipoCompra: 'Gafas formuladas' | 'Gafas de sol' | 'Consulta optometria',
  ) {
    this.seccionEditando = seccion;
    this.monturaEditando = montura;
    // Filter to only allow Gafas formuladas or Gafas de sol
    if (tipoCompra === 'Gafas formuladas' || tipoCompra === 'Gafas de sol') {
      this.tipoCompraEditando = tipoCompra;
    } else {
      this.tipoCompraEditando = 'Gafas formuladas'; // Default fallback
    }
    this.showEditStockModal = true;
    this.editStockForm.patchValue({ stock_minimo: stockMinimo });
  }

  closeEditStockModal() {
    this.showEditStockModal = false;
    this.seccionEditando = '';
    this.monturaEditando = null;
    this.tipoCompraEditando = null;
  }

  async confirmarEditStockMinimo() {
    if (this.editStockForm.invalid || !this.monturaEditando) {
      this.editStockForm.markAllAsTouched();
      return;
    }

    try {
      if (!this.monturaEditando || !this.tipoCompraEditando) {
        throw new Error('Faltan datos requeridos para actualizar');
      }

      await this.inventarioService.updateStockMinimo(
        this.seccionEditando as any,
        this.monturaEditando, // monturaEditando IS the tipo_montura (string)
        this.tipoCompraEditando,
        this.editStockForm.value.stock_minimo,
      );

      this.closeEditStockModal();
      await this.loadStockCards();
    } catch (error) {
      console.error('Error updating stock_minimo:', error);
      alert('No se pudo actualizar el stock mínimo');
    }
  }

  // ============================================================================
  // HISTORICAL DETAIL MODAL
  // ============================================================================

  async openDetalleHistorico(periodo: HistoricoPeriodo) {
    this.periodoDetalle = periodo;
    this.showDetalleModal = true;
    this.isLoading = true;

    try {
      // Load movements for this period
      if (periodo.id) {
        this.movimientosDelPeriodo =
          await this.inventarioService.getMovimientosDetalle({
            operacion_id: periodo.id,
          });
      }
    } catch (error) {
      console.error('Error loading periodo detalle:', error);
    } finally {
      this.isLoading = false;
    }
  }

  closeDetalleHistorico() {
    this.showDetalleModal = false;
    this.periodoDetalle = null;
    this.movimientosDelPeriodo = [];
  }

  // ============================================================================
  // HELPERS & UTILITIES
  // ============================================================================

  getSeccionClass(seccion: string): string {
    const classes: any = {
      Labradorita: 'seccion-labradorita',
      'Piedras Preciosas': 'seccion-piedras',
      Cianita: 'seccion-cianita',
      Obsidiana: 'seccion-obsidiana',
      Cuarzo: 'seccion-cuarzo',
      Citrino: 'seccion-citrino',
    };
    return classes[seccion] || 'seccion-default';
  }

  getTipoMovimientoBadge(tipo: string): string {
    const badges: any = {
      reestock: 'badge-reestock',
      adicion: 'badge-adicion',
      venta: 'badge-venta',
    };
    return badges[tipo] || 'badge-secondary';
  }

  getTipoOperacionLabel(tipo: string): string {
    const labels: any = {
      reestock_global: 'Reestock Global',
      adicion_minima: 'Adición Específica',
    };
    return labels[tipo] || tipo;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDateShort(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  // ============================================================================
  // CONFIGURATION MANAGEMENT
  // ============================================================================

  async loadConfiguracion() {
    try {
      const configs = await this.inventarioService.getAllConfig();
      configs.forEach((config: any) => {
        this.configuracion[config.clave] = config.valor;
      });

      // Update form with loaded values
      this.configForm.patchValue({
        fecha_inicio_tracking: this.configuracion.fecha_inicio_tracking || '',
        tracking_activo: this.configuracion.tracking_activo || 'true',
      });
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  openConfigModal() {
    this.showConfigModal = true;
  }

  closeConfigModal() {
    this.showConfigModal = false;
  }

  async guardarConfiguracion() {
    if (!this.configForm.valid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const values = this.configForm.value;

      await this.inventarioService.updateConfig(
        'fecha_inicio_tracking',
        values.fecha_inicio_tracking,
      );
      await this.inventarioService.updateConfig(
        'tracking_activo',
        values.tracking_activo,
      );

      this.configuracion = values;

      alert('✅ Configuración guardada correctamente');
      this.closeConfigModal();
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error al guardar la configuración');
    }
  }

  async sincronizarComprasAnteriores() {
    if (
      !confirm(
        '¿Sincronizar compras?\n\n' +
          'Esto buscará todas las compras registradas desde la fecha de inicio del tracking ' +
          'que no estén registradas en el inventario y las agregará automáticamente.\n\n' +
          '¿Deseas continuar?',
      )
    ) {
      return;
    }

    this.isLoading = true;
    try {
      const resultado =
        await this.inventarioService.sincronizarComprasAnteriores();

      if (resultado.error) {
        alert(`❌ Error: ${resultado.error}`);
      } else {
        alert(
          `✅ Sincronización completada\n\n` +
            `Total compras encontradas: ${resultado.totalCompras}\n` +
            `Sincronizadas: ${resultado.totalSincronizadas}`,
        );
        await this.loadStockCards();
      }
    } catch (error) {
      console.error('Error sincronizing purchases:', error);
      alert('No se pudo completar la sincronización');
    } finally {
      this.isLoading = false;
    }
  }

  // ============================================================================
  // HISTORICAL REPORTS
  // ============================================================================

  async loadHistoricoReestock() {
    this.isLoading = true;
    try {
      const filters: any = {};

      if (this.reestockFechaDesde) {
        const desde = new Date(this.reestockFechaDesde + 'T00:00:00');
        filters.desde = desde.toISOString();
      }

      if (this.reestockFechaHasta) {
        const hasta = new Date(this.reestockFechaHasta + 'T23:59:59');
        filters.hasta = hasta.toISOString();
      }

      this.historicoReestock =
        await this.inventarioService.getHistoricoReestock(filters);
    } catch (error) {
      console.error('Error loading historico reestock:', error);
      alert('No se pudo cargar el histórico de reestock');
    } finally {
      this.isLoading = false;
    }
  }

  async loadHistoricoVentas() {
    this.isLoading = true;
    try {
      const filters: any = {};

      if (this.ventasSeccionFiltro) {
        filters.seccion = this.ventasSeccionFiltro;
      }

      if (this.ventasFechaDesde) {
        const desde = new Date(this.ventasFechaDesde + 'T00:00:00');
        filters.desde = desde.toISOString();
      }

      if (this.ventasFechaHasta) {
        const hasta = new Date(this.ventasFechaHasta + 'T23:59:59');
        filters.hasta = hasta.toISOString();
      }

      this.historicoVentas =
        await this.inventarioService.getHistoricoVentasPorSeccion(filters);
      this.estadisticasVentas =
        await this.inventarioService.getEstadisticasVentasPorSeccion(filters);
    } catch (error) {
      console.error('Error loading historico ventas:', error);
      alert('No se pudo cargar el histórico de ventas');
    } finally {
      this.isLoading = false;
    }
  }

  limpiarFiltrosReestock() {
    this.reestockFechaDesde = '';
    this.reestockFechaHasta = '';
    this.loadHistoricoReestock();
  }

  limpiarFiltrosVentas() {
    this.ventasFechaDesde = '';
    this.ventasFechaHasta = '';
    this.ventasSeccionFiltro = '';
    this.loadHistoricoVentas();
  }

  getMonturasList(monturas: Record<string, number>): string {
    return Object.entries(monturas)
      .map(([tipo, cantidad]) => `${tipo} (${cantidad})`)
      .join(', ');
  }

  getTotalStockActual(): number {
    return this.stockCards.reduce(
      (sum, card) => sum + card.totales.stock_actual,
      0,
    );
  }

  getTotalStockInicial(): number {
    return this.stockCards.reduce(
      (sum, card) => sum + card.totales.stock_inicial,
      0,
    );
  }

  getTotalStockAgregado(): number {
    return this.stockCards.reduce(
      (sum, card) => sum + card.totales.stock_agregado,
      0,
    );
  }

  getTotalStockSalidas(): number {
    return this.stockCards.reduce(
      (sum, card) => sum + card.totales.stock_salidas,
      0,
    );
  }

  getAlertCount(): number {
    let count = 0;
    this.stockCards.forEach((card) => {
      card.monturas.forEach((m) => {
        if (m.alerta) count++;
      });
    });
    return count;
  }
}
