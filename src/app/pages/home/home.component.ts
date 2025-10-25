import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { Category } from '../../domain/interfaces/category.interface';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('slideAnimation', [
      transition(':increment', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':decrement', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit {
  categories: Category[] = [
    {
      name: 'Hombres',
      img: 'assets/images/categories/men.jpg',
      link: '/hombres'
    },
    {
      name: 'Mujeres',
      img: 'assets/images/categories/women.jpg',
      link: '/mujeres'
    },
    {
      name: 'Niños',
      img: 'assets/images/categories/kids.jpg',
      link: '/ninos'
    }
  ];

  trendingProducts: Product[] = [];
  saleProducts: Product[] = [];
  trendingGroups: Product[][] = [];
  salesGroups: Product[][] = [];
  currentTrendingIndex = 0;
  currentSalesIndex = 0;
  isLoading = true;

  constructor(private productService: ProductService) { }

  public async ngOnInit(): Promise<void> {
    try {
      this.trendingProducts = await this.productService.getTrendingProducts();
      this.saleProducts = await this.productService.getSaleProducts();
      this.trendingGroups = this.chunkArray(this.trendingProducts, 4);
      this.salesGroups = this.chunkArray(this.saleProducts, 4);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private chunkArray(array: Product[], size: number): Product[][] {
    return array.reduce((acc, _, i) =>
      (i % size ? acc : [...acc, array.slice(i, i + size)]), [] as Product[][]);
  }

  public nextTrending(): void {
    this.currentTrendingIndex = (this.currentTrendingIndex + 1) % this.trendingGroups.length;
  }

  public prevTrending(): void {
    this.currentTrendingIndex = this.currentTrendingIndex === 0
      ? this.trendingGroups.length - 1
      : this.currentTrendingIndex - 1;
  }

  public nextSales(): void {
    this.currentSalesIndex = (this.currentSalesIndex + 1) % this.salesGroups.length;
  }

  public prevSales(): void {
    this.currentSalesIndex = this.currentSalesIndex === 0
      ? this.salesGroups.length - 1
      : this.currentSalesIndex - 1;
  }
}
