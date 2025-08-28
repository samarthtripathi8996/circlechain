import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { 
  AuthResponse, 
  LoginCredentials, 
  SignupCredentials, 
  User, 
  Product, 
  Order, 
  RecycleRequest, 
  RawMaterial,
  MaterialPurchase,
  ImpactSummary,
  Transaction
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

 // Auth endpoints - UPDATED TO MATCH YOUR FASTAPI BACKEND
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Convert to OAuth2PasswordRequestForm format that FastAPI expects
  const formData = new URLSearchParams();
  formData.append('username', credentials.email);
  formData.append('password', credentials.password);
  
  const response = await this.axiosInstance.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  // Store the token
  localStorage.setItem('authToken', response.data.access_token);
  
  // Get user info after login
  const user = await this.getCurrentUser();
  localStorage.setItem('user', JSON.stringify(user));
  
  return {
    token: response.data.access_token,
    refreshToken: response.data.access_token, // Your backend uses access tokens only
    user
  };
}

async signup(credentials: SignupCredentials): Promise<AuthResponse> {
  await this.axiosInstance.post('/auth/signup', credentials);
  
  // Auto login after signup using the same credentials
  return this.login({
    email: credentials.email,
    password: credentials.password
  });
}

async getCurrentUser(): Promise<User> {
  const response = await this.axiosInstance.get('/auth/me');
  return response.data;
}

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Consumer endpoints
  async getProducts(): Promise<Product[]> {
    const response = await this.axiosInstance.get('/consumer/products');
    return response.data;
  }

  async purchaseProduct(productId: number, quantity: number): Promise<Order> {
    const response = await this.axiosInstance.post('/consumer/orders', {
      product_id: productId,
      quantity
    });
    return response.data;
  }

  async getMyOrders(): Promise<Order[]> {
    const response = await this.axiosInstance.get('/consumer/orders');
    return response.data;
  }

  async submitRecycleRequest(productId: number, itemDescription: string, notes?: string): Promise<RecycleRequest> {
    const response = await this.axiosInstance.post('/consumer/recycle-requests', {
      product_id: productId,
      item_description: itemDescription,
      notes
    });
    return response.data;
  }

  async getMyRecycleRequests(): Promise<RecycleRequest[]> {
    const response = await this.axiosInstance.get('/consumer/recycle-requests');
    return response.data;
  }

  // Producer endpoints
  async createProduct(productData: any): Promise<Product> {
    const response = await this.axiosInstance.post('/producer/products', productData);
    return response.data;
  }

  async getMyProducts(): Promise<Product[]> {
    const response = await this.axiosInstance.get('/producer/products');
    return response.data;
  }

  async updateProduct(productId: number, productData: any): Promise<Product> {
    const response = await this.axiosInstance.put(`/producer/products/${productId}`, productData);
    return response.data;
  }

  async deleteProduct(productId: number): Promise<void> {
    await this.axiosInstance.delete(`/producer/products/${productId}`);
  }

  async getAvailableMaterials(): Promise<RawMaterial[]> {
    const response = await this.axiosInstance.get('/producer/raw-materials');
    return response.data;
  }

  async purchaseMaterial(materialId: number, quantity: number): Promise<MaterialPurchase> {
    const response = await this.axiosInstance.post('/producer/raw-materials/purchase', {
      material_id: materialId,
      quantity
    });
    return response.data;
  }

  // Recycler endpoints
  async getAvailableRecycleRequests(): Promise<RecycleRequest[]> {
    const response = await this.axiosInstance.get('/recycler/recycle-requests');
    return response.data;
  }

  async acceptRecycleRequest(requestId: number): Promise<RecycleRequest> {
    const response = await this.axiosInstance.put(`/recycler/recycle-requests/${requestId}/accept`);
    return response.data;
  }

  async completeRecycleRequest(requestId: number): Promise<RecycleRequest> {
    const response = await this.axiosInstance.put(`/recycler/recycle-requests/${requestId}/complete`);
    return response.data;
  }

  async getMyRecycleRequestsRecycler(): Promise<RecycleRequest[]> {
    const response = await this.axiosInstance.get('/recycler/my-requests');
    return response.data;
  }

  async createRawMaterial(materialData: any): Promise<RawMaterial> {
    const response = await this.axiosInstance.post('/recycler/raw-materials', materialData);
    return response.data;
  }

  async getMyRawMaterials(): Promise<RawMaterial[]> {
    const response = await this.axiosInstance.get('/recycler/raw-materials');
    return response.data;
  }

  // Admin endpoints
  async getImpactSummary(): Promise<ImpactSummary> {
    const response = await this.axiosInstance.get('/admin/impact/summary');
    return response.data;
  }

  async getTransactions(): Promise<Transaction[]> {
    // This endpoint might need to be implemented in your backend
    const response = await this.axiosInstance.get('/admin/transactions');
    return response.data;
  }
}

export const apiService = new ApiService();