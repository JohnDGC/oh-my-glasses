import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { FormulaService } from '../../services/formula.service';
import { PdfService } from '../../services/pdf.service';
import {
  Formula,
  FormulaConCliente,
  ClienteFormula,
  TIPOS_LENTES,
} from '../../models/formula.model';
import { Cliente } from '../../models/cliente.model';
import { PaginationHelper } from '../../shared/utils/pagination.util';
import { SearchHelper } from '../../shared/utils/search.util';
import { FormatUtils } from '../../shared/utils/format.util';

@Component({
  selector: 'app-formula',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './formula.component.html',
  styleUrl: './formula.component.scss',
})
export class FormulaComponent implements OnInit {
  // Data
  formulas: FormulaConCliente[] = [];
  historialFormulas: Formula[] = [];

  // Forms
  formulaForm!: FormGroup;
  busquedaClienteForm!: FormGroup;

  // Helpers
  pagination = new PaginationHelper<FormulaConCliente>([10, 20, 30], 10);
  search = new SearchHelper<FormulaConCliente>([
    'nombres',
    'identificacion',
    'numero_formula',
  ]);

  // Estado
  isLoading = false;
  isLoadingHistorial = false;
  showModal = false;
  showHistorialModal = false;
  showVerModal = false;
  isEditMode = false;
  selectedFormula: Formula | null = null;
  selectedPaciente: string = '';

  // Cliente encontrado en búsqueda
  clienteEncontrado: Cliente | ClienteFormula | null = null;
  tipoClienteEncontrado: 'compra' | 'formula' | null = null;
  busquedaRealizada = false;

  // Constantes para template
  tiposLentes = TIPOS_LENTES;
  formatDate = FormatUtils.formatDate;

  constructor(
    private fb: FormBuilder,
    private formulaService: FormulaService,
    private pdfService: PdfService
  ) {
    this.initForms();
  }

  async ngOnInit() {
    await this.loadFormulas();
  }

  initForms() {
    // Formulario de búsqueda de cliente
    this.busquedaClienteForm = this.fb.group({
      identificacion: [
        '',
        [Validators.required, Validators.pattern('^[0-9]+$')],
      ],
    });

    // Formulario principal de fórmula
    this.formulaForm = this.fb.group({
      // Datos del paciente
      identificacion: ['', Validators.required],
      nombres: ['', Validators.required],
      direccion: [''],
      telefono: [''],
      email: ['', Validators.email],
      fecha_nacimiento: [''],
      edad: [''],
      regimen: [''],
      afiliacion: [''],

      // Ojo Derecho
      od_esfera: [''],
      od_cilindro: [''],
      od_eje: [''],
      od_adicion: [''],
      od_prisma_base: [''],
      od_av_lejos: [''],
      od_av_cerca: [''],
      od_grados: [''],

      // Ojo Izquierdo
      oi_esfera: [''],
      oi_cilindro: [''],
      oi_eje: [''],
      oi_adicion: [''],
      oi_prisma_base: [''],
      oi_av_lejos: [''],
      oi_av_cerca: [''],
      oi_grados: [''],

      // Diagnóstico
      diagnostico: [''],
      diagnostico_relacion_1: [''],
      diagnostico_relacion_2: [''],
      diagnostico_relacion_3: [''],

      // Tipo de lentes y detalles
      tipo_lentes: ['', Validators.required],
      tipo_lentes_detalle: [''],
      altura: [''],

      // Color y tratamientos
      color: [''],
      tratamientos: [''],

      // DP
      dp: [''],

      // Uso y control
      uso_dispositivo: [''],
      control: [''],
      duracion_tratamiento: [''],

      // Observaciones
      observaciones: [''],
    });
  }

  async loadFormulas() {
    this.isLoading = true;
    try {
      this.formulas = await this.formulaService.getFormulas();
      this.search.setItems(this.formulas);
      this.pagination.setItems(this.search.filteredItems);
    } catch (error) {
      console.error('Error cargando fórmulas:', error);
      alert('Error al cargar las fórmulas');
    } finally {
      this.isLoading = false;
    }
  }

  searchFormulas() {
    this.search.filter();
    this.pagination.setItems(this.search.filteredItems);
  }

  // ========== MODAL NUEVA FÓRMULA ==========

  openModal() {
    this.isEditMode = false;
    this.selectedFormula = null;
    this.clienteEncontrado = null;
    this.tipoClienteEncontrado = null;
    this.busquedaRealizada = false;
    this.formulaForm.reset();
    this.busquedaClienteForm.reset();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.formulaForm.reset();
    this.busquedaClienteForm.reset();
    this.clienteEncontrado = null;
    this.tipoClienteEncontrado = null;
    this.busquedaRealizada = false;
  }

  async buscarCliente() {
    if (this.busquedaClienteForm.invalid) {
      this.busquedaClienteForm.markAllAsTouched();
      return;
    }

    const identificacion =
      this.busquedaClienteForm.get('identificacion')?.value;
    this.isLoading = true;
    this.busquedaRealizada = true;

    try {
      const resultado =
        await this.formulaService.buscarClientePorIdentificacion(
          identificacion
        );

      if (resultado.encontrado) {
        this.clienteEncontrado = resultado.cliente;
        this.tipoClienteEncontrado = resultado.tipo;

        // Autocompletar formulario con datos del cliente
        const cliente = resultado.cliente as any;
        this.formulaForm.patchValue({
          identificacion: cliente.cedula || cliente.identificacion,
          nombres: cliente.nombres,
          direccion: cliente.direccion || '',
          telefono: cliente.telefono,
          email: cliente.correo || cliente.email || '',
          fecha_nacimiento: cliente.fecha_nacimiento || '',
        });

        // Calcular edad si hay fecha de nacimiento
        if (cliente.fecha_nacimiento) {
          const edad = this.calcularEdad(cliente.fecha_nacimiento);
          this.formulaForm.patchValue({ edad });
        }
      } else {
        this.clienteEncontrado = null;
        this.tipoClienteEncontrado = null;

        // Pre-llenar solo la identificación
        this.formulaForm.patchValue({
          identificacion: identificacion,
        });
      }
    } catch (error) {
      console.error('Error buscando cliente:', error);
      alert('Error al buscar el cliente');
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit() {
    if (this.formulaForm.invalid) {
      this.formulaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.formulaForm.value;

      // Si el cliente no existe, crear en clientes_formula
      let clienteFormulaId = null;
      let clienteCompraId = null;

      if (!this.clienteEncontrado) {
        const nuevoCliente: ClienteFormula = {
          identificacion: formValue.identificacion,
          nombres: formValue.nombres,
          direccion: formValue.direccion,
          telefono: formValue.telefono,
          email: formValue.email,
          fecha_nacimiento: formValue.fecha_nacimiento,
        };

        const clienteCreado = await this.formulaService.createClienteFormula(
          nuevoCliente
        );
        clienteFormulaId = clienteCreado.id!;
      } else {
        // Cliente existente
        if (this.tipoClienteEncontrado === 'compra') {
          clienteCompraId = this.clienteEncontrado.id!;
        } else {
          clienteFormulaId = this.clienteEncontrado.id!;
        }
      }

      // Crear la fórmula
      const nuevaFormula: Formula = {
        ...formValue,
        cliente_compra_id: clienteCompraId,
        cliente_formula_id: clienteFormulaId,
      };

      await this.formulaService.createFormula(nuevaFormula);
      alert('Fórmula registrada exitosamente');
      this.closeModal();
      await this.loadFormulas();
    } catch (error: any) {
      console.error('Error guardando fórmula:', error);
      alert(
        `Error al guardar la fórmula: ${error.message || 'Error desconocido'}`
      );
    } finally {
      this.isLoading = false;
    }
  }

  // ========== MODAL VER FÓRMULA ==========

  openVerModal(formula: Formula) {
    this.selectedFormula = formula;
    this.showVerModal = true;
  }

  closeVerModal() {
    this.showVerModal = false;
    this.selectedFormula = null;
  }

  // ========== MODAL HISTORIAL ==========

  async openHistorialModal(formula: Formula) {
    this.selectedPaciente = formula.nombres;
    this.showHistorialModal = true;
    this.isLoadingHistorial = true;

    try {
      this.historialFormulas = await this.formulaService.getHistorialFormulas(
        formula.identificacion
      );
    } catch (error) {
      console.error('Error cargando historial:', error);
      alert('Error al cargar el historial del paciente');
    } finally {
      this.isLoadingHistorial = false;
    }
  }

  closeHistorialModal() {
    this.showHistorialModal = false;
    this.historialFormulas = [];
    this.selectedPaciente = '';
  }

  // ========== ACCIONES ==========

  async deleteFormula(formula: Formula) {
    if (
      !confirm(
        `¿Estás seguro de eliminar la fórmula ${formula.numero_formula}?`
      )
    ) {
      return;
    }

    this.isLoading = true;
    try {
      await this.formulaService.deleteFormula(formula.id!);
      alert('Fórmula eliminada exitosamente');
      await this.loadFormulas();
    } catch (error) {
      console.error('Error eliminando fórmula:', error);
      alert('Error al eliminar la fórmula');
    } finally {
      this.isLoading = false;
    }
  }

  generarPDF(formula: Formula) {
    try {
      this.pdfService.generarFormulaPDF(formula);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente.');
    }
  }

  descargarPDF(formula: Formula) {
    try {
      this.pdfService.descargarFormulaPDF(formula);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el PDF. Por favor intente nuevamente.');
    }
  }

  // ========== UTILIDADES ==========

  calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  // ========== GETTERS ==========

  get identificacionBusqueda() {
    return this.busquedaClienteForm.get('identificacion');
  }
}
