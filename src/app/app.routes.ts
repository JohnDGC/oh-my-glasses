import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MenComponent } from './pages/men/men.component';
import { WomenComponent } from './pages/women/women.component';
import { KidsComponent } from './pages/kids/kids.component';
import { AllProductsComponent } from './pages/all-products/all-products.component';
import { MainLayoutComponent } from './components/layouts/main-layout/main-layout.component';

export const routes: Routes = [
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
        path: 'producto/:id',
        loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      }
    ]
  }
];
