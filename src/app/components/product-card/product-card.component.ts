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
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      position: relative;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 16px;
        padding: 2px;
        background: linear-gradient(135deg, #21372B, #642719);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity 0.4s ease;
      }

      &:hover {
        transform: translateY(-10px);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);

        &::before {
          opacity: 1;
        }

        .product-img {
          transform: scale(1.1);
        }

        .product-overlay {
          opacity: 1;
        }
      }
    }

    .product-image-container {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #F7F2DA 0%, #ebe5c8 100%);
      aspect-ratio: 3/4;
    }

    .product-img {
      height: 100%;
      width: 100%;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .badge-container {
      position: absolute;
      top: 15px;
      left: 15px;
      z-index: 2;
      display: flex;
      gap: 8px;

      .badge {
        font-weight: 700;
        font-size: 0.75rem;
        padding: 6px 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        letter-spacing: 0.5px;
      }
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
      background: linear-gradient(135deg, rgba(33, 55, 43, 0.95), rgba(100, 39, 25, 0.95));
      opacity: 0;
      transition: opacity 0.4s ease;

      .btn {
        font-weight: 600;
        padding: 12px 32px;
        border-radius: 50px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
        border: 2px solid transparent;

        &:hover {
          transform: scale(1.05);
          border-color: #21372B;
        }
      }
    }

    .card-body {
      padding: 1.5rem;
    }

    .product-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #21372B;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .price-container {
      font-size: 1.25rem;
      color: #21372B;
      font-weight: 700;

      .text-muted {
        font-size: 0.9rem;
        font-weight: 500;
      }

      .text-danger {
        color: #642719 !important;
        font-size: 1.4rem;
      }
    }
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;
}
