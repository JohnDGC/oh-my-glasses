import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

declare var bootstrap: any;

interface Category {
  name: string;
  img: string;
  link: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
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

  // Métodos para el carousel de trending
  nextTrending(): void {
    this.currentTrendingIndex = (this.currentTrendingIndex + 1) % this.trendingGroups.length;
  }

  prevTrending(): void {
    this.currentTrendingIndex = this.currentTrendingIndex === 0
      ? this.trendingGroups.length - 1
      : this.currentTrendingIndex - 1;
  }

  // Métodos para el carousel de sales
  nextSales(): void {
    this.currentSalesIndex = (this.currentSalesIndex + 1) % this.salesGroups.length;
  }

  prevSales(): void {
    this.currentSalesIndex = this.currentSalesIndex === 0
      ? this.salesGroups.length - 1
      : this.currentSalesIndex - 1;
  }

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    // Cargar productos
    this.trendingProducts = this.productService.getTrendingProducts();
    this.saleProducts = this.productService.getSaleProducts();

    // Agrupar productos para los carruseles (4 productos por slide)
    this.trendingGroups = this.chunkArray(this.trendingProducts, 4);
    this.salesGroups = this.chunkArray(this.saleProducts, 4);
  }

  private chunkArray(array: Product[], size: number): Product[][] {
    const chunked: Product[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }

  ngAfterViewInit(): void {
    // La inicialización ahora se maneja a través de los métodos de Angular
  }
}
