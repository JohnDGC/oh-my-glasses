export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: 'men' | 'women' | 'kids';
  style?: string;
  brand?: string;
  color?: string;
  material?: string;
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  showInHomeTrending?: boolean;
  showInHomeSales?: boolean;
  images: ProductImage[];
  features: ProductFeature[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id?: string;
  productId?: string;
  imageUrl: string;
  isMain: boolean;
  orderIndex: number;
}

export interface ProductFeature {
  id?: string;
  productId?: string;
  feature: string;
  orderIndex: number;
}
