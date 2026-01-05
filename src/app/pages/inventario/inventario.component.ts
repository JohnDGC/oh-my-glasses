import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import {
  InventarioDashboard,
  InventarioMovimiento,
  InventarioSeccion,
} from '../../models/inventario.model';
import {
  Seccion,
  TipoMontura,
  TIPOS_MONTURA,
  SECCIONES,
} from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  secciones: InventarioSeccion[] = [];
  movimientos: InventarioMovimiento[] = [];
  dashboardDia: InventarioDashboard | null = null;
  dashboardSemana: InventarioDashboard | null = null;
  dashboardMes: InventarioDashboard | null = null;

  isLoading = false;
  isLoadingMovimientos = false;
  isLoadingSecciones = false;
  showMovimientoModal = false;
  showEditStockModal = false;
  movimientoForm!: FormGroup;
  editStockForm!: FormGroup;

  // Filtros de fecha
  fechaSeleccionada: string = '';
  mesSeleccionado: string = '';
  dineroVentas: number = 0;
  dineroAbonos: number = 0;

  tiposMontura: TipoMontura[] = TIPOS_MONTURA;
  seccionesDisponibles: Seccion[] = SECCIONES;
  seccionEditando: InventarioSeccion | null = null;

  // Tabs
  activeTab: 'stock' | 'movimientos' | 'deudores' = 'stock';

  // Sincronización
  isSyncingHistoric = false;

  // Clientes deudores
  clientesDeudores: any[] = [];
  isLoadingDeudores = false;
  deudoresSearchTerm = '';
  deudoresSort: 'fecha_desc' | 'fecha_asc' | 'saldo_desc' | 'saldo_asc' =
    'fecha_desc';
  deudoresFechaDesde = '';
  deudoresFechaHasta = '';
  showDeudorModal = false;
  deudorSeleccionado: any | null = null;
  comprasPendientesDetalle: any[] = [];
  isLoadingDetalle = false;

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private clienteService: ClienteService
  ) {
    this.movimientoForm = this.fb.group({
      tipo: ['entrada', Validators.required],
      seccion_nombre: [null, Validators.required],
      tipo_montura: [null],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      monto: [null, [Validators.min(0)]],
      nota: [''],
    });

    this.editStockForm = this.fb.group({
      stock_minimo: [0, [Validators.required, Validators.min(0)]],
    });

    // Inicializar con fecha de hoy
    const hoy = new Date();
    this.fechaSeleccionada = hoy.toISOString().split('T')[0];
    this.mesSeleccionado = hoy.toISOString().substring(0, 7); // YYYY-MM
  }

  async ngOnInit() {
    await Promise.all([
      this.loadSecciones(),
      this.loadMovimientos(),
      this.loadDashboards(),
      this.loadClientesDeudores(),
    ]);
  }

  async loadDashboards() {
    this.isLoading = true;
    try {
      const [dia, semana, mes] = await Promise.all([
        this.inventarioService.getDashboard('day'),
        this.inventarioService.getDashboard('week'),
        this.inventarioService.getDashboard('month'),
      ]);
      this.dashboardDia = dia;
      this.dashboardSemana = semana;
      this.dashboardMes = mes;
    } catch (error) {
      console.error('Error cargando dashboard de inventario:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadSecciones() {
    this.isLoadingSecciones = true;
    try {
      this.secciones = await this.inventarioService.getSecciones();
    } catch (error) {
      console.error('Error cargando secciones de inventario:', error);
    } finally {
      this.isLoadingSecciones = false;
    }
  }

  async loadMovimientos() {
    this.isLoadingMovimientos = true;
    try {
      const params: any = {};

      if (this.fechaSeleccionada) {
        // Filtrar por día específico
        const fecha = new Date(this.fechaSeleccionada + 'T00:00:00');
        const fechaFin = new Date(this.fechaSeleccionada + 'T23:59:59');
        params.desde = fecha.toISOString();
        params.hasta = fechaFin.toISOString();
      } else if (this.mesSeleccionado) {
        // Filtrar por mes
        const [year, month] = this.mesSeleccionado.split('-');
        const primerDia = new Date(parseInt(year), parseInt(month) - 1, 1);
        const ultimoDia = new Date(
          parseInt(year),
          parseInt(month),
          0,
          23,
          59,
          59
        );
        params.desde = primerDia.toISOString();
        params.hasta = ultimoDia.toISOString();
      }

      this.movimientos = await this.inventarioService.getMovimientos(params);
      this.calcularDineroTotal();
    } catch (error) {
      console.error('Error cargando movimientos de inventario:', error);
    } finally {
      this.isLoadingMovimientos = false;
    }
  }

  calcularDineroTotal() {
    this.dineroVentas = 0;
    this.dineroAbonos = 0;

    this.movimientos.forEach((mov) => {
      if (mov.tipo === 'venta' && mov.monto) {
        this.dineroVentas += Number(mov.monto);
      }
      // Los abonos podrían tener un tipo diferente o estar en la nota
      // Por ahora asumimos que abonos se registran como notas en ventas
    });
  }

  onFechaChange() {
    // Limpiar mes si se selecciona día
    this.mesSeleccionado = '';
    this.loadMovimientos();
  }

  onMesChange() {
    // Limpiar fecha si se selecciona mes
    this.fechaSeleccionada = '';
    this.loadMovimientos();
  }

  limpiarFiltros() {
    this.fechaSeleccionada = '';
    this.mesSeleccionado = '';
    this.loadMovimientos();
  }

  async loadClientesDeudores() {
    this.isLoadingDeudores = true;
    try {
      this.clientesDeudores =
        await this.inventarioService.getClientesDeudores();
    } catch (error) {
      console.error('Error cargando clientes deudores:', error);
    } finally {
      this.isLoadingDeudores = false;
    }
  }

  get deudoresFiltrados(): any[] {
    let lista = [...this.clientesDeudores];

    if (this.deudoresSearchTerm.trim()) {
      const term = this.deudoresSearchTerm.toLowerCase();
      lista = lista.filter(
        (d) =>
          d.cliente_nombre?.toLowerCase().includes(term) ||
          d.cliente_cedula?.toLowerCase().includes(term)
      );
    }

    if (this.deudoresFechaDesde || this.deudoresFechaHasta) {
      const desde = this.deudoresFechaDesde
        ? new Date(this.deudoresFechaDesde + 'T00:00:00')
        : null;
      const hasta = this.deudoresFechaHasta
        ? new Date(this.deudoresFechaHasta + 'T23:59:59')
        : null;

      lista = lista.filter((d) => {
        const fecha = d.latest_compra ? new Date(d.latest_compra) : null;
        if (!fecha) return false;
        if (desde && fecha < desde) return false;
        if (hasta && fecha > hasta) return false;
        return true;
      });
    }

    return lista.sort((a, b) => {
      const fechaA = new Date(a.latest_compra || 0).getTime();
      const fechaB = new Date(b.latest_compra || 0).getTime();
      switch (this.deudoresSort) {
        case 'fecha_asc':
          return fechaA - fechaB;
        case 'saldo_asc':
          return a.saldo_pendiente - b.saldo_pendiente;
        case 'saldo_desc':
          return b.saldo_pendiente - a.saldo_pendiente;
        case 'fecha_desc':
        default:
          return fechaB - fechaA;
      }
    });
  }

  getTotalPorCobrar(): number {
    return this.clientesDeudores.reduce((sum, c) => sum + c.saldo_pendiente, 0);
  }

  openMovimientoModal(tipo: 'entrada' | 'ajuste') {
    this.showMovimientoModal = true;
    this.movimientoForm.reset({
      tipo,
      seccion_nombre: null,
      tipo_montura: null,
      cantidad: 1,
      monto: null,
      nota: '',
    });
  }

  closeMovimientoModal() {
    this.showMovimientoModal = false;
  }

  // Edición de stock mínimo
  openEditStockModal(seccion: InventarioSeccion) {
    this.seccionEditando = seccion;
    this.showEditStockModal = true;
    this.editStockForm.patchValue({
      stock_minimo: seccion.stock_minimo || 0,
    });
  }

  closeEditStockModal() {
    this.showEditStockModal = false;
    this.seccionEditando = null;
  }

  async updateStockMinimo() {
    if (this.editStockForm.invalid || !this.seccionEditando?.id) {
      this.editStockForm.markAllAsTouched();
      return;
    }

    try {
      await this.inventarioService.updateStockMinimo(
        this.seccionEditando.id,
        this.editStockForm.value.stock_minimo
      );
      this.closeEditStockModal();
      await this.loadSecciones();
    } catch (error) {
      console.error('Error actualizando stock mínimo:', error);
      alert('No se pudo actualizar el stock mínimo');
    }
  }

  async registrarMovimiento() {
    if (this.movimientoForm.invalid) {
      this.movimientoForm.markAllAsTouched();
      return;
    }

    const payload = this.movimientoForm.value;
    try {
      await this.inventarioService.crearMovimiento({
        seccion_nombre: payload.seccion_nombre,
        tipo: payload.tipo,
        tipo_montura: payload.tipo_montura,
        cantidad: payload.cantidad,
        monto: payload.monto,
        nota: payload.nota,
      });
      this.closeMovimientoModal();
      await Promise.all([
        this.loadSecciones(),
        this.loadMovimientos(),
        this.loadDashboards(),
      ]);
    } catch (error) {
      console.error('Error registrando movimiento de inventario:', error);
      alert('No se pudo registrar el movimiento');
    }
  }

  setActiveTab(tab: 'stock' | 'movimientos' | 'deudores') {
    this.activeTab = tab;
    if (tab === 'deudores') {
      this.loadClientesDeudores();
    }
  }

  async openDetalleDeudor(deudor: any) {
    this.deudorSeleccionado = deudor;
    this.showDeudorModal = true;
    this.isLoadingDetalle = true;
    this.comprasPendientesDetalle = [];

    try {
      const compras = await this.clienteService.getComprasByCliente(
        deudor.cliente_id
      );

      this.comprasPendientesDetalle = (compras || [])
        .map((c) => {
          const abonos = (c.cliente_abonos || []) as any[];
          const abonado = abonos.reduce(
            (sum, ab) => sum + Number(ab.monto || 0),
            0
          );
          const precioTotal = Number(c.precio_total || 0);
          const saldo = precioTotal - abonado;

          return {
            id: c.id,
            fecha: c.fecha_compra || c.created_at,
            tipo_montura: c.tipo_montura,
            rango_precio: c.rango_precio,
            precio_total: precioTotal,
            abonado,
            saldo,
            seccion: c.seccion,
          };
        })
        .filter((c) => c.saldo > 0)
        .sort(
          (a, b) =>
            new Date(b.fecha || '').getTime() -
            new Date(a.fecha || '').getTime()
        );
    } catch (error) {
      console.error('Error cargando detalle de deudor:', error);
      alert('No se pudo cargar el detalle del cliente');
    } finally {
      this.isLoadingDetalle = false;
    }
  }

  closeDetalleDeudor() {
    this.showDeudorModal = false;
    this.deudorSeleccionado = null;
    this.comprasPendientesDetalle = [];
  }

  async sincronizarHistorico() {
    if (
      !confirm(
        '¿Deseas sincronizar todas las compras históricas con el inventario? Esto puede tomar unos momentos.'
      )
    ) {
      return;
    }

    this.isSyncingHistoric = true;
    try {
      const resultado =
        await this.inventarioService.sincronizarComprasHistoricas();
      alert(
        `Sincronización completada:\n✅ ${
          resultado.sincronizadas
        } compras importadas\n${
          resultado.errores > 0 ? `❌ ${resultado.errores} errores` : ''
        }`
      );
      await Promise.all([
        this.loadSecciones(),
        this.loadMovimientos(),
        this.loadDashboards(),
      ]);
    } catch (error) {
      console.error('Error en sincronización:', error);
      alert('No se pudo completar la sincronización');
    } finally {
      this.isSyncingHistoric = false;
    }
  }
}
