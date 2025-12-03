import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { asyncScheduler, Subscription } from 'rxjs';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-search.component.html',
  styleUrls: ['./cliente-search.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ClienteSearchComponent),
      multi: true,
    },
  ],
})
export class ClienteSearchComponent implements ControlValueAccessor, OnDestroy {
  @Input() clientes: Cliente[] = [];
  @Input() placeholder = 'Buscar cliente por nombre o cédula...';
  @Input() label = 'Cliente';
  @Input() required = false;
  @Input() disabled = false;
  @Input() maxResults = 10;

  @Output() clienteSelected = new EventEmitter<Cliente | null>();

  searchTerm = '';
  filteredClientes: Cliente[] = [];
  selectedCliente: Cliente | null = null;
  showDropdown = false;
  highlightedIndex = -1;
  searchWords: string[] = []; // Para resaltar palabras en el template

  // ControlValueAccessor
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  // Subscription para limpiar el timer
  private blurSubscription?: Subscription;

  // Filtrar clientes en tiempo real con búsqueda inteligente por palabras
  onSearchChange() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredClientes = [];
      this.showDropdown = false;
      return;
    }

    // Dividir el término de búsqueda en palabras individuales
    const searchWords = term.split(/\s+/).filter((word) => word.length > 0);
    this.searchWords = searchWords; // Guardar para usar en el template

    this.filteredClientes = this.clientes
      .filter((cliente) => {
        const nombreCompleto = cliente.nombres.toLowerCase();
        const cedula = cliente.cedula.toLowerCase();

        // Búsqueda por cédula exacta o parcial
        if (cedula.includes(term)) {
          return true;
        }

        const allWordsMatch = searchWords.every((word) =>
          nombreCompleto.includes(word)
        );

        return allWordsMatch;
      })
      .slice(0, this.maxResults);

    this.showDropdown = this.filteredClientes.length > 0;
    this.highlightedIndex = -1;
  }

  // Seleccionar cliente del dropdown
  selectCliente(cliente: Cliente) {
    this.selectedCliente = cliente;
    this.searchTerm = `${cliente.nombres} - ${cliente.cedula}`;
    this.showDropdown = false;
    this.highlightedIndex = -1;

    // Notificar al formulario reactivo
    this.onChange(cliente.id || null);
    this.onTouched();

    // Emitir evento para lógica adicional
    this.clienteSelected.emit(cliente);
  }

  // Limpiar selección
  clearSelection() {
    this.selectedCliente = null;
    this.searchTerm = '';
    this.filteredClientes = [];
    this.showDropdown = false;
    this.highlightedIndex = -1;
    this.searchWords = [];

    this.onChange(null);
    this.onTouched();
    this.clienteSelected.emit(null);
  }

  // Método para resaltar palabras coincidentes en el resultado
  highlightText(text: string): string {
    if (!this.searchWords.length) return text;

    let highlightedText = text;
    this.searchWords.forEach((word) => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-warning bg-opacity-50">$1</mark>'
      );
    });

    return highlightedText;
  }

  // Cerrar dropdown al hacer clic fuera
  onBlur(event?: FocusEvent) {
    // Cancelar timer anterior si existe
    if (this.blurSubscription) {
      this.blurSubscription.unsubscribe();
    }

    // No cerrar si el foco se movió dentro del dropdown
    this.blurSubscription = asyncScheduler.schedule(() => {
      const activeElement = document.activeElement;
      const dropdownElement = document.querySelector('.dropdown-results');

      // Si el elemento activo está dentro del dropdown, no cerrar
      if (dropdownElement && dropdownElement.contains(activeElement)) {
        return;
      }

      this.showDropdown = false;
      this.onTouched();

      // Si no hay cliente seleccionado, limpiar búsqueda
      if (!this.selectedCliente) {
        this.searchTerm = '';
      }
    }, 200);
  }

  // Prevenir que el mousedown en el dropdown cierre el input
  onDropdownMouseDown(event: MouseEvent) {
    event.preventDefault();
  }

  // Focus en el input
  onFocus() {
    if (this.searchTerm && this.filteredClientes.length > 0) {
      this.showDropdown = true;
    }
  }

  // Navegación con teclado
  onKeyDown(event: KeyboardEvent) {
    if (!this.showDropdown || this.filteredClientes.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(
          this.highlightedIndex + 1,
          this.filteredClientes.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0) {
          this.selectCliente(this.filteredClientes[this.highlightedIndex]);
        }
        break;
      case 'Escape':
        this.showDropdown = false;
        this.highlightedIndex = -1;
        break;
    }
  }

  // ControlValueAccessor methods
  writeValue(value: string | null): void {
    if (value) {
      // Buscar el cliente por ID
      const cliente = this.clientes.find((c) => c.id === value);
      if (cliente) {
        this.selectedCliente = cliente;
        this.searchTerm = `${cliente.nombres} - ${cliente.cedula}`;
      }
    } else {
      this.clearSelection();
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnDestroy(): void {
    // Limpiar suscripción del timer al destruir el componente
    if (this.blurSubscription) {
      this.blurSubscription.unsubscribe();
    }
  }
}
