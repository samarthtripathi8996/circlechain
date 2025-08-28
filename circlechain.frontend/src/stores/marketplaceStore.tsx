import { create } from 'zustand';
import { Product, Order, RecycleRequest, RawMaterial } from '../types';
import { apiService } from '../services/api';

interface MarketplaceState {
  products: Product[];
  orders: Order[];
  recycleRequests: RecycleRequest[];
  rawMaterials: RawMaterial[];
  isLoading: boolean;
  error: string | null;

  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchRecycleRequests: () => Promise<void>;
  fetchRawMaterials: () => Promise<void>;

  purchaseProduct: (productId: number, quantity: number) => Promise<void>;
  submitRecycleRequest: (productId: number, notes: string) => Promise<void>;
  updateRecycleRequest: (requestId: number, status: string) => Promise<void>;
  purchaseRawMaterial: (materialId: number, quantity: number) => Promise<void>;
  createProduct: (productData: any) => Promise<void>;

  clearError: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  products: [],
  orders: [],
  recycleRequests: [],
  rawMaterials: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await apiService.getProducts();
      set({ products, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch products';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      // Example (uncomment if API ready):
      // const orders = await apiService.getOrders();
      // set({ orders, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch orders';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchRecycleRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const recycleRequests = await apiService.getMyRecycleRequests();
      set({ recycleRequests, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch recycle requests';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchRawMaterials: async () => {
    set({ isLoading: true, error: null });
    try {
      const rawMaterials = await apiService.getMyRawMaterials();
      set({ rawMaterials, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch raw materials';
      set({ error: errorMessage, isLoading: false });
    }
  },

  purchaseProduct: async (productId: number, quantity: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.purchaseProduct(productId, quantity);
      await get().fetchProducts();
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Purchase failed';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  submitRecycleRequest: async (productId: number, notes: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.submitRecycleRequest(productId, notes);
      await get().fetchRecycleRequests();
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit recycle request';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateRecycleRequest: async (requestId: number, status: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.submitRecycleRequest(requestId, status);
      await get().fetchRecycleRequests();
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update recycle request';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  purchaseRawMaterial: async (materialId: number, quantity: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.purchaseMaterial(materialId, quantity);
      await get().fetchRawMaterials();
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Purchase failed';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },// In src/stores/marketplaceStore.ts
createProduct: async (productData: any) => {
  set({ isLoading: true, error: null });
  try {
    await apiService.createProduct(productData);
    // Refresh products after creation
    await get().fetchProducts();
    set({ isLoading: false });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Failed to create product';
    set({ error: errorMessage, isLoading: false });
    throw new Error(errorMessage);
  }
},

  clearError: () => set({ error: null }),
}));
