# 🕶️ OhMyGlasses

E-commerce moderno y responsivo especializado en lentes de prescripción y gafas de sol. Desarrollado con Angular 20 y Bootstrap 5, enfocado en proporcionar una experiencia de usuario fluida en todos los dispositivos.

![Angular](https://img.shields.io/badge/Angular-20.3.6-red)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Características

- ✨ **Diseño Moderno**: Interfaz elegante con gradientes personalizados y animaciones fluidas
- 📱 **Totalmente Responsivo**: Optimizado para móviles, tablets y desktop
- 🎨 **Tema Personalizado**: Paleta de colores única (#21372B, #642719, #F7F2DA)
- 🔍 **Filtros Avanzados**: Búsqueda, ordenamiento por precio, rango de precios y estilos
- 🛒 **Catálogo Completo**: Productos organizados por categorías (Hombres, Mujeres, Niños)
- 🎯 **Animaciones CSS**: Efectos hover, transiciones suaves y animaciones personalizadas
- 📦 **Componentes Standalone**: Arquitectura Angular moderna sin módulos NgModule
- 🌐 **SEO Friendly**: Estructura optimizada para motores de búsqueda
- 💬 **Integración WhatsApp**: Botón flotante para consultas directas
- 🍔 **Menú Burger**: Navegación móvil con overlay y blur
- 🗄️ **Backend con Supabase**: Base de datos PostgreSQL y storage para imágenes

## 📋 Requisitos Previos

- **Node.js**: >= 18.19.0 o >= 20.11.0 o >= 22.0.0
- **npm**: >= 9.0.0
- **Angular CLI**: 20.3.6

## 🛠️ Tecnologías

### Core
- **Angular**: 20.3.6 - Framework principal con standalone components
- **TypeScript**: 5.9.3 - Lenguaje de programación
- **RxJS**: 7.8.0 - Programación reactiva
- **Zone.js**: 0.15.0 - Detección de cambios de Angular

### Backend
- **Supabase**: PostgreSQL database + Storage + Auth
- **@supabase/supabase-js**: 2.x - Cliente JavaScript

### UI/Styling
- **Bootstrap**: 5.3.8 - Framework CSS para layout responsive
- **Bootstrap Icons**: 1.13.1 - Biblioteca de iconos
- **SCSS/Sass**: 1.93.2 - Preprocesador CSS con @use/@forward

### Testing
- **Karma**: 6.4.0 - Test runner
- **Jasmine**: 5.6.0 - Framework de testing

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/JohnDGC/oh-my-glasses.git
cd oh-my-glasses
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Supabase (Opcional para desarrollo)**
   - Sigue la guía completa en [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)
   - O usa los datos mock mientras desarrollas

4. **Iniciar servidor de desarrollo**
```bash
npm start
# o
ng serve
```

5. **Abrir en el navegador**
```
http://localhost:4200/
```

La aplicación se recargará automáticamente cuando modifiques archivos fuente.

## 📂 Estructura del Proyecto

```
oh-my-glasses/
├── src/
│   ├── app/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── header/          # Header con menú burger responsivo
│   │   │   ├── footer/          # Footer con redes sociales
│   │   │   ├── banner/          # Banner promocional
│   │   │   ├── product-card/    # Tarjeta de producto
│   │   │   └── layouts/
│   │   │       └── main-layout/ # Layout principal
│   │   ├── pages/               # Páginas de la aplicación
│   │   │   ├── home/           # Página de inicio
│   │   │   ├── men/            # Catálogo de hombres
│   │   │   ├── women/          # Catálogo de mujeres
│   │   │   ├── kids/           # Catálogo de niños
│   │   │   ├── all-products/   # Todos los productos
│   │   │   ├── categories/     # Vista general de categorías
│   │   │   └── product-detail/ # Detalle de producto
│   │   ├── models/             # Interfaces y modelos TypeScript
│   │   ├── services/           # Servicios (ProductService)
│   │   ├── app.component.*     # Componente raíz
│   │   ├── app.config.ts       # Configuración de la app
│   │   └── app.routes.ts       # Definición de rutas
│   ├── assets/
│   │   ├── images/             # Imágenes del proyecto
│   │   └── scss/               # Variables y mixins SCSS globales
│   ├── styles.scss             # Estilos globales
│   └── index.html              # HTML principal
├── .github/
│   └── copilot-instructions.md # Guías para AI agents
├── angular.json                # Configuración de Angular CLI
├── package.json                # Dependencias del proyecto
└── README.md                   # Este archivo
```

## 🎨 Paleta de Colores

```scss
$primary: #21372B;   // Verde oscuro (principal)
$secondary: #642719; // Marrón (acentos)
$light: #F7F2DA;     // Beige claro (fondos y texto)
```

## 🎯 Scripts Disponibles

```bash
# Desarrollo
npm start              # Inicia servidor de desarrollo (puerto 4200)
npm run watch          # Build en modo watch

# Producción
npm run build          # Build optimizado para producción

# Testing
npm test               # Ejecuta tests unitarios con Karma

# Angular CLI
ng generate component nombre-componente  # Genera nuevo componente
ng generate service nombre-servicio      # Genera nuevo servicio
ng generate --help                       # Lista todos los schematics
```

## 🧪 Testing

El proyecto utiliza **Karma** con **Jasmine** para tests unitarios.

```bash
npm test
```

Los tests se ejecutan en modo watch por defecto. Cada componente tiene su archivo `*.spec.ts` correspondiente.

## 🏗️ Build

```bash
npm run build
```

Los archivos optimizados se generan en el directorio `dist/`. Incluye:
- Minificación y uglificación de código
- Tree shaking para eliminar código no utilizado
- Optimización de imágenes y assets
- Source maps para debugging

**Bundle size optimizado**: ~190 KB (reducción del 13.4% vs versión inicial)

## 🌐 Rutas de la Aplicación

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `HomeComponent` | Página de inicio con destacados |
| `/hombres` | `MenComponent` | Catálogo de lentes para hombres |
| `/mujeres` | `WomenComponent` | Catálogo de lentes para mujeres |
| `/ninos` | `KidsComponent` | Catálogo de lentes para niños |
| `/todos` | `AllProductsComponent` | Todos los productos disponibles |
| `/categories` | `CategoriesComponent` | Vista general de categorías |
| `/producto/:id` | `ProductDetailComponent` | Detalle individual de producto |
| `/admin` | `AdminComponent` | 🔒 Panel de administración (CRUD) |

Todas las rutas utilizan `MainLayoutComponent` como wrapper para header y footer consistentes.

## 📱 Responsive Design

El proyecto implementa un enfoque **mobile-first** con múltiples breakpoints:

- **Mobile**: < 576px (320px-575px)
- **Tablet**: ≥ 576px (576px-991px)
- **Desktop**: ≥ 992px (992px+)
- **Ultra-wide**: Max-width contenedores hasta 1600px

### Técnicas Utilizadas:

1. **Fluid Typography**: `clamp(min, preferred, max)` para tamaños de fuente adaptativos
2. **Viewport Units**: `vh`, `vw` para dimensiones fluidas
3. **Bootstrap Grid**: Sistema de columnas responsivo con breakpoints
4. **Meta Viewport**: Configurado con `maximum-scale=5` para accesibilidad
5. **Mobile Navigation**: Menú burger con overlay y blur effect
6. **Flexible Spacing**: Clases de Bootstrap con modificadores responsivos (`py-3 py-md-4`)

## 🎨 Arquitectura de Estilos

### Principios:

1. **Priorizar Bootstrap Utilities**: Usar clases de Bootstrap para spacing, display, flexbox, position
2. **Component SCSS**: Solo para estilos custom (gradientes, animaciones, pseudo-elementos)
3. **Global Styles (`styles.scss`)**: Para estilos reutilizables (botones, breadcrumbs, animaciones compartidas)
4. **Consistencia de Colores**: Siempre usar variables `$primary`, `$secondary`, `$light`

### Reducción de Código:

- **Home**: 66% reducción (400 → 135 líneas)
- **Category Pages**: 60% reducción (250 → 100 líneas cada una)
- **Product Detail**: 61% reducción (350 → 135 líneas)
- **Global Deduplication**: ~140 líneas eliminadas

## 🗄️ Backend con Supabase

El proyecto está configurado para usar **Supabase** como backend completo:

### Características Principales
- 🗄️ **PostgreSQL Database**: Base de datos relacional con productos, imágenes y características
- 📦 **Storage**: Almacenamiento de imágenes de productos
- 🔒 **Row Level Security**: Políticas de seguridad configuradas
- 📊 **Admin Panel**: Interfaz completa para gestión de productos en `/admin`

### Panel de Administración (`/admin`)

Interfaz completa de administración con:
- ✅ CRUD completo de productos
- 📸 Gestión de múltiples imágenes
- 🏷️ Editor dinámico de características
- 🔍 Búsqueda y filtrado en tiempo real
- 📋 Tabla responsive con acciones rápidas

### Desarrollo Local
```bash
# Para usar datos mock (sin Supabase)
# En src/environments/environment.ts:
useMockData: true

# Para usar Supabase (backend real)
useMockData: false
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones:

- Usar **Angular CLI** para generar componentes (`ng generate component`)
- Seguir arquitectura de componentes standalone
- Priorizar Bootstrap utilities sobre SCSS custom
- Mantener enfoque mobile-first en diseño
- Escribir tests para nuevos componentes

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**JohnDGC**
- GitHub: [@JohnDGC](https://github.com/JohnDGC)

## 🔗 Enlaces

- [Angular Documentation](https://angular.dev)
- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RxJS Documentation](https://rxjs.dev/)

---

Desarrollado con ❤️ usando Angular y Bootstrap
