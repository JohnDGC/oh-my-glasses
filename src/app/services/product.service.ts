import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { SupabaseProductService } from './supabase-product.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [];
  private productsLoaded = false;

  constructor(private supabaseProductService: SupabaseProductService) { }

  /**
   * Carga los productos de Supabase si no están cargados
   */
  private async ensureProductsLoaded(): Promise<void> {
    if (!this.productsLoaded) {
      this.products = await this.supabaseProductService.getAllProducts();
      this.productsLoaded = true;
    }
  }

  /**
   * Obtiene todos los productos
   */
  async getProducts(): Promise<Product[]> {
    await this.ensureProductsLoaded();
    return this.products;
  }

  /**
   * Obtiene un producto por ID
   */
  async getProductById(id: string): Promise<Product | undefined> {
    await this.ensureProductsLoaded();
    return this.products.find(p => p.id === id);
  }

  /**
   * Obtiene productos nuevos (isNew = true)
   */
  async getNewArrivals(): Promise<Product[]> {
    await this.ensureProductsLoaded();
    return this.products.filter(p => p.isNew);
  }

  /**
   * Obtiene productos destacados (isFeatured = true)
   * Limita a 8 productos para el Home
   */
  async getTrendingProducts(limit: number = 8): Promise<Product[]> {
    await this.ensureProductsLoaded();
    return this.products
      .filter(p => p.isFeatured && (p.showInHomeTrending !== false))
      .slice(0, limit);
  }

  /**
   * Obtiene productos en oferta (isOnSale = true)
   * Limita a 8 productos para el Home
   */
  async getSaleProducts(limit: number = 8): Promise<Product[]> {
    await this.ensureProductsLoaded();
    return this.products
      .filter(p => p.isOnSale && (p.showInHomeSales !== false))
      .slice(0, limit);
  }

  /**
   * Obtiene productos por categoría
   */
  async getProductsByCategory(category: Product['category']): Promise<Product[]> {
    await this.ensureProductsLoaded();
    return this.products.filter(p => p.category === category);
  }

  /**
   * Fuerza la recarga de productos desde Supabase
   */
  async refreshProducts(): Promise<void> {
    this.productsLoaded = false;
    await this.ensureProductsLoaded();
  }
}
