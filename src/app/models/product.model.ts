export interface Product {
  id: number;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  category: 'men' | 'women' | 'kids' | 'sunglasses' | 'accessories';
  isNew?: boolean;
  isTrending?: boolean;
  isOnSale?: boolean;
  description?: string;
}
