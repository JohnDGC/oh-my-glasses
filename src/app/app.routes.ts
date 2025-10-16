import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CategoryComponent } from './pages/categories/categories.component';
import { MainLayoutComponent } from './components/layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'hombres', component: CategoryComponent },
      { path: 'mujeres', component: CategoryComponent },
      { path: 'ninos', component: CategoryComponent },
      {
        path: 'producto/:id',
        loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      }
    ]
  }
  // { path: '', component: HomeComponent },
  // { path: 'hombres', component: CategoryComponent }, // <- aquí capturamos /hombres, /mujeres, etc.
  // { path: 'hombres', component: HombresComponent },
  // { path: 'mujeres', component: MujeresComponent },
  // { path: 'ninos', component: NinosComponent },
  // { path: 'lentes-de-sol', component: LentesSolComponent },
  // { path: 'accesorios', component: AccesoriosComponent }
];
