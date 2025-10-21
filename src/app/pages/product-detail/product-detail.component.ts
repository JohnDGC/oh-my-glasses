import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);

  product: Product | undefined;

  ngOnInit() {
    // Scroll to top when component loads
    window.scrollTo({ top: 0, behavior: 'instant' });

    this.route.params.subscribe(params => {
      const productId = params['id'];
      this.product = this.productService.getProducts().find(p => p.id === parseInt(productId));

      if (!this.product) {
        this.router.navigate(['/']);
      }
    });
  }

  getCategoryPath(category: Product['category'] | undefined): string {
    const paths = {
      'men': 'hombres',
      'women': 'mujeres',
      'kids': 'ninos',
      'sunglasses': 'hombres'
    };
    return category ? paths[category as keyof typeof paths] : 'hombres';
  }

  getCategoryName(category: Product['category'] | undefined): string {
    const names = {
      'men': 'Hombres',
      'women': 'Mujeres',
      'kids': 'Niños',
      'sunglasses': 'Hombres'
    };
    return category ? names[category as keyof typeof names] : 'Hombres';
  }

  calculateDiscount(original?: number, discounted?: number): number {
    if (!original || !discounted) return 0;
    return Math.round(((original - discounted) / original) * 100);
  }
}
