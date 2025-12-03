import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MenComponent } from './pages/men/men.component';
import { WomenComponent } from './pages/women/women.component';
import { KidsComponent } from './pages/kids/kids.component';
import { AllProductsComponent } from './pages/all-products/all-products.component';
import { MainLayoutComponent } from './components/layouts/main-layout/main-layout.component';
import { AdminComponent } from './pages/admin/admin.component';
import { LoginComponent } from './pages/login/login.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { FormulaComponent } from './pages/formula/formula.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'hombres', component: MenComponent },
      { path: 'mujeres', component: WomenComponent },
      { path: 'ninos', component: KidsComponent },
      { path: 'todos', component: AllProductsComponent },
      {
        path: 'admin',
        component: AdminComponent,
        canActivate: [authGuard],
      },
      {
        path: 'clientes',
        component: ClientesComponent,
        canActivate: [authGuard],
      },
      {
        path: 'formula',
        component: FormulaComponent,
        canActivate: [authGuard],
      },
      {
        path: 'producto/:id',
        loadComponent: () =>
          import('./pages/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent
          ),
      },
    ],
  },
];
