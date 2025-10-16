import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    // Gafas de Sol
    {
      id: 1,
      name: 'Classic Ray-Ban Aviator',
      price: 159.99,
      discountPrice: 129.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'sunglasses',
      isTrending: true,
      isOnSale: true,
      description: 'Clásicos lentes aviador con protección UV400'
    },
    {
      id: 2,
      name: 'Wayfarer Clásico',
      price: 149.99,
      discountPrice: 119.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'sunglasses',
      isTrending: true,
      description: 'Diseño atemporal que nunca pasa de moda'
    },
    {
      id: 3,
      name: 'Round Metal Polarizado',
      price: 179.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'sunglasses',
      isNew: true,
      isTrending: true,
      description: 'Lentes redondos con protección polarizada'
    },
    // Lentes para Hombre
    {
      id: 4,
      name: 'Modern Square Frame',
      price: 89.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'men',
      isNew: true,
      description: 'Armazón cuadrado moderno ideal para rostros ovalados'
    },
    {
      id: 5,
      name: 'Executive Metal Frame',
      price: 129.99,
      discountPrice: 99.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'men',
      isOnSale: true,
      description: 'Armazón metálico elegante para el ejecutivo moderno'
    },
    {
      id: 6,
      name: 'Clubmaster Classic',
      price: 139.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'men',
      isTrending: true,
      description: 'Diseño retro con un toque contemporáneo'
    },
    // Lentes para Mujer
    {
      id: 7,
      name: 'Cat Eye Crystal',
      price: 119.99,
      discountPrice: 89.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'women',
      isOnSale: true,
      isTrending: true,
      description: 'Sofisticado diseño cat-eye con detalles en cristal'
    },
    {
      id: 8,
      name: 'Oval Rose Gold',
      price: 149.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'women',
      isNew: true,
      description: 'Marco ovalado en oro rosa, tendencia actual'
    },
    {
      id: 9,
      name: 'Butterfly Frame',
      price: 134.99,
      discountPrice: 99.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'women',
      isOnSale: true,
      description: 'Elegante diseño mariposa con detalles delicados'
    },
    // Lentes para Niños
    {
      id: 10,
      name: 'Kids Sport Flex',
      price: 79.99,
      discountPrice: 59.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'kids',
      isOnSale: true,
      description: 'Armazón deportivo flexible y resistente'
    },
    {
      id: 11,
      name: 'Junior Round',
      price: 69.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'kids',
      isNew: true,
      description: 'Diseño redondo moderno para los más pequeños'
    },
    {
      id: 12,
      name: 'Kids Rectangle Safe',
      price: 89.99,
      imageUrl: 'assets/images/products/Classic-Ray-Ban-Aviator.webp',
      category: 'kids',
      isTrending: true,
      description: 'Marco rectangular con protección extra'
    }
  ];

  getProducts(): Product[] {
    return this.products;
  }

  getNewArrivals(): Product[] {
    return this.products.filter(p => p.isNew);
  }

  getTrendingProducts(): Product[] {
    return this.products.filter(p => p.isTrending);
  }

  getSaleProducts(): Product[] {
    return this.products.filter(p => p.isOnSale);
  }

  getProductsByCategory(category: Product['category']): Product[] {
    return this.products.filter(p => p.category === category);
  }
}
