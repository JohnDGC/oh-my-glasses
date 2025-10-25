import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { PaymentService } from '../../services/payment.service';
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
  private paymentService = inject(PaymentService);
  product: Product | undefined;
  currentImageUrl: string = '';

  async ngOnInit() {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);

    this.route.params.subscribe(async params => {
      const productId = params['id'];
      try {
        this.product = await this.productService.getProductById(productId);

        if (!this.product)
          this.router.navigate(['/']);
        else
          this.currentImageUrl = this.getMainImage();

      } catch (error) {
        console.error('Error loading product:', error);
        this.router.navigate(['/']);
      }
    });
  }

  getMainImage(): string {
    if (!this.product || !this.product.images || this.product.images.length === 0)
      return 'https://via.placeholder.com/600x400?text=No+Image';

    const mainImage = this.product.images.find(img => img.isMain);
    return mainImage ? mainImage.imageUrl : this.product.images[0].imageUrl;
  }

  selectImage(imageUrl: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.currentImageUrl = imageUrl;
  }

  getFeatures(): string[] {
    if (!this.product || !this.product.features || this.product.features.length === 0)
      return [];

    return this.product.features.map(f => f.feature);
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

  /**
   * Procesa el pago del producto con Wompi
   */
  processPayment(): void {
    if (!this.product) {
      alert('No se pudo cargar la información del producto');
      return;
    }

    // Abrir el widget de Wompi
    // this.paymentService.openCheckout({
    //   amountInCents: this.paymentService.convertToCents(this.product.price),
    //   reference: this.paymentService.generateReference(),
    //   customerData: {
    //     email: 'cliente@ejemplo.com', // TODO: Obtener del usuario logueado
    //     fullName: 'Cliente Ejemplo', // TODO: Obtener del usuario logueado
    //     phoneNumber: '3001234567', // TODO: Obtener del usuario logueado (sin prefijo +57)
    //     phoneNumberPrefix: '+57' // Prefijo para Colombia
    //   }
    // });
  }
}
