import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styles: [`
    .product-card {
      transition: all 0.3s ease;
      background: #fff;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);

        .product-overlay {
          opacity: 1;
        }
      }
    }

    .product-image-container {
      position: relative;
      overflow: hidden;
      background: #f8f9fa;
      aspect-ratio: 3/4;
    }

    .product-img {
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .badge-container {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 2;
    }

    .product-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.8);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .product-title {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #2d3436;
    }

    .price-container {
      font-size: 1.1rem;
      color: #2d3436;
      }

    .product-img {
      // height: 200px;
      object-fit: cover;
    }
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;
}
