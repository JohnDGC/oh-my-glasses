# OhMyGlasses - AI Agent Instructions

This document provides essential context for AI agents working with the OhMyGlasses codebase.

## Project Overview

OhMyGlasses is an e-commerce website specializing in prescription glasses and sunglasses. The platform is designed to provide a seamless shopping experience across all devices, with a strong focus on mobile responsiveness.

## Project Architecture

- **Framework**: Angular 19.2.x with standalone components
- **Layout Structure**: 
  - Main layout (`src/app/components/layouts/main-layout`) wraps all pages
  - Components are organized in `src/app/components/` (reusable) and `src/app/pages/` (route-specific)
  - Global styles in `src/assets/scss/`

### Key Components
- Header (`src/app/components/header`)
- Footer (`src/app/components/footer`)
- Banner (`src/app/components/banner`)
- Main Layout (`src/app/components/layouts/main-layout`)

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
   - Uses Bootstrap 5.3.x for layout and responsive components
   - Mobile-first approach required for all components
   - Custom styles in component-specific `.scss` files
   - Bootstrap Icons for iconography
   - Media queries should follow Bootstrap breakpoints:
     - Mobile: < 576px
     - Tablet: ≥ 576px
     - Desktop: ≥ 992px

3. **Testing**:
   - Each component has a `.spec.ts` file for unit tests
   - Tests run with Karma test runner

## Dependencies
- Bootstrap 5.3.x for UI framework
- Bootstrap Icons for iconography
- RxJS 7.8.x for reactive programming

## Common Tasks
- Adding a new page: Create component in `src/app/pages/` and add route to `app.routes.ts`
- Adding a shared component: Place in `src/app/components/` and import where needed
- Styling changes: Modify component-specific `.scss` files or global styles in `src/styles.scss`
