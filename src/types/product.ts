export interface Category {
  id: number;
  name: string;
  slug: string;
  image_path?: string | null;
  hover_image_path?: string | null;
  products_count?: number;
}

export interface ProductType {
  id: number;
  category_id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: number;
  image_path: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductSize {
  id: number;
  size: string;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  sale_price: string | null;
  addon_name: string | null;
  addon_price: string | null;
  category_id: number;
  product_type_id: number | null;
  stock: number;
  is_available: boolean;
  is_featured: boolean;
  is_new: boolean;
  category: Category;
  product_type?: ProductType | null;
  images: ProductImage[];
  sizes: ProductSize[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}