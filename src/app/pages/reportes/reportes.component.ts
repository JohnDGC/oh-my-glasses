import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  ReportesService,
  ReporteVentas,
  ReporteInventario,
  ReporteCliente,
  MetricasDashboard,
  FiltrosReporte,
  ReportesConfig,
  PeriodoInventario,
} from '../../services/reportes.service';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { Cliente, ClienteCompra } from '../../models/cliente.model';

type TabReportes =
  | 'ventas'
  | 'inventario'
  | 'clientes'
  | 'dashboard'
  | 'configuracion';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  activeTab: TabReportes = 'dashboard';

  // Filtros compartidos
  filtros: FiltrosReporte = {
    fechaDesde: '',
    fechaHasta: '',
    seccion: '',
    tipoMontura: '',
  };

  // Opciones para filtros
  secciones = [
    'Labradorita',
    'Piedras Preciosas',
    'Cianita',
    'Obsidiana',
    'Cuarzo',
    'Citrino',
  ];

  tiposMonturas = [
    'Clásica 1',
    'Clásica 2',
    'Clásica 3',
    'Clásica 4',
    'Taizu',
    'Fento',
    'MH',
    'Lacoste',
    'CK',
    'RayBan',
  ];

  // Datos de reportes
  reporteVentas: ReporteVentas[] = [];
  reporteInventario: ReporteInventario[] = [];
  reporteClientes: ReporteCliente[] = [];
  metricasDashboard: MetricasDashboard | null = null;

  // Estados de carga
  loadingVentas = false;
  loadingInventario = false;
  loadingClientes = false;
  loadingDashboard = false;

  // KPIs rápidos
  ventasHoy: { total_ventas: number; dinero_total: number } = {
    total_ventas: 0,
    dinero_total: 0,
  };
  ventas7Dias: { total_ventas: number; dinero_total: number } = {
    total_ventas: 0,
    dinero_total: 0,
  };
  ventas30Dias: { total_ventas: number; dinero_total: number } = {
    total_ventas: 0,
    dinero_total: 0,
  };
  stockBajoMinimo: ReporteInventario[] = [];

  // Configuración de períodos
  reportesConfig: ReportesConfig | null = null;
  periodosDisponibles: PeriodoInventario[] = [];
  periodoSeleccionado: PeriodoInventario | null = null;
  periodoSeleccionadoVentas: string = '';

  // Estados de configuración
  editandoConfig = false;
  diaCorteTemp: number = 5;
  configForm: FormGroup;
  isLoading = false;

  // Clientes - Buscador y filtros
  searchClientesTerm = '';
  filtroPagoClientes: 'todos' | 'completo' | 'pendiente' = 'todos';

  // Paginación Ventas
  ventasPage = 1;
  ventasItemsPerPage = 25;
  ventasItemsPerPageOptions = [25, 50, 100];

  // Paginación Clientes
  clientesPage = 1;
  clientesItemsPerPage = 25;
  clientesItemsPerPageOptions = [25, 50, 100];

  // Modal Info Cliente (reutilizado)
  showInfoModal = false;
  selectedCliente: Cliente | null = null;
  infoCompras: ClienteCompra[] = [];
  isLoadingInfoCompras = false;

  constructor(
    private reportesService: ReportesService,
    private authService: AuthService,
    private fb: FormBuilder,
    private clienteService: ClienteService,
  ) {
    this.configForm = this.fb.group({
      dia_corte: [
        5,
        [Validators.required, Validators.min(1), Validators.max(31)],
      ],
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.loadKPIsRapidos();
    this.loadConfiguracion();
  }

  // ============================================
  // NAVEGACIÓN DE TABS
  // ============================================

  changeTab(tab: TabReportes): void {
    this.activeTab = tab;

    // Cargar datos según el tab seleccionado
    switch (tab) {
      case 'ventas':
        if (this.reporteVentas.length === 0) {
          this.loadReporteVentas();
        }
        break;
      case 'inventario':
        if (this.reporteInventario.length === 0) {
          this.loadReporteInventario();
        }
        break;
      case 'clientes':
        if (this.reporteClientes.length === 0) {
          this.loadReporteClientes();
        }
        break;
      case 'dashboard':
        if (!this.metricasDashboard) {
          this.loadDashboard();
        }
        break;
    }
  }

  // ============================================
  // CARGA DE DATOS - DASHBOARD
  // ============================================

  async loadDashboard(): Promise<void> {
    this.loadingDashboard = true;
    try {
      this.metricasDashboard =
        await this.reportesService.getMetricasDashboard();
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      this.loadingDashboard = false;
    }
  }

  async loadKPIsRapidos(): Promise<void> {
    try {
      this.ventasHoy = await this.reportesService.getVentasHoy();
      this.ventas7Dias = await this.reportesService.getVentasUltimosDias(7);
      this.ventas30Dias = await this.reportesService.getVentasUltimosDias(30);
      this.stockBajoMinimo = await this.reportesService.getStockBajoMinimo();
    } catch (error) {
      console.error('Error al cargar KPIs rápidos:', error);
    }
  }

  // ============================================
  // CARGA DE DATOS - VENTAS
  // ============================================

  async loadReporteVentas(): Promise<void> {
    this.loadingVentas = true;
    try {
      this.reporteVentas = await this.reportesService.getReporteVentasPorFecha(
        this.filtros,
      );
      this.ventasPage = 1;
    } catch (error) {
      console.error('Error al cargar reporte de ventas:', error);
    } finally {
      this.loadingVentas = false;
    }
  }

  calcularTotalVentas(): {
    total_ventas: number;
    dinero_total: number;
    abonos_pagados: number;
  } {
    const total_ventas = this.reporteVentas.reduce(
      (sum, r) => sum + r.total_ventas,
      0,
    );
    const dinero_total = this.reporteVentas.reduce(
      (sum, r) => sum + r.dinero_total,
      0,
    );
    const abonos_pagados = this.reporteVentas.reduce(
      (sum, r) => sum + r.abonos_pagados,
      0,
    );

    return { total_ventas, dinero_total, abonos_pagados };
  }

  exportarVentas(): void {
    this.reportesService.exportToCSV(this.reporteVentas, 'reporte_ventas');
  }

  // ============================================
  // CARGA DE DATOS - INVENTARIO
  // ============================================

  async loadReporteInventario(): Promise<void> {
    this.loadingInventario = true;
    try {
      this.reporteInventario = await this.reportesService.getReporteInventario(
        this.filtros,
      );
    } catch (error) {
      console.error('Error al cargar reporte de inventario:', error);
    } finally {
      this.loadingInventario = false;
    }
  }

  calcularTotalStock(): {
    total_stock: number;
    total_vendido: number;
    bajo_minimo: number;
  } {
    const total_stock = this.reporteInventario.reduce(
      (sum, r) => sum + r.stock_actual,
      0,
    );
    const total_vendido = this.reporteInventario.reduce(
      (sum, r) => sum + r.total_vendido,
      0,
    );
    const bajo_minimo = this.reporteInventario.filter(
      (r) => r.stock_actual < r.stock_minimo,
    ).length;

    return { total_stock, total_vendido, bajo_minimo };
  }

  exportarInventario(): void {
    this.reportesService.exportToCSV(
      this.reporteInventario,
      'reporte_inventario',
    );
  }

  // ============================================
  // CARGA DE DATOS - CLIENTES
  // ============================================

  async loadReporteClientes(): Promise<void> {
    this.loadingClientes = true;
    try {
      this.reporteClientes = await this.reportesService.getReporteClientes(
        this.filtros,
      );
      this.clientesPage = 1;
    } catch (error) {
      console.error('Error al cargar reporte de clientes:', error);
    } finally {
      this.loadingClientes = false;
    }
  }

  calcularTotalClientes(): {
    total_clientes: number;
    dinero_total: number;
    saldo_pendiente: number;
    promedio_compra: number;
  } {
    const total_clientes = this.reporteClientes.length;
    const dinero_total = this.reporteClientes.reduce(
      (sum, c) => sum + c.dinero_total,
      0,
    );
    const saldo_pendiente = this.reporteClientes.reduce(
      (sum, c) => sum + c.saldo_pendiente,
      0,
    );
    const promedio_compra =
      total_clientes > 0 ? dinero_total / total_clientes : 0;

    return { total_clientes, dinero_total, saldo_pendiente, promedio_compra };
  }

  exportarClientes(): void {
    // Excluir cliente_id de la exportación
    this.reportesService.exportToCSV(this.reporteClientes, 'reporte_clientes', [
      'cliente_id',
    ]);
  }

  // ============================================
  // FILTROS
  // ============================================

  aplicarFiltros(): void {
    // Ajustar fechas para incluir el rango completo del día
    const filtrosAjustados = { ...this.filtros };

    if (filtrosAjustados.fechaDesde) {
      // Agregar tiempo de inicio del día (00:00:00)
      filtrosAjustados.fechaDesde = `${filtrosAjustados.fechaDesde}T00:00:00`;
    }

    if (filtrosAjustados.fechaHasta) {
      // Agregar tiempo de fin del día (23:59:59)
      filtrosAjustados.fechaHasta = `${filtrosAjustados.fechaHasta}T23:59:59`;
    }

    switch (this.activeTab) {
      case 'ventas':
        this.loadReporteVentasConFiltros(filtrosAjustados);
        break;
      case 'inventario':
        this.loadReporteInventarioConFiltros(filtrosAjustados);
        break;
      case 'clientes':
        this.loadReporteClientesConFiltros(filtrosAjustados);
        break;
    }
  }

  private async loadReporteVentasConFiltros(
    filtros: FiltrosReporte,
  ): Promise<void> {
    this.loadingVentas = true;
    try {
      this.reporteVentas =
        await this.reportesService.getReporteVentasPorFecha(filtros);
      this.ventasPage = 1;
    } catch (error) {
      console.error('Error al cargar reporte de ventas:', error);
    } finally {
      this.loadingVentas = false;
    }
  }

  private async loadReporteInventarioConFiltros(
    filtros: FiltrosReporte,
  ): Promise<void> {
    this.loadingInventario = true;
    try {
      this.reporteInventario =
        await this.reportesService.getReporteInventario(filtros);
    } catch (error) {
      console.error('Error al cargar reporte de inventario:', error);
    } finally {
      this.loadingInventario = false;
    }
  }

  private async loadReporteClientesConFiltros(
    filtros: FiltrosReporte,
  ): Promise<void> {
    this.loadingClientes = true;
    try {
      this.reporteClientes =
        await this.reportesService.getReporteClientes(filtros);
      this.clientesPage = 1;
    } catch (error) {
      console.error('Error al cargar reporte de clientes:', error);
    } finally {
      this.loadingClientes = false;
    }
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaDesde: '',
      fechaHasta: '',
      seccion: '',
      tipoMontura: '',
    };
    this.periodoSeleccionadoVentas = '';
    this.aplicarFiltros();
  }

  // ============================================
  // UTILIDADES
  // ============================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  formatDate(dateString: string): string {
    // Si la fecha ya está en formato YYYY-MM-DD, parsearla correctamente
    if (dateString.includes('-') && !dateString.includes('T')) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    // Para fechas con timestamp completo
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  getRotacionClass(rotacion: number): string {
    if (rotacion > 1) return 'text-success';
    if (rotacion > 0.5) return 'text-warning';
    return 'text-danger';
  }

  getStockClass(stock: number, minimo: number): string {
    if (stock < minimo) return 'text-danger fw-bold';
    if (stock < minimo * 1.5) return 'text-warning';
    return '';
  }

  // ============================================
  // PAGINACIÓN - VENTAS
  // ============================================

  get ventasTotalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.reporteVentas.length / this.ventasItemsPerPage),
    );
  }

  get ventasPageNumbers(): number[] {
    return Array.from({ length: this.ventasTotalPages }, (_, i) => i + 1);
  }

  get ventasPaginated(): ReporteVentas[] {
    const start = (this.ventasPage - 1) * this.ventasItemsPerPage;
    return this.reporteVentas.slice(start, start + this.ventasItemsPerPage);
  }

  get ventasStartIndex(): number {
    return this.reporteVentas.length === 0
      ? 0
      : (this.ventasPage - 1) * this.ventasItemsPerPage + 1;
  }

  get ventasEndIndex(): number {
    return Math.min(
      this.ventasPage * this.ventasItemsPerPage,
      this.reporteVentas.length,
    );
  }

  goVentasPage(page: number): void {
    if (page < 1 || page > this.ventasTotalPages) return;
    this.ventasPage = page;
  }

  setVentasItemsPerPage(value: number): void {
    this.ventasItemsPerPage = value;
    this.ventasPage = 1;
  }

  // ============================================
  // FILTROS + PAGINACIÓN - CLIENTES
  // ============================================

  get clientesFiltrados(): ReporteCliente[] {
    const term = this.searchClientesTerm.trim().toLowerCase();
    return this.reporteClientes.filter((cliente) => {
      const nombre = (cliente.cliente_nombre || '').toLowerCase();
      const cedula = (cliente.cliente_cedula || '').toLowerCase();
      const matchTerm = !term || nombre.includes(term) || cedula.includes(term);

      if (!matchTerm) return false;

      if (this.filtroPagoClientes === 'completo') {
        return cliente.saldo_pendiente <= 0;
      }
      if (this.filtroPagoClientes === 'pendiente') {
        return cliente.saldo_pendiente > 0;
      }

      return true;
    });
  }

  get clientesTotalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.clientesFiltrados.length / this.clientesItemsPerPage),
    );
  }

  get clientesPageNumbers(): number[] {
    return Array.from({ length: this.clientesTotalPages }, (_, i) => i + 1);
  }

  get clientesPaginated(): ReporteCliente[] {
    const start = (this.clientesPage - 1) * this.clientesItemsPerPage;
    return this.clientesFiltrados.slice(
      start,
      start + this.clientesItemsPerPage,
    );
  }

  get clientesStartIndex(): number {
    return this.clientesFiltrados.length === 0
      ? 0
      : (this.clientesPage - 1) * this.clientesItemsPerPage + 1;
  }

  get clientesEndIndex(): number {
    return Math.min(
      this.clientesPage * this.clientesItemsPerPage,
      this.clientesFiltrados.length,
    );
  }

  goClientesPage(page: number): void {
    if (page < 1 || page > this.clientesTotalPages) return;
    this.clientesPage = page;
  }

  setClientesItemsPerPage(value: number): void {
    this.clientesItemsPerPage = value;
    this.clientesPage = 1;
  }

  onSearchClientesInput(): void {
    this.clientesPage = 1;
  }

  onFiltroPagoChange(): void {
    this.clientesPage = 1;
  }

  // ============================================
  // MODAL INFORMACIÓN COMPLETA - CLIENTES
  // ============================================

  async openInfoModalFromReporte(cliente: ReporteCliente): Promise<void> {
    this.showInfoModal = true;
    this.isLoadingInfoCompras = true;
    this.infoCompras = [];

    try {
      this.selectedCliente = await this.clienteService.getClienteById(
        cliente.cliente_id,
      );
      if (!this.selectedCliente?.id) return;
      this.infoCompras = await this.clienteService.getComprasByCliente(
        this.selectedCliente.id,
      );
    } catch (error) {
      console.error('Error cargando información del cliente:', error);
    } finally {
      this.isLoadingInfoCompras = false;
    }
  }

  closeInfoModal(): void {
    this.showInfoModal = false;
    this.selectedCliente = null;
    this.infoCompras = [];
  }

  getAbonosTotal(compra: ClienteCompra): number {
    if (!compra.cliente_abonos || compra.cliente_abonos.length === 0) {
      return compra.abono || 0;
    }
    return compra.cliente_abonos.reduce((sum, abono) => sum + abono.monto, 0);
  }

  getTotalPrecio(): number {
    return this.infoCompras.reduce(
      (sum, compra) => sum + (compra.precio_total || 0),
      0,
    );
  }

  getTotalAbonos(): number {
    return this.infoCompras.reduce(
      (sum, compra) => sum + this.getAbonosTotal(compra),
      0,
    );
  }

  getTotalSaldo(): number {
    return this.getTotalPrecio() - this.getTotalAbonos();
  }

  // ============================================
  // CONFIGURACIÓN DE PERÍODOS
  // ============================================

  async loadConfiguracion(): Promise<void> {
    try {
      this.reportesConfig = await this.reportesService.getConfig();
      this.configForm.patchValue({ dia_corte: this.reportesConfig.dia_corte });
      this.periodosDisponibles = this.reportesService.calcularPeriodos(
        this.reportesConfig.dia_corte,
      );
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  }

  activarEdicionConfig(): void {
    this.editandoConfig = true;
    this.configForm.patchValue({
      dia_corte: this.reportesConfig?.dia_corte || 5,
    });
  }

  cancelarEdicionConfig(): void {
    this.editandoConfig = false;
    this.configForm.patchValue({
      dia_corte: this.reportesConfig?.dia_corte || 5,
    });
  }

  async guardarConfiguracion(): Promise<void> {
    if (this.configForm.invalid) {
      alert('El día de corte debe estar entre 1 y 31');
      return;
    }

    const diaCorte = this.configForm.get('dia_corte')?.value;
    if (!diaCorte) return;

    try {
      this.isLoading = true;
      const user =
        this.authService.currentUserValue ??
        (await this.authService.getSession())?.user ??
        null;
      const userId = user?.email || user?.id || 'unknown';

      await this.reportesService.updateConfig(diaCorte, userId);
      await this.loadConfiguracion();
      this.editandoConfig = false;
      alert('✅ Configuración actualizada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('❌ Error al guardar la configuración');
    } finally {
      this.isLoading = false;
    }
  }

  aplicarFiltroPeriodoVentas(): void {
    if (!this.periodoSeleccionadoVentas) {
      alert('Selecciona un período');
      return;
    }

    const periodo = this.periodosDisponibles.find(
      (p) => p.nombre === this.periodoSeleccionadoVentas,
    );

    if (!periodo) {
      alert('El período seleccionado no es válido');
      return;
    }

    const filtros = this.reportesService.periodoToFiltros(periodo);
    this.filtros.fechaDesde = filtros.fechaDesde;
    this.filtros.fechaHasta = filtros.fechaHasta;

    this.changeTab('ventas');
    this.aplicarFiltros();

    alert(`✅ Filtro aplicado: ${periodo.nombre}`);
  }

  aplicarFiltroPeriodo(): void {
    if (!this.periodoSeleccionado) {
      alert('Selecciona un período');
      return;
    }

    const filtros = this.reportesService.periodoToFiltros(
      this.periodoSeleccionado,
    );
    this.filtros.fechaDesde = filtros.fechaDesde;
    this.filtros.fechaHasta = filtros.fechaHasta;

    // Cambiar a la pestaña de ventas
    this.changeTab('ventas');

    // Aplicar filtros
    this.aplicarFiltros();

    alert(`✅ Filtro aplicado: ${this.periodoSeleccionado.nombre}`);
  }
}
