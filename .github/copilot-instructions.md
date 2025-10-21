# OhMyGlasses - AI Agent Instructions

This document provides essential context for AI agents working with the OhMyGlasses codebase.

## Project Overview

OhMyGlasses is an e-commerce website specializing in prescription glasses and sunglasses. The platform is designed to provide a seamless shopping experience across all devices, with a strong focus on mobile responsiveness.

## Project Architecture

- **Framework**: Angular 20.3.6 with standalone components
- **TypeScript**: 5.9.3
- **SCSS**: 1.93.2 with modern @use/@forward syntax
- **Layout Structure**: 
  - Main layout (`src/app/components/layouts/main-layout`) wraps all pages
  - Components are organized in `src/app/components/` (reusable) and `src/app/pages/` (route-specific)
  - Global styles centralized in `src/styles.scss`

### Key Components
- Header (`src/app/components/header`) - Includes responsive burger menu for mobile
- Footer (`src/app/components/footer`)
- Banner (`src/app/components/banner`)
- Product Card (`src/app/components/product-card`) - Reusable product display
- Main Layout (`src/app/components/layouts/main-layout`)

### Pages Structure
- Home (`src/app/pages/home`) - Landing page with featured products
- Men (`src/app/pages/men`) - Men's glasses catalog
- Women (`src/app/pages/women`) - Women's glasses catalog
- Kids (`src/app/pages/kids`) - Kids' glasses catalog
- All Products (`src/app/pages/all-products`) - Complete product catalog
- Categories (`src/app/pages/categories`) - Category overview
- Product Detail (`src/app/pages/product-detail`) - Individual product details

## Development Workflows

### Local Development
```bash
npm install        # Install dependencies
npm start         # Start dev server at http://localhost:4200
npm run watch     # Build in watch mode
npm test         # Run unit tests
```

### Component Generation
Use Angular CLI for consistent component creation:
```bash
ng generate component components/new-component  # For shared components
ng generate component pages/new-page           # For pages
```

## Project Conventions

1. **Routing Structure**:
   - All routes are defined in `src/app/app.routes.ts`
   - Pages use main layout as a wrapper (`MainLayoutComponent`)

2. **Styling and Responsive Design**:
   - Uses Bootstrap 5.3.8 for layout and responsive components
   - Mobile-first approach required for all components
   - **Styling Best Practices**:
     - **Prefer Bootstrap utilities**: Use Bootstrap classes (spacing, display, flexbox, position, etc.) whenever possible to avoid bloating component-specific SCSS files
     - **Component SCSS**: Only use for custom styles that Bootstrap doesn't provide (gradients, animations, hover effects, pseudo-elements, custom colors)
     - **Global styles (`src/styles.scss`)**: Add generalized styles that are reused across multiple components (button overrides, breadcrumbs, shared animations, WhatsApp float button)
     - **Color consistency**: Always respect the project's color palette (`$primary: #21372B`, `$secondary: #642719`, `$light: #F7F2DA`). Never override these colors unless explicitly required
     - **DRY principle**: Avoid duplicating styles - check if they exist in global styles before adding to component SCSS
     - **Space optimization**: Use responsive spacing classes like `py-3 py-md-4` instead of fixed values
   - Bootstrap Icons 1.x for iconography
   - Media queries should follow Bootstrap breakpoints:
     - Mobile: < 576px (320px-575px)
     - Tablet: ≥ 576px (576px-991px)
     - Desktop: ≥ 992px (992px+)
     - Ultra-wide: Max-width containers at 1320px, 1440px, 1600px

3. **Testing**:
   - Each component has a `.spec.ts` file for unit tests
   - Tests run with Karma test runner

## Dependencies
- Angular 20.3.6 with standalone components
- Bootstrap 5.3.8 for UI framework
- Bootstrap Icons 1.11.3 for iconography
- RxJS 7.8.0 for reactive programming
- TypeScript 5.9.3
- SCSS 1.93.2 with modern syntax
- Karma 6.4.0 + Jasmine 5.6.0 for testing

## Performance Optimizations

The project has been optimized for bundle size and performance:

- **Bundle Size**: Reduced from 219.60 KB to ~190 KB (13.4% reduction)
- **SCSS Optimization**: 
  - Home page: 66% reduction (400 → 135 lines)
  - Category pages: 60% reduction (250 → 100 lines each)
  - Product detail: 61% reduction (350 → 135 lines)
  - Global deduplication: ~140 duplicate lines removed
- **Code splitting**: Lazy-loaded routes for better initial load
- **Space optimization**: 30-40% vertical spacing reduction across all pages

## Common Tasks
- Adding a new page: Create component in `src/app/pages/` and add route to `app.routes.ts`
- Adding a shared component: Place in `src/app/components/` and import where needed
- Styling changes: Modify component-specific `.scss` files or global styles in `src/styles.scss`
- Mobile menu: Managed in `header.component.ts` with `isMenuOpen` state and overlay

## Current Features

- ✅ **Fully Responsive**: Mobile-first design with clamp() and viewport units
- ✅ **Mobile Navigation**: Burger menu with full-page overlay and blur effect
- ✅ **Product Catalog**: Organized by categories (Men, Women, Kids, All Products)
- ✅ **Advanced Filters**: Search, price range, sorting, and style filters
- ✅ **Product Details**: Gallery, specifications, pricing, and WhatsApp integration
- ✅ **Animations**: Logo shine, nav underlines, button ripples, hover effects
- ✅ **WhatsApp Float Button**: Global contact button with ripple animation
- ✅ **Bootstrap Utilities**: Maximized use to minimize custom SCSS

## Styling Architecture Guidelines

When implementing styles, follow this decision tree:

1. **Can it be done with Bootstrap utilities?**
   - YES → Use Bootstrap classes (margin, padding, display, flex, position, colors, etc.)
   - NO → Continue to step 2

2. **Is it a custom visual effect?**
   - Gradients, animations, transitions, hover effects, pseudo-elements (::before, ::after)
   - YES → Add to component-specific SCSS file
   - NO → Continue to step 3

3. **Is it reused across multiple components?**
   - Button styles, breadcrumbs, global animations, shared patterns
   - YES → Add to `src/styles.scss` (global styles)
   - NO → Add to component-specific SCSS file

4. **Does it override Bootstrap defaults?**
   - Ensure it uses project colors: `$primary`, `$secondary`, `$light`
   - Add to `src/styles.scss` if used globally, or component SCSS if component-specific

### Examples:

**✅ Good - Using Bootstrap:**
```html
<div class="d-flex justify-content-between align-items-center p-3 mb-4 bg-light rounded-3">
```

**❌ Bad - Custom SCSS for what Bootstrap provides:**
```scss
.my-container {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  margin-bottom: 1.5rem;
}
```

**✅ Good - Custom effects in component SCSS:**
```scss
.hero-title {
  background: linear-gradient(135deg, $primary 0%, $secondary 100%);
  -webkit-background-clip: text;
  animation: fadeIn 0.5s ease;
}
```

**✅ Good - Reusable styles in global SCSS:**
```scss
// src/styles.scss
.btn-primary {
  background: linear-gradient(135deg, $primary 0%, $secondary 100%);
  // Reused across all pages
}
```
