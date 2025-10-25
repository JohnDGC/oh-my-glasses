import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Product, ProductImage, ProductFeature } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseProductService {
  constructor(private supabase: SupabaseService) { }

  // OBTENER PRODUCTOS
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        images:product_images(*),
        features:product_features(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return this.mapProducts(data);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        images:product_images(*),
        features:product_features(*)
      `)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }

    return this.mapProducts(data);
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        images:product_images(*),
        features:product_features(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return this.mapProduct(data);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        images:product_images(*),
        features:product_features(*)
      `)
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }

    return this.mapProducts(data);
  }

  async getNewProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        images:product_images(*),
        features:product_features(*)
      `)
      .eq('is_new', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error fetching new products:', error);
      return [];
    }

    return this.mapProducts(data);
  }

  async getProductsOnSale(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        images:product_images(*),
        features:product_features(*)
      `)
      .eq('is_on_sale', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error fetching products on sale:', error);
      return [];
    }

    return this.mapProducts(data);
  }

  // BÚSQUEDA Y FILTRADO
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        images:product_images(*),
        features:product_features(*)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching products:', error);
      return [];
    }

    return this.mapProducts(data);
  }

  async filterProducts(filters: {
    category?: string;
    style?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
  }): Promise<Product[]> {
    let query = this.supabase.client
      .from('products')
      .select(`
        *,
        images:product_images(*),
        features:product_features(*)
      `);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.style) {
      query = query.eq('style', filters.style);
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.brand) {
      query = query.eq('brand', filters.brand);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error filtering products:', error);
      return [];
    }

    return this.mapProducts(data);
  }

  // CREAR/ACTUALIZAR PRODUCTOS (Admin)
  async createProduct(product: Partial<Product>): Promise<Product | null> {
    // 1. Crear producto base
    const { data: productData, error: productError } = await this.supabase.client
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        discount: product.discount,
        category: product.category,
        style: product.style,
        brand: product.brand,
        color: product.color,
        material: product.material,
        stock: product.stock || 0,
        is_new: product.isNew || false,
        is_featured: product.isFeatured || false,
        is_on_sale: product.isOnSale || false,
        show_in_home_trending: product.showInHomeTrending !== false,
        show_in_home_sales: product.showInHomeSales !== false
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return null;
    }

    const productId = productData.id;

    // 2. Crear imágenes
    if (product.images && product.images.length > 0) {
      const imagesData = product.images.map((img, index) => ({
        product_id: productId,
        image_url: img.imageUrl,
        is_main: img.isMain,
        order_index: index
      }));

      await this.supabase.client
        .from('product_images')
        .insert(imagesData);
    }

    // 3. Crear características
    if (product.features && product.features.length > 0) {
      const featuresData = product.features.map((feat, index) => ({
        product_id: productId,
        feature: feat.feature,
        order_index: index
      }));

      await this.supabase.client
        .from('product_features')
        .insert(featuresData);
    }

    return this.getProductById(productId);
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
    // 1. Actualizar el producto principal
    const { error } = await this.supabase.client
      .from('products')
      .update({
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        discount: product.discount,
        category: product.category,
        style: product.style,
        brand: product.brand,
        color: product.color,
        material: product.material,
        stock: product.stock,
        is_new: product.isNew,
        is_featured: product.isFeatured,
        is_on_sale: product.isOnSale,
        show_in_home_trending: product.showInHomeTrending,
        show_in_home_sales: product.showInHomeSales
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating product:', error);
      return null;
    }

    // 2. Actualizar imágenes (eliminar y recrear)
    if (product.images !== undefined) {
      // Eliminar imágenes existentes
      await this.supabase.client
        .from('product_images')
        .delete()
        .eq('product_id', id);

      // Insertar nuevas imágenes
      if (product.images && product.images.length > 0) {
        const imagesData = product.images.map((img, index) => ({
          product_id: id,
          image_url: img.imageUrl,
          is_main: img.isMain,
          order_index: index
        }));

        await this.supabase.client
          .from('product_images')
          .insert(imagesData);
      }
    }

    // 3. Actualizar características (eliminar y recrear)
    if (product.features !== undefined) {
      // Eliminar features existentes
      await this.supabase.client
        .from('product_features')
        .delete()
        .eq('product_id', id);

      // Insertar nuevas features
      if (product.features && product.features.length > 0) {
        const featuresData = product.features.map((feat, index) => ({
          product_id: id,
          feature: feat.feature,
          order_index: index
        }));

        await this.supabase.client
          .from('product_features')
          .insert(featuresData);
      }
    }

    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  }

  // HELPERS
  private mapProducts(data: any[]): Product[] {
    return data.map(item => this.mapProduct(item));
  }

  private mapProduct(data: any): Product {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      originalPrice: data.original_price ? parseFloat(data.original_price) : undefined,
      discount: data.discount || 0,
      category: data.category,
      style: data.style,
      brand: data.brand,
      color: data.color,
      material: data.material,
      stock: data.stock,
      isNew: data.is_new,
      isFeatured: data.is_featured,
      isOnSale: data.is_on_sale,
      showInHomeTrending: data.show_in_home_trending !== false,
      showInHomeSales: data.show_in_home_sales !== false,
      images: (data.images || []).map((img: any) => ({
        id: img.id,
        productId: img.product_id,
        imageUrl: img.image_url,
        isMain: img.is_main,
        orderIndex: img.order_index
      })),
      features: (data.features || []).map((feat: any) => ({
        id: feat.id,
        productId: feat.product_id,
        feature: feat.feature,
        orderIndex: feat.order_index
      })),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
