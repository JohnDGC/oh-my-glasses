# Cliente Search Component

Componente de búsqueda de clientes con autocompletado, diseñado para reemplazar `<select>` gigantes con mejor UX.

## 📋 Características

- ✅ **Búsqueda en tiempo real** por nombre o cédula
- ✅ **Autocompletado dropdown** con máximo 10 resultados
- ✅ **Navegación con teclado** (↑↓ Enter Escape)
- ✅ **Integración con Reactive Forms** (ControlValueAccessor)
- ✅ **Responsive** y accesible
- ✅ **Visual feedback** del cliente seleccionado
- ✅ **Limpieza de selección** con botón X

## 🚀 Uso Básico

### 1. Importar en tu componente

```typescript
import { ClienteSearchComponent } from '../../components/cliente-search/cliente-search.component';

@Component({
  imports: [ClienteSearchComponent, ...],
})
```

### 2. Usar en el template

```html
<app-cliente-search
  [clientes]="listaDeClientes"
  [label]="'Cliente'"
  [placeholder]="'Buscar por nombre o cédula...'"
  [required]="true"
  [maxResults]="10"
  formControlName="cliente_id"
></app-cliente-search>
```

### 3. En el formulario reactivo

```typescript
this.formulario = this.fb.group({
  cliente_id: [null, Validators.required]
});
```

## 📦 Props (Inputs)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `clientes` | `Cliente[]` | `[]` | Array de clientes disponibles |
| `label` | `string` | `'Cliente'` | Etiqueta del campo |
| `placeholder` | `string` | `'Buscar cliente...'` | Texto placeholder |
| `required` | `boolean` | `false` | Marca el campo como requerido |
| `disabled` | `boolean` | `false` | Deshabilita el componente |
| `maxResults` | `number` | `10` | Máximo de resultados mostrados |

## 📤 Outputs (Events)

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `clienteSelected` | `EventEmitter<Cliente \| null>` | Se emite cuando se selecciona un cliente |

## 🎨 Ejemplo Completo

```typescript
// componente.ts
export class MiComponente {
  clientes: Cliente[] = [];
  formulario: FormGroup;

  constructor(private fb: FormBuilder) {
    this.formulario = this.fb.group({
      cliente_referidor_id: [null, Validators.required]
    });
  }

  onClienteSelected(cliente: Cliente | null) {
    console.log('Cliente seleccionado:', cliente);
  }
}
```

```html
<!-- componente.html -->
<form [formGroup]="formulario">
  <app-cliente-search
    [clientes]="clientes"
    [label]="'Cliente Referidor'"
    [placeholder]="'Buscar por nombre o cédula...'"
    [required]="true"
    [maxResults]="15"
    formControlName="cliente_referidor_id"
    (clienteSelected)="onClienteSelected($event)"
  ></app-cliente-search>
</form>
```

## ⌨️ Atajos de Teclado

- `↑` / `↓` - Navegar entre resultados
- `Enter` - Seleccionar resultado resaltado
- `Escape` - Cerrar dropdown
- `Tab` - Cerrar dropdown (blur)

## 🎯 Ventajas vs Select Normal

| Select Normal | Cliente Search Component |
|--------------|--------------------------|
| ❌ Lista larga difícil de navegar | ✅ Máximo 10 resultados |
| ❌ Scroll infinito | ✅ Búsqueda en tiempo real |
| ❌ Sin feedback visual | ✅ Card de confirmación |
| ❌ Solo mouse | ✅ Navegación por teclado |
| ❌ Difícil encontrar cliente | ✅ Filtrado inteligente |

## 🔧 Personalización

### Estilos SCSS

El componente usa variables CSS que puedes sobrescribir:

```scss
app-cliente-search {
  --dropdown-max-height: 400px;
  --result-item-hover: #f8f9fa;
  --border-color: #dee2e6;
}
```

### Modificar template

Edita `cliente-search.component.html` para cambiar la estructura del dropdown.

## 📱 Responsive

- **Desktop**: Dropdown completo con footer
- **Mobile**: Dropdown reducido (max-height: 300px)

## 🐛 Solución de Problemas

**El componente no muestra resultados:**
- Verifica que `[clientes]` tenga datos
- Revisa que los objetos tengan `id`, `nombres` y `cedula`

**No se actualiza el formulario:**
- Asegúrate de usar `formControlName` correctamente
- Verifica que el FormControl exista en el FormGroup

**Dropdown no se cierra:**
- El `blur` tiene 200ms de delay para permitir clics
- Usa `Escape` para cerrar manualmente

## 🔄 Integración Futura

Este componente puede extenderse para:
- Búsqueda por múltiples campos (teléfono, email)
- Paginación en el dropdown
- Búsqueda async en backend
- Crear cliente si no existe
- Multi-select (seleccionar varios clientes)

## 📝 Notas de Desarrollo

- Implementa `ControlValueAccessor` para integrarse con Reactive Forms
- Usa `forwardRef` para evitar referencias circulares
- Usa `asyncScheduler` de RxJS en lugar de `setTimeout` para mejor gestión de timers
- Implementa `OnDestroy` para limpiar suscripciones y prevenir memory leaks
- El delay de 200ms en `onBlur` previene cierre prematuro al hacer clic en el dropdown
