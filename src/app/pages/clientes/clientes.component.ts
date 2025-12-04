import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClienteService } from '../../services/cliente.service';
import {
  WhatsAppService,
  MensajeWhatsApp,
  WhatsAppConfig,
} from '../../services/whatsapp.service';
import {
  Cliente,
  ClienteCompra,
  TIPOS_LENTE,
  TIPOS_MONTURA,
  RANGOS_PRECIO,
} from '../../models/cliente.model';
import { PaginationHelper } from '../../shared/utils/pagination.util';
import { SearchHelper } from '../../shared/utils/search.util';
import { FormatUtils } from '../../shared/utils/format.util';
import { ClienteSearchComponent } from '../../components/cliente-search/cliente-search.component';

@Component({
  selector: 'app-clientes',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ClienteSearchComponent,
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  clientesParaReferir: Cliente[] = [];
  compras: ClienteCompra[] = [];
  referidos: any[] = [];
  clienteForm!: FormGroup;
  compraForm!: FormGroup;
  pagination = new PaginationHelper<Cliente>([10, 20, 30], 10);
  search = new SearchHelper<Cliente>([
    'nombres',
    'cedula',
    'telefono',
    'correo',
  ]);
  isLoading = false;
  isLoadingCompras = false;
  isLoadingReferidos = false;
  showModal = false;
  showComprasModal = false;
  showReferidosModal = false;
  isEditMode = false;
  selectedClienteId: string | null = null;
  selectedCliente: Cliente | null = null;
  esReferido = false;
  tiposLente = TIPOS_LENTE;
  tiposMontura = TIPOS_MONTURA;
  rangosPrecio = RANGOS_PRECIO;
  Math = Math;
  formatDate = FormatUtils.formatDate;
  showWhatsAppModal = false;
  whatsAppBienvenida: MensajeWhatsApp | null = null;
  whatsAppReferido: MensajeWhatsApp | null = null;
  clienteRegistrado: { nombres: string; telefono: string } | null = null;
  clienteReferidor: { nombres: string; telefono: string } | null = null;
  rangoPrecioCompra: string = '';
  cashbackAcumuladoReferidor: number = 0;
  showConfigModal = false;
  whatsAppConfig: WhatsAppConfig = {
    nombreNegocio: '',
    mensajeBienvenida: '',
    mensajeReferido: '',
  };

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private whatsAppService: WhatsAppService
  ) {
    this.initForm();
    this.initCompraForm();
  }

  async ngOnInit() {
    this.clienteForm.get('es_referido')?.valueChanges.subscribe((value) => {
      this.esReferido = value;
      if (value) {
        this.clienteForm
          .get('cliente_referidor_id')
          ?.setValidators(Validators.required);
      } else {
        this.clienteForm.get('cliente_referidor_id')?.clearValidators();
        this.clienteForm.get('cliente_referidor_id')?.setValue(null);
      }
      this.clienteForm.get('cliente_referidor_id')?.updateValueAndValidity();
    });

    await this.loadClientes();
  }

  initForm() {
    this.clienteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      cedula: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      fecha_nacimiento: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      correo: ['', [Validators.required, Validators.email]],
      es_referido: [false],
      cliente_referidor_id: [null],
      primera_compra_tipo_lente: ['', Validators.required],
      primera_compra_tipo_montura: ['', Validators.required],
      primera_compra_rango_precio: ['', Validators.required],
    });

    this.clienteForm
      .get('cedula')
      ?.valueChanges.pipe(
        debounceTime(500), // Esperar 500ms después de que el usuario deje de escribir
        distinctUntilChanged()
      )
      .subscribe(async (cedula) => {
        const cedulaControl = this.clienteForm.get('cedula');

        if (cedula && cedula.length >= 6 && cedulaControl?.valid) {
          const existe = await this.clienteService.verificarCedulaExistente(
            cedula,
            this.selectedClienteId || undefined
          );

          if (existe) {
            cedulaControl?.setErrors({
              ...cedulaControl.errors,
              cedulaDuplicada: true,
            });
          } else {
            if (cedulaControl?.errors?.['cedulaDuplicada']) {
              const { cedulaDuplicada, ...otherErrors } = cedulaControl.errors;
              cedulaControl?.setErrors(
                Object.keys(otherErrors).length > 0 ? otherErrors : null
              );
            }
          }
        }
      });
  }

  initCompraForm() {
    this.compraForm = this.fb.group({
      tipo_lente: ['', Validators.required],
      tipo_montura: ['', Validators.required],
      rango_precio: ['', Validators.required],
    });
  }

  async loadClientes() {
    this.isLoading = true;
    try {
      this.clientes = await this.clienteService.getClientes();
      this.clientesParaReferir = [...this.clientes];
      this.search.setItems(this.clientes);
      this.pagination.setItems(this.search.filteredItems);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      alert('Error al cargar los clientes');
    } finally {
      this.isLoading = false;
    }
  }

  searchClientes() {
    this.search.filter();
    this.pagination.setItems(this.search.filteredItems);
  }

  openModal() {
    this.isEditMode = false;
    this.selectedClienteId = null;
    this.clienteForm.reset();
    this.clienteForm.patchValue({
      es_referido: false,
      cliente_referidor_id: null,
    });
    this.esReferido = false;
    this.clienteForm
      .get('primera_compra_tipo_lente')
      ?.setValidators(Validators.required);
    this.clienteForm
      .get('primera_compra_tipo_montura')
      ?.setValidators(Validators.required);
    this.clienteForm
      .get('primera_compra_rango_precio')
      ?.setValidators(Validators.required);
    this.clienteForm.get('primera_compra_tipo_lente')?.updateValueAndValidity();
    this.clienteForm
      .get('primera_compra_tipo_montura')
      ?.updateValueAndValidity();
    this.clienteForm
      .get('primera_compra_rango_precio')
      ?.updateValueAndValidity();

    this.showModal = true;
  }

  openEditModal(cliente: Cliente) {
    this.isEditMode = true;
    this.selectedClienteId = cliente.id || null;
    this.clienteForm.patchValue({
      nombres: cliente.nombres,
      cedula: cliente.cedula,
      fecha_nacimiento: cliente.fecha_nacimiento,
      telefono: cliente.telefono,
      correo: cliente.correo,
      es_referido: cliente.es_referido || false,
      cliente_referidor_id: cliente.cliente_referidor_id || null,
    });
    this.esReferido = cliente.es_referido || false;
    this.clienteForm.get('primera_compra_tipo_lente')?.clearValidators();
    this.clienteForm.get('primera_compra_tipo_montura')?.clearValidators();
    this.clienteForm.get('primera_compra_rango_precio')?.clearValidators();
    this.clienteForm.get('primera_compra_tipo_lente')?.updateValueAndValidity();
    this.clienteForm
      .get('primera_compra_tipo_montura')
      ?.updateValueAndValidity();
    this.clienteForm
      .get('primera_compra_rango_precio')
      ?.updateValueAndValidity();

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.clienteForm.reset();
    this.isEditMode = false;
    this.selectedClienteId = null;
  }

  async onSubmit() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const formValue = this.clienteForm.value;
    this.isLoading = true;
    try {
      const clienteData: Cliente = {
        nombres: formValue.nombres,
        cedula: formValue.cedula,
        fecha_nacimiento: formValue.fecha_nacimiento,
        telefono: formValue.telefono,
        correo: formValue.correo,
        es_referido: formValue.es_referido || false,
        cliente_referidor_id: formValue.cliente_referidor_id || null,
      };

      let nuevoClienteId: string | undefined;

      if (this.isEditMode && this.selectedClienteId) {
        const cedulaExiste = await this.clienteService.verificarCedulaExistente(
          formValue.cedula,
          this.selectedClienteId
        );

        if (cedulaExiste) {
          alert(
            `⚠️ Error: Ya existe otro cliente registrado con la cédula ${formValue.cedula}`
          );
          this.isLoading = false;
          return;
        }

        await this.clienteService.updateCliente(
          this.selectedClienteId,
          clienteData
        );
        alert('Cliente actualizado exitosamente');
      } else {
        const cedulaExiste = await this.clienteService.verificarCedulaExistente(
          formValue.cedula
        );

        if (cedulaExiste) {
          alert(
            `⚠️ Error: Ya existe un cliente registrado con la cédula ${formValue.cedula}.\n\nPor favor, verifica los datos o busca el cliente existente en la tabla.`
          );
          this.isLoading = false;
          return;
        }

        const nuevoCliente = await this.clienteService.createCliente(
          clienteData
        );
        nuevoClienteId = nuevoCliente.id;

        // Registrar la primera compra
        if (nuevoClienteId) {
          try {
            const primeraCompra: ClienteCompra = {
              cliente_id: nuevoClienteId,
              tipo_lente: formValue.primera_compra_tipo_lente,
              tipo_montura: formValue.primera_compra_tipo_montura,
              rango_precio: formValue.primera_compra_rango_precio,
            };
            await this.clienteService.createCompra(primeraCompra);

            this.rangoPrecioCompra = formValue.primera_compra_rango_precio;
          } catch (error) {
            console.error('Error al registrar primera compra:', error);
          }
        }

        this.clienteRegistrado = {
          nombres: formValue.nombres,
          telefono: formValue.telefono,
        };

        // Si es referido, crear el registro de referido y obtener datos del referidor
        if (
          formValue.es_referido &&
          formValue.cliente_referidor_id &&
          nuevoClienteId
        ) {
          try {
            let cashbackGenerado = 0;
            if (this.rangoPrecioCompra) {
              const cashbackInfo = this.whatsAppService.calcularCashback(
                this.rangoPrecioCompra
              );
              cashbackGenerado = cashbackInfo.monto;
            }

            await this.clienteService.createReferido({
              cliente_referidor_id: formValue.cliente_referidor_id,
              cliente_referido_id: nuevoClienteId,
              fecha_referido: new Date().toISOString(),
              estado: 'activo',
              cashback_generado: cashbackGenerado,
              rango_precio_compra: this.rangoPrecioCompra || undefined,
            });

            // Obtener datos del referidor para el mensaje de WhatsApp
            const referidor = this.clientes.find(
              (c) => c.id === formValue.cliente_referidor_id
            );
            if (referidor) {
              this.clienteReferidor = {
                nombres: referidor.nombres,
                telefono: referidor.telefono,
              };

              // Agregar el nuevo cashback al referidor en la BD
              if (cashbackGenerado > 0) {
                this.cashbackAcumuladoReferidor =
                  referidor.cashback_acumulado || 0;

                await this.clienteService.addCashback(
                  formValue.cliente_referidor_id,
                  cashbackGenerado
                );
              }
            }
          } catch (error) {
            console.error('Error al registrar referido:', error);
          }
        } else {
          this.clienteReferidor = null;
        }

        this.prepararMensajesWhatsApp();
      }

      this.closeModal();
      await this.loadClientes();
      if (!this.isEditMode && this.clienteRegistrado)
        this.showWhatsAppModal = true;
    } catch (error: any) {
      console.error('Error guardando cliente:', error);

      if (error.message && error.message.includes('Ya existe un cliente')) {
        alert(`⚠️ ${error.message}`);
      } else if (error.code === '23505') {
        alert(
          `⚠️ Error: La cédula ${formValue.cedula} ya está registrada en el sistema.`
        );
      } else {
        alert(
          `❌ Error al guardar el cliente: ${
            error.message || 'Error desconocido'
          }`
        );
      }
    } finally {
      this.isLoading = false;
    }
  }

  async deleteCliente(cliente: Cliente) {
    if (!confirm(`¿Estás seguro de eliminar a ${cliente.nombres}?`)) {
      return;
    }

    this.isLoading = true;
    try {
      await this.clienteService.deleteCliente(cliente.id!);
      alert('Cliente eliminado exitosamente');
      await this.loadClientes();
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alert('Error al eliminar el cliente');
    } finally {
      this.isLoading = false;
    }
  }

  // ========== COMPRAS ==========
  async openComprasModal(cliente: Cliente) {
    this.selectedCliente = cliente;
    this.showComprasModal = true;
    this.compraForm.reset();
    await this.loadCompras();
  }

  closeComprasModal() {
    this.showComprasModal = false;
    this.selectedCliente = null;
    this.compras = [];
    this.compraForm.reset();
  }

  async loadCompras() {
    if (!this.selectedCliente?.id) return;

    this.isLoadingCompras = true;
    try {
      this.compras = await this.clienteService.getComprasByCliente(
        this.selectedCliente.id
      );
    } catch (error) {
      console.error('Error cargando compras:', error);
      alert('Error al cargar las compras del cliente');
    } finally {
      this.isLoadingCompras = false;
    }
  }

  async registrarCompra() {
    if (this.compraForm.invalid || !this.selectedCliente?.id) {
      this.compraForm.markAllAsTouched();
      return;
    }

    this.isLoadingCompras = true;
    try {
      const compraData: ClienteCompra = {
        cliente_id: this.selectedCliente.id,
        tipo_lente: this.compraForm.value.tipo_lente,
        tipo_montura: this.compraForm.value.tipo_montura,
        rango_precio: this.compraForm.value.rango_precio,
      };

      await this.clienteService.createCompra(compraData);
      alert('Compra registrada exitosamente');
      this.compraForm.reset();
      await this.loadCompras();
    } catch (error: any) {
      console.error('Error registrando compra:', error);
      alert(error.message || 'Error al registrar la compra');
    } finally {
      this.isLoadingCompras = false;
    }
  }

  async deleteCompra(compra: ClienteCompra) {
    if (!confirm('¿Estás seguro de eliminar esta compra?')) {
      return;
    }

    this.isLoadingCompras = true;
    try {
      await this.clienteService.deleteCompra(compra.id!);
      alert('Compra eliminada exitosamente');
      await this.loadCompras();
    } catch (error) {
      console.error('Error eliminando compra:', error);
      alert('Error al eliminar la compra');
    } finally {
      this.isLoadingCompras = false;
    }
  }

  // ========== REFERIDOS ==========
  async openReferidosModal(cliente: Cliente) {
    this.selectedCliente = cliente;
    this.showReferidosModal = true;
    await this.loadReferidos();
  }

  closeReferidosModal() {
    this.showReferidosModal = false;
    this.selectedCliente = null;
    this.referidos = [];
  }

  async loadReferidos() {
    if (!this.selectedCliente?.id) return;

    this.isLoadingReferidos = true;
    try {
      this.referidos = await this.clienteService.getReferidosByCliente(
        this.selectedCliente.id
      );
    } catch (error) {
      console.error('Error cargando referidos:', error);
      alert('Error al cargar los referidos del cliente');
    } finally {
      this.isLoadingReferidos = false;
    }
  }

  calcularCashbackDisponible(): number {
    return this.referidos
      .filter((r) => r.estado === 'activo')
      .reduce((sum, r) => sum + (r.cashback_generado || 0), 0);
  }

  calcularCashbackRedimido(): number {
    return this.referidos
      .filter((r) => r.estado === 'redimido')
      .reduce((sum, r) => sum + (r.cashback_generado || 0), 0);
  }

  calcularReferidosRedimidos(): number {
    return this.referidos.filter((r) => r.estado === 'redimido').length;
  }

  calcularReferidosActivos(): number {
    return this.referidos.filter((r) => r.estado === 'activo').length;
  }

  async redimirTodosReferidos(): Promise<void> {
    if (!this.selectedCliente?.id) return;

    const cashbackDisponible = this.calcularCashbackDisponible();
    const referidosActivos = this.calcularReferidosActivos();

    if (referidosActivos === 0 || cashbackDisponible === 0) {
      alert('No hay cashback disponible para redimir.');
      return;
    }

    const confirmacion = confirm(
      `¿Confirmas redimir $${cashbackDisponible.toLocaleString(
        'es-CO'
      )} de ${referidosActivos} referido(s) activo(s)?\n\nSe marcará como redimido a todos los referidos activos.`
    );

    if (!confirmacion) return;

    this.isLoading = true;
    try {
      // Actualizar estado de todos los referidos activos a redimido
      const fechaRedencion = new Date().toISOString();
      await this.clienteService.redimirReferidosActivos(
        this.selectedCliente.id,
        fechaRedencion
      );

      // Reiniciar cashback del cliente
      await this.clienteService.resetCashback(this.selectedCliente.id);

      // Actualizar localmente
      this.referidos.forEach((r) => {
        if (r.estado === 'activo') {
          r.estado = 'redimido';
          r.fecha_redimido = fechaRedencion;
        }
      });

      if (this.selectedCliente) {
        this.selectedCliente.cashback_acumulado = 0;
      }

      // Actualizar en lista principal
      const clienteEnLista = this.clientes.find(
        (c) => c.id === this.selectedCliente?.id
      );
      if (clienteEnLista) {
        clienteEnLista.cashback_acumulado = 0;
      }

      alert(
        `✅ Cashback de $${cashbackDisponible.toLocaleString(
          'es-CO'
        )} redimido exitosamente.`
      );
    } catch (error) {
      console.error('Error al redimir referidos:', error);
      alert('❌ Error al redimir el cashback. Intenta de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  // ========== GETTERS ==========
  get nombres() {
    return this.clienteForm.get('nombres');
  }
  get cedula() {
    return this.clienteForm.get('cedula');
  }
  get fecha_nacimiento() {
    return this.clienteForm.get('fecha_nacimiento');
  }
  get telefono() {
    return this.clienteForm.get('telefono');
  }
  get correo() {
    return this.clienteForm.get('correo');
  }
  get es_referido() {
    return this.clienteForm.get('es_referido');
  }
  get cliente_referidor_id() {
    return this.clienteForm.get('cliente_referidor_id');
  }

  // Getters para compraForm
  get tipo_lente() {
    return this.compraForm.get('tipo_lente');
  }
  get tipo_montura() {
    return this.compraForm.get('tipo_montura');
  }
  get rango_precio() {
    return this.compraForm.get('rango_precio');
  }

  // ========== WHATSAPP ==========

  /**
   * Prepara los mensajes de WhatsApp después de registrar un cliente
   */
  prepararMensajesWhatsApp(): void {
    if (!this.clienteRegistrado) return;

    const mensajes = this.whatsAppService.obtenerDatosMensajes(
      this.clienteRegistrado,
      this.clienteReferidor,
      this.rangoPrecioCompra || undefined,
      this.cashbackAcumuladoReferidor
    );

    this.whatsAppBienvenida = mensajes.bienvenida;
    this.whatsAppReferido = mensajes.referido || null;
  }

  /**
   * Abre WhatsApp con el mensaje de bienvenida
   */
  enviarWhatsAppBienvenida(): void {
    if (this.whatsAppBienvenida) {
      const url = this.whatsAppService.generarUrlWhatsApp(
        this.whatsAppBienvenida.telefono,
        this.whatsAppBienvenida.mensaje
      );
      window.open(url, '_blank');
    }
  }

  /**
   * Abre WhatsApp con el mensaje de referido
   */
  enviarWhatsAppReferido(): void {
    if (this.whatsAppReferido) {
      const url = this.whatsAppService.generarUrlWhatsApp(
        this.whatsAppReferido.telefono,
        this.whatsAppReferido.mensaje
      );
      window.open(url, '_blank');
    }
  }

  /**
   * Cierra el modal de WhatsApp
   */
  closeWhatsAppModal(): void {
    this.showWhatsAppModal = false;
    this.whatsAppBienvenida = null;
    this.whatsAppReferido = null;
    this.clienteRegistrado = null;
    this.clienteReferidor = null;
    this.rangoPrecioCompra = '';
  }

  /**
   * Abre el modal de WhatsApp para un cliente existente
   * Permite reenviar mensajes de bienvenida o notificaciones
   */
  async openWhatsAppModalForCliente(cliente: Cliente): Promise<void> {
    this.clienteRegistrado = {
      nombres: cliente.nombres,
      telefono: cliente.telefono,
    };

    // Generar mensaje de bienvenida/notificación genérico
    this.whatsAppBienvenida = {
      telefono: cliente.telefono,
      mensaje: this.whatsAppService.generarMensajeBienvenida(cliente.nombres),
    };

    // Si el cliente tiene referidor, preparar mensaje para el referidor
    if (cliente.es_referido && cliente.cliente_referidor_id) {
      const referidor = this.clientes.find(
        (c) => c.id === cliente.cliente_referidor_id
      );
      if (referidor) {
        this.clienteReferidor = {
          nombres: referidor.nombres,
          telefono: referidor.telefono,
        };

        // Obtener la última compra del cliente para calcular cashback
        const ultimaCompra = await this.clienteService.getUltimaCompraCliente(
          cliente.id!
        );
        if (ultimaCompra) {
          this.rangoPrecioCompra = ultimaCompra.rango_precio;
          this.whatsAppReferido = {
            telefono: referidor.telefono,
            mensaje: this.whatsAppService.generarMensajeReferido(
              referidor.nombres,
              cliente.nombres,
              ultimaCompra.rango_precio,
              referidor.cashback_acumulado || 0
            ),
          };
        }
      }
    } else {
      this.clienteReferidor = null;
      this.whatsAppReferido = null;
    }

    this.showWhatsAppModal = true;
  }

  /**
   * Reinicia el cashback del cliente seleccionado
   */
  async resetCashback(): Promise<void> {
    if (!this.selectedCliente?.id) return;

    const cashbackActual = this.selectedCliente.cashback_acumulado || 0;
    if (cashbackActual === 0) {
      alert('Este cliente no tiene cashback acumulado');
      return;
    }

    const confirmacion = confirm(
      `¿Confirmas que ${
        this.selectedCliente.nombres
      } ha redimido su cashback de $${cashbackActual.toLocaleString(
        'es-CO'
      )}?\n\nEsto reiniciará el contador a $0.`
    );

    if (!confirmacion) return;

    this.isLoading = true;
    try {
      await this.clienteService.resetCashback(this.selectedCliente.id);

      // Actualizar el cliente localmente
      this.selectedCliente.cashback_acumulado = 0;

      // Actualizar en la lista de clientes
      const clienteEnLista = this.clientes.find(
        (c) => c.id === this.selectedCliente?.id
      );
      if (clienteEnLista) {
        clienteEnLista.cashback_acumulado = 0;
      }

      alert(
        `✅ Cashback de $${cashbackActual.toLocaleString(
          'es-CO'
        )} redimido exitosamente.`
      );
    } catch (error) {
      console.error('Error al reiniciar cashback:', error);
      alert('❌ Error al reiniciar el cashback. Intenta de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  // ========== CONFIGURACIÓN WHATSAPP ==========

  openConfigModal(): void {
    this.whatsAppConfig = this.whatsAppService.getConfig();
    this.showConfigModal = true;
  }

  closeConfigModal(): void {
    this.showConfigModal = false;
  }

  saveWhatsAppConfig(): void {
    this.whatsAppService.saveConfig(this.whatsAppConfig);
    alert('✅ Configuración guardada exitosamente');
    this.closeConfigModal();
  }

  resetWhatsAppConfig(): void {
    if (
      confirm(
        '¿Estás seguro de restaurar los mensajes por defecto?\n\nEsto sobrescribirá tu configuración actual.'
      )
    ) {
      this.whatsAppService.resetConfig();
      this.whatsAppConfig = this.whatsAppService.getConfig();
      alert('✅ Configuración restaurada a valores por defecto');
    }
  }

  getVariablesInfo(tipo: 'bienvenida' | 'referido'): string {
    if (tipo === 'bienvenida') {
      return '{NOMBRE} = Primer nombre del cliente\n{NEGOCIO} = Nombre del negocio';
    }
    return '{NOMBRE_REFERIDOR} = Quien refirió\n{NOMBRE_REFERIDO} = Nuevo cliente\n{NEGOCIO} = Nombre del negocio\n{CASHBACK_COMPRA} = Cashback de esta compra\n{RANGO_COMPRA} = Rango de precio\n{CASHBACK_TOTAL} = Total acumulado';
  }
}
