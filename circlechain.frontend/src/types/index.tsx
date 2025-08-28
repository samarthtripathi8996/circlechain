export interface User {
  id: number;
  email: string;
  role: 'producer' | 'consumer' | 'recycler' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  role: User['role'];
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: 'electronics' | 'textiles' | 'packaging' | 'furniture' | 'other';
  price: number;
  weight: number | null;
  status: 'available' | 'sold' | 'out_of_stock';
  impact_placeholder: number;
  producer_id: number;
  created_at: string;
}

export interface Order {
  id: number;
  quantity: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  consumer_id: number;
  product_id: number;
  created_at: string;
}

export interface RecycleRequest {
  id: number;
  item_description: string;
  weight: number | null;
  category: 'electronics' | 'textiles' | 'packaging' | 'furniture' | 'other';
  status: 'submitted' | 'accepted' | 'in_process' | 'completed' | 'rejected';
  consumer_id: number;
  recycler_id: number | null;
  created_at: string;
  processed_at: string | null;
}

export interface RawMaterial {
  id: number;
  name: string;
  material_type: 'plastic' | 'metal' | 'fabric' | 'glass' | 'paper' | 'composite';
  quantity: number;
  price_per_kg: number;
  status: 'available' | 'reserved' | 'sold';
  recycler_id: number;
  recycle_request_id: number | null;
  created_at: string;
}

export interface MaterialPurchase {
  id: number;
  quantity: number;
  total_price: number;
  producer_id: number;
  material_id: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  tx_type: string;
  user_id: number;
  related_id: number | null;
  amount: number | null;
  details: string | null;
  created_at: string;
}

export interface ImpactSummary {
  overall: {
    total_products: number;
    total_orders: number;
    total_recycle_requests: number;
    total_co2_impact: number;
  };
  by_category: Array<{
    category: string;
    total_impact: number;
    product_count: number;
  }>;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

// Request DTOs for creating/updating entities
export interface ProductCreateRequest {
  name: string;
  description?: string;
  category: 'electronics' | 'textiles' | 'packaging' | 'furniture' | 'other';
  price: number;
  weight?: number;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  category?: 'electronics' | 'textiles' | 'packaging' | 'furniture' | 'other';
  price?: number;
  weight?: number;
  status?: 'available' | 'sold' | 'out_of_stock';
}

export interface OrderCreateRequest {
  product_id: number;
  quantity: number;
}

export interface RecycleRequestCreateRequest {
  product_id: number;
  item_description: string;
  weight?: number;
  category: 'electronics' | 'textiles' | 'packaging' | 'furniture' | 'other';
}

export interface RawMaterialCreateRequest {
  name: string;
  material_type: 'plastic' | 'metal' | 'fabric' | 'glass' | 'paper' | 'composite';
  quantity: number;
  price_per_kg: number;
}

export interface MaterialPurchaseCreateRequest {
  material_id: number;
  quantity: number;
}