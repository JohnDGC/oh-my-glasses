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
  SECCIONES,
  METODOS_PAGO,
  TIPOS_COMPRA,
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
  isEditCompraMode = false;
  selectedCompraId: string | null = null;
  selectedClienteId: string | null = null;
  selectedCliente: Cliente | null = null;
  esReferido = false;
  tiposLente = TIPOS_LENTE;
  tiposMontura = TIPOS_MONTURA;
  rangosPrecio = RANGOS_PRECIO;
  secciones = SECCIONES;
  metodosPago = METODOS_PAGO;
  tiposCompra = TIPOS_COMPRA;
  Math = Math;
  formatDate = FormatUtils.formatDate;
  showWhatsAppModal = false;
  whatsAppBienvenida: MensajeWhatsApp | null = null;
  whatsAppReferido: MensajeWhatsApp | null = null;
  clienteRegistrado: { nombres: string; telefono: string } | null = null;
  clienteReferidor: { nombres: string; telefono: string } | null = null;
  clienteReferidorId: string | null = null;
  rangoPrecioCompra: string = '';
  cashbackAcumuladoReferidor: number = 0;
  referidorYaRedimio: boolean = false;
  esNuevoRegistroConCashback: boolean = false;
  showConfigModal = false;
  whatsAppConfig: WhatsAppConfig = {
    nombreNegocio: '',
    mensajeBienvenida: '',
    mensajeReferido: '',
  };
  showInfoModal = false;
  infoCompras: ClienteCompra[] = [];
  isLoadingInfoCompras = false;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private whatsAppService: WhatsAppService,
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
      correo: ['', [Validators.email]],
      es_referido: [false],
      cliente_referidor_id: [null],
      primera_compra_tipo_compra: ['Gafas formuladas'],
      primera_compra_tipo_lente: [null],
      primera_compra_tipo_montura: [null],
      primera_compra_rango_precio: [null],
      primera_compra_precio_total: [
        null,
        [Validators.required, Validators.min(0)],
      ],
      primera_compra_abono: [null, [Validators.required, Validators.min(0)]],
      primera_compra_seccion: [null, Validators.required],
      primera_compra_metodo_pago: [null, Validators.required],
      primera_compra_nota_pago: [''],
    });

    // Auto-selección de sección y validación dinámica para Primera Compra
    this.clienteForm
      .get('primera_compra_tipo_montura')
      ?.valueChanges.subscribe(() => this.verificarAutoSeleccionSeccion(true));
    this.clienteForm
      .get('primera_compra_tipo_compra')
      ?.valueChanges.subscribe((tipo) => {
        this.verificarAutoSeleccionSeccion(true);
        this.actualizarValidadores(true, tipo);
      });
    this.clienteForm
      .get('primera_compra_metodo_pago')
      ?.valueChanges.subscribe((metodo) => {
        this.actualizarValidadores(
          true,
          this.clienteForm.get('primera_compra_tipo_compra')?.value,
        );
      });

    this.clienteForm
      .get('cedula')
      ?.valueChanges.pipe(
        debounceTime(500), // Esperar 500ms después de que el usuario deje de escribir
        distinctUntilChanged(),
      )
      .subscribe(async (cedula) => {
        const cedulaControl = this.clienteForm.get('cedula');

        if (cedula && cedula.length >= 6 && cedulaControl?.valid) {
          const existe = await this.clienteService.verificarCedulaExistente(
            cedula,
            this.selectedClienteId || undefined,
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
                Object.keys(otherErrors).length > 0 ? otherErrors : null,
              );
            }
          }
        }
      });
  }

  initCompraForm() {
    this.compraForm = this.fb.group({
      tipo_compra: ['Gafas formuladas', Validators.required],
      tipo_lente: [null],
      tipo_montura: [null],
      rango_precio: [null],
      precio_total: [null, [Validators.required, Validators.min(0)]],
      abono: [null, [Validators.required, Validators.min(0)]],
      seccion: [null, Validators.required],
      metodo_pago: [null, Validators.required],
      nota_pago: [''],
    });

    // Auto-selección de sección y validación dinámica para Compras regulares
    this.compraForm
      .get('tipo_montura')
      ?.valueChanges.subscribe(() => this.verificarAutoSeleccionSeccion(false));
    this.compraForm.get('tipo_compra')?.valueChanges.subscribe((tipo) => {
      this.verificarAutoSeleccionSeccion(false);
      this.actualizarValidadores(false, tipo);
    });
    this.compraForm.get('metodo_pago')?.valueChanges.subscribe((metodo) => {
      this.actualizarValidadores(
        false,
        this.compraForm.get('tipo_compra')?.value,
      );
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
    this.clienteForm.reset({
      es_referido: false,
      cliente_referidor_id: null,
      primera_compra_tipo_compra: 'Gafas formuladas',
    });
    this.esReferido = false;

    // Los campos de primera compra ya no son requeridos en el form
    // ahora usamos el array primerasComprasTemporales
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

    this.primerasComprasTemporales = [];
    this.isEditingPrimeraCompra = false;
    this.selectedPrimeraCompraIndex = null;

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
    this.primerasComprasTemporales = [];
    this.isEditingPrimeraCompra = false;
    this.selectedPrimeraCompraIndex = null;
  }

  async onSubmit() {
    const hasTempPurchases = this.primerasComprasTemporales.length > 0;
    const clientControls = [
      'nombres',
      'cedula',
      'fecha_nacimiento',
      'telefono',
      'correo',
    ];

    let isClientValid = true;

    // Check validity of client fields
    clientControls.forEach((controlName) => {
      const control = this.clienteForm.get(controlName);
      if (control?.invalid) {
        isClientValid = false;
      }
    });

    if (hasTempPurchases) {
      // If we have purchases in the list, only client fields need to be valid
      if (!isClientValid) {
        clientControls.forEach((controlName) => {
          this.clienteForm.get(controlName)?.markAsTouched();
        });
        return;
      }
    } else {
      // If no purchases in list, standard validation applies (though this might still be problematic if users expect auto-add)
      if (this.clienteForm.invalid) {
        this.clienteForm.markAllAsTouched();
        return;
      }
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
          this.selectedClienteId,
        );

        if (cedulaExiste) {
          alert(
            `⚠️ Error: Ya existe otro cliente registrado con la cédula ${formValue.cedula}`,
          );
          this.isLoading = false;
          return;
        }

        // Detectar cambios en el referidor
        const clienteOriginal = this.clientes.find(
          (c) => c.id === this.selectedClienteId,
        );

        const referidorAnterior = clienteOriginal?.cliente_referidor_id || null;
        const referidorNuevo =
          formValue.es_referido && formValue.cliente_referidor_id
            ? formValue.cliente_referidor_id
            : null;

        const referidorCambio = referidorAnterior !== referidorNuevo;

        await this.clienteService.updateCliente(
          this.selectedClienteId,
          clienteData,
        );

        let mensaje = 'Cliente actualizado exitosamente';

        // Si hubo cambio en el referidor, ajustar registros y cashback
        if (referidorCambio) {
          try {
            await this.clienteService.cambiarReferidor(
              this.selectedClienteId,
              referidorAnterior,
              referidorNuevo,
            );

            if (referidorNuevo && !referidorAnterior) {
              mensaje +=
                '.\n\n✅ Se ha vinculado el referido y generado el cashback retroactivo.';
            } else if (!referidorNuevo && referidorAnterior) {
              mensaje +=
                '.\n\n✅ Se ha removido el referido y revertido el cashback.';
            } else if (referidorNuevo && referidorAnterior) {
              mensaje +=
                '.\n\n✅ Se ha cambiado el referidor y ajustado el cashback correspondiente.';
            }
          } catch (error) {
            console.error('Error gestionando cambio de referidor:', error);
            mensaje +=
              '.\n\n⚠️ No se pudo completar el ajuste del referido (verifica si tiene compras registradas).';
          }
        }

        alert(mensaje);
      } else {
        const cedulaExiste = await this.clienteService.verificarCedulaExistente(
          formValue.cedula,
        );

        if (cedulaExiste) {
          alert(
            `⚠️ Error: Ya existe un cliente registrado con la cédula ${formValue.cedula}.\n\nPor favor, verifica los datos o busca el cliente existente en la tabla.`,
          );
          this.isLoading = false;
          return;
        }

        const nuevoCliente =
          await this.clienteService.createCliente(clienteData);
        nuevoClienteId = nuevoCliente.id;

        // Registrar las primeras compras
        if (nuevoClienteId && this.primerasComprasTemporales.length > 0) {
          try {
            for (const compra of this.primerasComprasTemporales) {
              const primeraCompra: ClienteCompra = {
                cliente_id: nuevoClienteId,
                ...compra,
              };
              await this.clienteService.createCompra(primeraCompra);
            }

            // Guardar el rango de precio de la primera compra para referencia
            this.rangoPrecioCompra =
              this.primerasComprasTemporales[0].rango_precio;
          } catch (error: any) {
            console.error('Error al registrar primeras compras:', error);
            if (error.code === '23514') {
              alert(
                '⚠️ Error: El rango de precio no es válido. Por favor ejecuta el script SQL "update-rango-precio-constraint.sql" en Supabase.',
              );
            }
            this.rangoPrecioCompra =
              this.primerasComprasTemporales[0]?.rango_precio || '';
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

            // Calcular cashback por las compras del referido (SOLO Gafas formuladas)
            if (this.primerasComprasTemporales.length > 0) {
              for (const compra of this.primerasComprasTemporales) {
                if (
                  (!compra.tipo_compra ||
                    compra.tipo_compra === 'Gafas formuladas') &&
                  compra.rango_precio
                ) {
                  const cashbackInfo = this.whatsAppService.calcularCashback(
                    compra.rango_precio,
                  );
                  cashbackGenerado += cashbackInfo.monto;
                }
              }
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
              (c) => c.id === formValue.cliente_referidor_id,
            );
            if (referidor) {
              this.clienteReferidor = {
                nombres: referidor.nombres,
                telefono: referidor.telefono,
              };
              this.clienteReferidorId = referidor.id || null;

              // Agregar el nuevo cashback al referidor en la BD
              if (cashbackGenerado > 0) {
                this.cashbackAcumuladoReferidor =
                  referidor.cashback_acumulado || 0;

                await this.clienteService.addCashback(
                  formValue.cliente_referidor_id,
                  cashbackGenerado,
                );

                // Marcar que es un nuevo registro con cashback sumado
                // Esto permite enviar el mensaje aunque el referidor tenía cashback = 0 antes
                this.esNuevoRegistroConCashback = true;
                this.referidorYaRedimio = false;
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
          `⚠️ Error: La cédula ${formValue.cedula} ya está registrada en el sistema.`,
        );
      } else {
        alert(
          `❌ Error al guardar el cliente: ${
            error.message || 'Error desconocido'
          }`,
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
    this.compraForm.reset({
      tipo_compra: 'Gafas formuladas',
    });
    await this.loadCompras();
  }

  closeComprasModal() {
    this.showComprasModal = false;
    this.selectedCliente = null;
    this.compras = [];
    this.compraForm.reset({
      tipo_compra: 'Gafas formuladas',
    });
    this.isEditCompraMode = false;
    this.selectedCompraId = null;
    this.comprasTemporales = [];
    this.isEditingTempCompra = false;
    this.selectedTempCompraIndex = null;
  }

  async loadCompras() {
    if (!this.selectedCliente?.id) return;

    this.isLoadingCompras = true;
    try {
      this.compras = await this.clienteService.getComprasByCliente(
        this.selectedCliente.id,
      );
    } catch (error) {
      console.error('Error cargando compras:', error);
      alert('Error al cargar las compras del cliente');
    } finally {
      this.isLoadingCompras = false;
    }
  }

  // Agregar compra al arreglo temporal
  agregarCompraALista() {
    if (!this.selectedCliente?.id) return;

    const formValue = this.compraForm.value;
    const tipoCompra = formValue.tipo_compra;
    let isValid = false;

    if (tipoCompra === 'Gafas formuladas') {
      if (
        formValue.tipo_lente &&
        formValue.tipo_montura &&
        formValue.rango_precio &&
        formValue.seccion &&
        (formValue.metodo_pago !== 'Acuerdo interno' || formValue.nota_pago)
      ) {
        isValid = true;
      } else {
        this.compraForm.get('tipo_lente')?.markAsTouched();
        this.compraForm.get('tipo_montura')?.markAsTouched();
        this.compraForm.get('rango_precio')?.markAsTouched();
        this.compraForm.get('seccion')?.markAsTouched();
        if (formValue.metodo_pago === 'Acuerdo interno') {
          this.compraForm.get('nota_pago')?.markAsTouched();
        }
      }
    } else if (tipoCompra === 'Gafas de sol') {
      if (
        formValue.tipo_montura &&
        formValue.seccion &&
        (formValue.metodo_pago !== 'Acuerdo interno' || formValue.nota_pago)
      ) {
        isValid = true;
      } else {
        this.compraForm.get('tipo_montura')?.markAsTouched();
        this.compraForm.get('seccion')?.markAsTouched();
        if (formValue.metodo_pago === 'Acuerdo interno') {
          this.compraForm.get('nota_pago')?.markAsTouched();
        }
      }
    } else if (tipoCompra === 'Consulta optometria') {
      if (formValue.metodo_pago !== 'Acuerdo interno' || formValue.nota_pago) {
        isValid = true;
      } else {
        if (formValue.metodo_pago === 'Acuerdo interno') {
          this.compraForm.get('nota_pago')?.markAsTouched();
        }
      }
    }

    if (!isValid) return;

    const esOptometria = tipoCompra === 'Consulta optometria';
    const compraData: ClienteCompra = {
      cliente_id: this.selectedCliente.id,
      tipo_compra: tipoCompra,
      metodo_pago: formValue.metodo_pago || null,
      tipo_lente: esOptometria ? null : formValue.tipo_lente || null,
      tipo_montura: esOptometria ? null : formValue.tipo_montura || null,
      rango_precio: esOptometria ? null : formValue.rango_precio || null,
      precio_total: formValue.precio_total || null,
      abono: formValue.abono || null,
      seccion: esOptometria ? null : formValue.seccion || null,
      nota_pago: formValue.nota_pago || null,
    };

    if (this.isEditingTempCompra && this.selectedTempCompraIndex !== null) {
      // Actualizar compra temporal existente
      this.comprasTemporales[this.selectedTempCompraIndex] = compraData;
      this.isEditingTempCompra = false;
      this.selectedTempCompraIndex = null;
    } else {
      // Agregar nueva compra temporal
      this.comprasTemporales.push(compraData);
    }

    this.compraForm.reset({
      tipo_compra: 'Gafas formuladas',
      nota_pago: '',
    });
    // Ensure form is pristine and untouched to avoid red fields
    this.compraForm.markAsPristine();
    this.compraForm.markAsUntouched();

    // Clear validators for conditional fields that might have been set
    const prefix = '';
    const controlsToClear = [
      'tipo_lente',
      'tipo_montura',
      'rango_precio',
      'seccion',
      'nota_pago',
    ];
    controlsToClear.forEach((name) => {
      const control = this.compraForm.get(name);
      if (control) {
        control.clearValidators();
        control.updateValueAndValidity();
      }
    });

    // Re-apply default validators for 'Gafas formuladas' (default type)
    this.actualizarValidadores(false, 'Gafas formuladas');
  }

  // Editar una compra temporal
  editarCompraTemporal(index: number) {
    const compra = this.comprasTemporales[index];
    this.isEditingTempCompra = true;
    this.selectedTempCompraIndex = index;
    this.compraForm.patchValue({
      tipo_compra: compra.tipo_compra || 'Gafas formuladas',
      tipo_lente: compra.tipo_lente,
      tipo_montura: compra.tipo_montura,
      rango_precio: compra.rango_precio,
      precio_total: compra.precio_total || null,
      abono: compra.abono || null,
      seccion: compra.seccion || null,
      metodo_pago: compra.metodo_pago || null,
      nota_pago: compra.nota_pago || '',
    });
  }

  // Eliminar una compra temporal
  eliminarCompraTemporal(index: number) {
    this.comprasTemporales.splice(index, 1);
    if (this.selectedTempCompraIndex === index) {
      this.cancelarEdicionTemporal();
    }
  }

  // Cancelar edición de compra temporal
  cancelarEdicionTemporal() {
    this.isEditingTempCompra = false;
    this.selectedTempCompraIndex = null;
    this.compraForm.reset({
      nota_pago: '',
    });
  }

  // ========== MÉTODOS PARA PRIMERAS COMPRAS (Nuevo Cliente) ==========

  // Agregar primera compra al arreglo temporal
  agregarPrimeraCompraALista() {
    const formValue = this.clienteForm.value;
    const tipoCompra =
      formValue.primera_compra_tipo_compra || 'Gafas formuladas';
    let isValid = false;

    if (tipoCompra === 'Gafas formuladas') {
      if (
        formValue.primera_compra_tipo_lente &&
        formValue.primera_compra_tipo_montura &&
        formValue.primera_compra_rango_precio &&
        formValue.primera_compra_seccion &&
        (formValue.primera_compra_metodo_pago !== 'Acuerdo interno' ||
          formValue.primera_compra_nota_pago)
      ) {
        isValid = true;
      } else {
        this.clienteForm.get('primera_compra_tipo_lente')?.markAsTouched();
        this.clienteForm.get('primera_compra_tipo_montura')?.markAsTouched();
        this.clienteForm.get('primera_compra_rango_precio')?.markAsTouched();
        this.clienteForm.get('primera_compra_seccion')?.markAsTouched();
        if (formValue.primera_compra_metodo_pago === 'Acuerdo interno') {
          this.clienteForm.get('primera_compra_nota_pago')?.markAsTouched();
        }
      }
    } else if (tipoCompra === 'Gafas de sol') {
      if (
        formValue.primera_compra_tipo_montura &&
        formValue.primera_compra_seccion &&
        (formValue.primera_compra_metodo_pago !== 'Acuerdo interno' ||
          formValue.primera_compra_nota_pago)
      ) {
        isValid = true;
      } else {
        this.clienteForm.get('primera_compra_tipo_montura')?.markAsTouched();
        this.clienteForm.get('primera_compra_seccion')?.markAsTouched();
        if (formValue.primera_compra_metodo_pago === 'Acuerdo interno') {
          this.clienteForm.get('primera_compra_nota_pago')?.markAsTouched();
        }
      }
    } else if (tipoCompra === 'Consulta optometria') {
      if (
        formValue.primera_compra_metodo_pago !== 'Acuerdo interno' ||
        formValue.primera_compra_nota_pago
      ) {
        isValid = true;
      } else {
        if (formValue.primera_compra_metodo_pago === 'Acuerdo interno') {
          this.clienteForm.get('primera_compra_nota_pago')?.markAsTouched();
        }
      }
    }

    if (!isValid) return;

    const esOptometria = tipoCompra === 'Consulta optometria';
    const compraData: Omit<ClienteCompra, 'cliente_id'> = {
      tipo_compra: tipoCompra,
      metodo_pago: formValue.primera_compra_metodo_pago || null,
      tipo_lente: esOptometria
        ? null
        : formValue.primera_compra_tipo_lente || null,
      tipo_montura: esOptometria
        ? null
        : formValue.primera_compra_tipo_montura || null,
      rango_precio: esOptometria
        ? null
        : formValue.primera_compra_rango_precio || null,
      precio_total: formValue.primera_compra_precio_total || null,
      abono: formValue.primera_compra_abono || null,
      seccion: esOptometria ? null : formValue.primera_compra_seccion || null,
      nota_pago: formValue.primera_compra_nota_pago || null,
    };

    if (
      this.isEditingPrimeraCompra &&
      this.selectedPrimeraCompraIndex !== null
    ) {
      // Actualizar compra temporal existente
      this.primerasComprasTemporales[this.selectedPrimeraCompraIndex] =
        compraData;
      this.isEditingPrimeraCompra = false;
      this.selectedPrimeraCompraIndex = null;
    } else {
      // Agregar nueva compra temporal
      this.primerasComprasTemporales.push(compraData);
    }

    // Limpiar campos
    this.clienteForm.patchValue({
      primera_compra_tipo_compra: 'Gafas formuladas', // Reset to default
      primera_compra_tipo_lente: null,
      primera_compra_tipo_montura: null,
      primera_compra_rango_precio: null,
      primera_compra_precio_total: null,
      primera_compra_abono: null,
      primera_compra_seccion: null,
      primera_compra_metodo_pago: null,
      primera_compra_nota_pago: '',
    });

    // Ensure form is pristine and untouched
    this.clienteForm.markAsPristine();
    this.clienteForm.markAsUntouched();

    // Clear validators for conditional first purchase fields
    const prefix = 'primera_compra_';
    const firstPurchaseControls = [
      'tipo_lente',
      'tipo_montura',
      'rango_precio',
      'seccion',
      'nota_pago',
      'metodo_pago',
      'precio_total',
      'abono',
    ];
    firstPurchaseControls.forEach((name) => {
      const control = this.clienteForm.get(prefix + name);
      if (control) {
        // We only clear validators for the purchase fields, NOT the client fields
        if (
          name !== 'metodo_pago' &&
          name !== 'precio_total' &&
          name !== 'abono'
        ) {
          control.clearValidators();
        }
        control.markAsPristine();
        control.markAsUntouched();
        control.updateValueAndValidity();
      }
    });

    // Re-apply default validators
    this.actualizarValidadores(true, 'Gafas formuladas');
  }

  // Editar una primera compra temporal
  editarPrimeraCompraTemporal(index: number) {
    const compra = this.primerasComprasTemporales[index];
    this.isEditingPrimeraCompra = true;
    this.selectedPrimeraCompraIndex = index;
    this.clienteForm.patchValue({
      primera_compra_tipo_compra: compra.tipo_compra || 'Gafas formuladas',
      primera_compra_tipo_lente: compra.tipo_lente,
      primera_compra_tipo_montura: compra.tipo_montura,
      primera_compra_rango_precio: compra.rango_precio,
      primera_compra_precio_total: compra.precio_total || null,
      primera_compra_abono: compra.abono || null,
      primera_compra_seccion: compra.seccion || null,
      primera_compra_metodo_pago: compra.metodo_pago || null,
      primera_compra_nota_pago: compra.nota_pago || '',
    });
  }

  // Eliminar una primera compra temporal
  eliminarPrimeraCompraTemporal(index: number) {
    this.primerasComprasTemporales.splice(index, 1);
    if (this.selectedPrimeraCompraIndex === index) {
      this.cancelarEdicionPrimeraCompra();
    }
  }

  // Cancelar edición de primera compra
  cancelarEdicionPrimeraCompra() {
    this.isEditingPrimeraCompra = false;
    this.selectedPrimeraCompraIndex = null;
    this.clienteForm.patchValue({
      primera_compra_tipo_lente: null,
      primera_compra_tipo_montura: null,
      primera_compra_rango_precio: null,
      primera_compra_precio_total: null,
      primera_compra_abono: null,
      primera_compra_seccion: null,
      primera_compra_nota_pago: '',
    });
  }

  // Guardar todas las compras temporales
  async guardarTodasLasCompras() {
    if (this.comprasTemporales.length === 0) {
      alert('No hay compras para guardar');
      return;
    }

    if (!this.selectedCliente?.id) {
      alert('Error: No hay cliente seleccionado');
      return;
    }

    const confirmacion = confirm(
      `¿Confirmas guardar ${this.comprasTemporales.length} compra(s)?`,
    );

    if (!confirmacion) return;

    this.isLoadingCompras = true;
    try {
      // Guardar todas las compras
      for (const compra of this.comprasTemporales) {
        await this.clienteService.createCompra(compra);
      }

      alert(
        `✅ ${this.comprasTemporales.length} compra(s) registrada(s) exitosamente`,
      );
      this.comprasTemporales = [];
      this.compraForm.reset();
      await this.loadCompras();
    } catch (error: any) {
      console.error('Error registrando compras:', error);
      alert(error.message || 'Error al registrar las compras');
    } finally {
      this.isLoadingCompras = false;
    }
  }

  // Método original para compras existentes (edición individual)
  async registrarCompra() {
    if (this.compraForm.invalid || !this.selectedCliente?.id) {
      this.compraForm.markAllAsTouched();
      return;
    }

    this.isLoadingCompras = true;
    try {
      const esOptometria =
        this.compraForm.value.tipo_compra === 'Consulta optometria';
      const compraData: ClienteCompra = {
        cliente_id: this.selectedCliente.id,
        tipo_compra: this.compraForm.value.tipo_compra,
        metodo_pago: this.compraForm.value.metodo_pago || null,
        tipo_lente: esOptometria
          ? null
          : this.compraForm.value.tipo_lente || null,
        tipo_montura: esOptometria
          ? null
          : this.compraForm.value.tipo_montura || null,
        rango_precio: esOptometria
          ? null
          : this.compraForm.value.rango_precio || null,
        precio_total: this.compraForm.value.precio_total || null,
        abono: this.compraForm.value.abono || null,
        seccion: esOptometria ? null : this.compraForm.value.seccion || null,
        nota_pago: this.compraForm.value.nota_pago || null,
      };

      if (this.isEditCompraMode && this.selectedCompraId) {
        // No permitir editar abono desde esta ruta; mantener lo existente
        const { abono, ...compraSinAbono } = compraData as any;
        await this.clienteService.updateCompra(
          this.selectedCompraId,
          compraSinAbono,
        );
        alert('Compra actualizada exitosamente');
      } else {
        await this.clienteService.createCompra(compraData);
        alert('Compra registrada exitosamente');
      }

      this.cancelEditCompra();
      await this.loadCompras();
    } catch (error: any) {
      console.error('Error registrando compra:', error);
      alert(error.message || 'Error al registrar la compra');
    } finally {
      this.isLoadingCompras = false;
    }
  }

  editCompra(compra: ClienteCompra) {
    this.isEditCompraMode = true;
    this.selectedCompraId = compra.id || null;
    this.compraForm.patchValue({
      tipo_compra: compra.tipo_compra || 'Gafas formuladas',
      tipo_lente: compra.tipo_lente,
      tipo_montura: compra.tipo_montura,
      rango_precio: compra.rango_precio,
      precio_total: compra.precio_total || null,
      abono: compra.abono || null,
      seccion: compra.seccion || null,
      metodo_pago: compra.metodo_pago || null,
      nota_pago: compra.nota_pago || '',
    });
  }

  cancelEditCompra() {
    this.isEditCompraMode = false;
    this.selectedCompraId = null;
    this.compraForm.reset();
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

  getNombreReferidor(clienteReferidorId: string | null | undefined): string {
    if (!clienteReferidorId) return '';
    const referidor = this.clientes.find((c) => c.id === clienteReferidorId);
    return referidor?.nombres || 'Cliente no encontrado';
  }

  getCedulaReferidor(clienteReferidorId: string | null | undefined): string {
    if (!clienteReferidorId) return '';
    const referidor = this.clientes.find((c) => c.id === clienteReferidorId);
    return referidor?.cedula || 'N/A';
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
        this.selectedCliente.id,
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
        'es-CO',
      )} de ${referidosActivos} referido(s) activo(s)?\n\nSe marcará como redimido a todos los referidos activos.`,
    );

    if (!confirmacion) return;

    this.isLoading = true;
    try {
      // Actualizar estado de todos los referidos activos a redimido
      const fechaRedencion = new Date().toISOString();
      await this.clienteService.redimirReferidosActivos(
        this.selectedCliente.id,
        fechaRedencion,
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
        (c) => c.id === this.selectedCliente?.id,
      );
      if (clienteEnLista) {
        clienteEnLista.cashback_acumulado = 0;
      }

      alert(
        `✅ Cashback de $${cashbackDisponible.toLocaleString(
          'es-CO',
        )} redimido exitosamente.`,
      );
    } catch (error) {
      console.error('Error al redimir referidos:', error);
      alert('❌ Error al redimir el cashback. Intenta de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  // ========== ABONOS ==========
  showAbonosModal = false;
  abonos: any[] = [];
  abonoForm!: FormGroup;
  selectedCompraForAbono: ClienteCompra | null = null;
  isLoadingAbonos = false;
  comprasTemporales: ClienteCompra[] = [];
  isEditingTempCompra = false;
  selectedTempCompraIndex: number | null = null;
  primerasComprasTemporales: Omit<ClienteCompra, 'cliente_id'>[] = [];
  isEditingPrimeraCompra = false;
  selectedPrimeraCompraIndex: number | null = null;

  initAbonoForm() {
    this.abonoForm = this.fb.group({
      monto: [null, [Validators.required, Validators.min(1000)]],
      fecha_abono: [
        new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      nota: [''],
    });
  }

  async openAbonosModal(compra: ClienteCompra) {
    this.selectedCompraForAbono = compra;
    this.showAbonosModal = true;
    if (!this.abonoForm) this.initAbonoForm();
    this.abonoForm.reset({
      monto: null,
      fecha_abono: new Date().toISOString().split('T')[0],
      nota: '',
    });
    await this.loadAbonos();
  }

  closeAbonosModal() {
    this.showAbonosModal = false;
    this.selectedCompraForAbono = null;
    this.abonos = [];
  }

  async loadAbonos() {
    if (!this.selectedCompraForAbono?.id) return;

    this.isLoadingAbonos = true;
    try {
      this.abonos = await this.clienteService.getAbonosByCompra(
        this.selectedCompraForAbono.id,
      );
    } catch (error) {
      console.error('Error cargando abonos:', error);
      alert('Error al cargar historial de abonos');
    } finally {
      this.isLoadingAbonos = false;
    }
  }

  async registrarAbono() {
    if (this.abonoForm.invalid || !this.selectedCompraForAbono?.id) {
      this.abonoForm.markAllAsTouched();
      return;
    }

    this.isLoadingAbonos = true;
    try {
      // Crear fecha en zona horaria de Colombia (UTC-5)
      const fechaAbonoStr = this.abonoForm.value.fecha_abono; // "YYYY-MM-DD"
      const [year, month, day] = fechaAbonoStr.split('-').map(Number);
      const fechaLocal = new Date(year, month - 1, day, 12, 0, 0); // Mediodía local para evitar cambios de día

      const abonoData = {
        compra_id: this.selectedCompraForAbono.id,
        monto: this.abonoForm.value.monto,
        fecha_abono: fechaLocal.toISOString(),
        nota: this.abonoForm.value.nota,
      };

      await this.clienteService.createAbono(abonoData);

      // Actualizar localmente el total de la compra (opcional, para visualización inmediata)
      // Aunque lo ideal es recargar las compras del cliente para ver el total actualizado en la tabla principal
      await this.loadAbonos();
      await this.loadCompras(); // Recargar compras para ver el abono total actualizado

      this.abonoForm.reset({
        monto: null,
        fecha_abono: new Date().toISOString().split('T')[0],
        nota: '',
      });
      alert('Abono registrado exitosamente');
    } catch (error) {
      console.error('Error registrando abono:', error);
      alert('Error al registrar el abono');
    } finally {
      this.isLoadingAbonos = false;
    }
  }

  async deleteAbono(abono: any) {
    if (!confirm(`¿Eliminar abono de ${this.formatCurrency(abono.monto)}?`)) {
      return;
    }

    this.isLoadingAbonos = true;
    try {
      await this.clienteService.deleteAbono(
        abono.id,
        this.selectedCompraForAbono!.id!,
      );
      await this.loadAbonos();
      await this.loadCompras(); // Actualizar total en tabla compras
      alert('Abono eliminado');
    } catch (error) {
      console.error('Error eliminando abono:', error);
      alert('Error al eliminar abono');
    } finally {
      this.isLoadingAbonos = false;
    }
  }

  // Helper para formato moneda en confirm
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

  // Helpers para mostrar/ocultar campos según tipo de compra
  get mostrarCamposGafasFormuladas(): boolean {
    return this.compraForm.get('tipo_compra')?.value === 'Gafas formuladas';
  }

  get mostrarCamposGafasSol(): boolean {
    const tipo = this.compraForm.get('tipo_compra')?.value;
    return tipo === 'Gafas de sol' || tipo === 'Gafas formuladas';
  }

  get mostrarCamposOptometria(): boolean {
    return this.compraForm.get('tipo_compra')?.value !== 'Consulta optometria';
  }

  get tipoCompraPrimeraCompra(): string {
    return (
      this.clienteForm.get('primera_compra_tipo_compra')?.value ||
      'Gafas formuladas'
    );
  }

  /**
   * Actualiza los validadores de los campos de compra según el tipo seleccionado
   */
  private actualizarValidadores(esPrimeraCompra: boolean, tipo: string) {
    const form = esPrimeraCompra ? this.clienteForm : this.compraForm;
    const prefix = esPrimeraCompra ? 'primera_compra_' : '';

    const controls = {
      lente: form.get(`${prefix}tipo_lente`),
      montura: form.get(`${prefix}tipo_montura`),
      rango: form.get(`${prefix}rango_precio`),
      seccion: form.get(`${prefix}seccion`),
      nota: form.get(`${prefix}nota_pago`),
    };

    const metodoPago = form.get(`${prefix}metodo_pago`)?.value;

    // Lipiar todos primero
    Object.values(controls).forEach((c) => c?.clearValidators());

    if (tipo === 'Gafas formuladas') {
      controls.lente?.setValidators(Validators.required);
      controls.montura?.setValidators(Validators.required);
      controls.rango?.setValidators(Validators.required);
      controls.seccion?.setValidators(Validators.required);
    } else if (tipo === 'Gafas de sol') {
      controls.seccion?.setValidators(Validators.required);
      // Montura y Rango son opcionales para sol
    }

    if (metodoPago === 'Acuerdo interno') {
      controls.nota?.setValidators(Validators.required);
    }

    // Actualizar validez de cada uno
    Object.values(controls).forEach((c) => c?.updateValueAndValidity());
  }

  get isPrimeraCompraValid(): boolean {
    const fc = this.clienteForm;
    // Estos campos siempre son obligatorios para cualquier compra en la lista
    if (
      fc.get('primera_compra_tipo_compra')?.invalid ||
      fc.get('primera_compra_metodo_pago')?.invalid ||
      fc.get('primera_compra_precio_total')?.invalid ||
      fc.get('primera_compra_abono')?.invalid
    ) {
      return false;
    }

    // Los campos condicionales ya tienen sus validadores actualizados por actualizarValidadores()
    if (
      fc.get('primera_compra_tipo_lente')?.invalid ||
      fc.get('primera_compra_tipo_montura')?.invalid ||
      fc.get('primera_compra_rango_precio')?.invalid ||
      fc.get('primera_compra_seccion')?.invalid ||
      fc.get('primera_compra_nota_pago')?.invalid
    ) {
      return false;
    }

    return true;
  }

  // Método para verificar y aplicar auto-selección de sección
  private verificarAutoSeleccionSeccion(esPrimeraCompra: boolean) {
    const form = esPrimeraCompra ? this.clienteForm : this.compraForm;
    const prefix = esPrimeraCompra ? 'primera_compra_' : '';

    const tipoCompra = form.get(`${prefix}tipo_compra`)?.value;
    const tipoMontura = form.get(`${prefix}tipo_montura`)?.value;

    if (
      tipoCompra === 'Gafas de sol' &&
      (tipoMontura === 'RayBan' || tipoMontura === 'Fento')
    ) {
      form.get(`${prefix}seccion`)?.setValue('Piedras Preciosas');
    }
  }

  get monturasPrimeraCompra(): typeof TIPOS_MONTURA {
    const tipo = this.tipoCompraPrimeraCompra;
    if (tipo === 'Gafas de sol') {
      return ['Clásica', 'RayBan', 'Fento'] as any;
    }
    return this.tiposMontura;
  }

  get monturasCompraExistente(): typeof TIPOS_MONTURA {
    const tipo = this.compraForm.get('tipo_compra')?.value;
    if (tipo === 'Gafas de sol') {
      return ['Clásica', 'RayBan', 'Fento'] as any;
    }
    return this.tiposMontura;
  }

  prepararMensajesWhatsApp(): void {
    if (!this.clienteRegistrado) return;

    const mensajes = this.whatsAppService.obtenerDatosMensajes(
      this.clienteRegistrado,
      this.clienteReferidor,
      this.rangoPrecioCompra || undefined,
      this.cashbackAcumuladoReferidor,
    );

    this.whatsAppBienvenida = mensajes.bienvenida;
    this.whatsAppReferido = mensajes.referido || null;
  }

  enviarWhatsAppBienvenida(): void {
    if (this.whatsAppBienvenida) {
      const url = this.whatsAppService.generarUrlWhatsApp(
        this.whatsAppBienvenida.telefono,
        this.whatsAppBienvenida.mensaje,
      );
      window.open(url, '_blank');
    }
  }

  enviarWhatsAppReferido(): void {
    if (this.whatsAppReferido) {
      const url = this.whatsAppService.generarUrlWhatsApp(
        this.whatsAppReferido.telefono,
        this.whatsAppReferido.mensaje,
      );
      window.open(url, '_blank');
    }
  }

  closeWhatsAppModal(): void {
    this.showWhatsAppModal = false;
    this.whatsAppBienvenida = null;
    this.whatsAppReferido = null;
    this.clienteRegistrado = null;
    this.clienteReferidor = null;
    this.rangoPrecioCompra = '';
  }

  async openWhatsAppModalForCliente(cliente: Cliente): Promise<void> {
    this.clienteRegistrado = {
      nombres: cliente.nombres,
      telefono: cliente.telefono,
    };

    this.whatsAppBienvenida = {
      telefono: cliente.telefono,
      mensaje: this.whatsAppService.generarMensajeBienvenida(cliente.nombres),
    };

    // Este es un cliente existente, NO es un nuevo registro
    this.esNuevoRegistroConCashback = false;
    this.referidorYaRedimio = false;
    this.clienteReferidorId = null;

    if (cliente.es_referido && cliente.cliente_referidor_id) {
      const referidor = this.clientes.find(
        (c) => c.id === cliente.cliente_referidor_id,
      );
      if (referidor) {
        this.clienteReferidor = {
          nombres: referidor.nombres,
          telefono: referidor.telefono,
        };
        this.clienteReferidorId = referidor.id || null;
        this.cashbackAcumuladoReferidor = referidor.cashback_acumulado || 0;
        this.referidorYaRedimio = (referidor.cashback_acumulado || 0) === 0;

        const ultimaCompra = await this.clienteService.getUltimaCompraCliente(
          cliente.id!,
        );
        if (ultimaCompra) {
          this.rangoPrecioCompra = ultimaCompra.rango_precio;
          this.whatsAppReferido = {
            telefono: referidor.telefono,
            mensaje: this.whatsAppService.generarMensajeReferido(
              referidor.nombres,
              cliente.nombres,
              ultimaCompra.rango_precio,
              referidor.cashback_acumulado || 0,
              false, // Es cliente existente, el cashback ya está incluido en el total
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
        'es-CO',
      )}?\n\nEsto reiniciará el contador a $0.`,
    );

    if (!confirmacion) return;

    this.isLoading = true;
    try {
      await this.clienteService.resetCashback(this.selectedCliente.id);

      this.selectedCliente.cashback_acumulado = 0;

      const clienteEnLista = this.clientes.find(
        (c) => c.id === this.selectedCliente?.id,
      );
      if (clienteEnLista) {
        clienteEnLista.cashback_acumulado = 0;
      }

      alert(
        `✅ Cashback de $${cashbackActual.toLocaleString(
          'es-CO',
        )} redimido exitosamente.`,
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
        '¿Estás seguro de restaurar los mensajes por defecto?\n\nEsto sobrescribirá tu configuración actual.',
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

  // ========== MODAL INFORMACIÓN COMPLETA ==========

  async openInfoModal(cliente: Cliente): Promise<void> {
    this.selectedCliente = cliente;
    this.showInfoModal = true;
    this.isLoadingInfoCompras = true;
    this.infoCompras = [];

    try {
      this.infoCompras = await this.clienteService.getComprasByCliente(
        cliente.id!,
      );
    } catch (error) {
      console.error('Error cargando compras del cliente:', error);
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
}
