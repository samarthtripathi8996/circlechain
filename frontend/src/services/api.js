import axios from 'axios';

// Base URL for the API - adjust this to match your backend URL
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored authentication data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service methods
const apiService = {
  // Authentication endpoints
  auth: {
    /**
     * User login
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} API response with access token
     */
    login: async (email, password) => {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await apiClient.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    },

    /**
     * User signup
     * @param {Object} userData - User registration data
     * @param {string} userData.email - User email
     * @param {string} userData.password - User password
     * @param {string} userData.role - User role (producer, consumer, recycler, admin)
     * @returns {Promise} API response with user data
     */
    signup: async (userData) => {
      const response = await apiClient.post('/auth/signup', userData);
      return response.data;
    },

    /**
     * Get current user info
     * @returns {Promise} API response with user data
     */
    getCurrentUser: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },
  },

  // Producer endpoints
  producer: {
    /**
     * Get producer's products
     * @returns {Promise} API response with products array
     */
    getMyProducts: async () => {
      const response = await apiClient.get('/producer/products');
      return response.data;
    },

    /**
     * Create a new product
     * @param {Object} productData - Product data
     * @returns {Promise} API response with created product
     */
    createProduct: async (productData) => {
      const response = await apiClient.post('/producer/products', productData);
      return response.data;
    },

    /**
     * Update a product
     * @param {number} productId - Product ID
     * @param {Object} updateData - Product update data
     * @returns {Promise} API response with updated product
     */
    updateProduct: async (productId, updateData) => {
      const response = await apiClient.put(`/producer/products/${productId}`, updateData);
      return response.data;
    },

    /**
     * Delete a product
     * @param {number} productId - Product ID
     * @returns {Promise} API response
     */
    deleteProduct: async (productId) => {
      const response = await apiClient.delete(`/producer/products/${productId}`);
      return response.data;
    },

    /**
     * Get available raw materials
     * @returns {Promise} API response with raw materials array
     */
    getAvailableMaterials: async () => {
      const response = await apiClient.get('/producer/raw-materials');
      return response.data;
    },

    /**
     * Purchase raw material
     * @param {Object} purchaseData - Purchase data
     * @returns {Promise} API response with purchase details
     */
    purchaseRawMaterial: async (purchaseData) => {
      const response = await apiClient.post('/producer/raw-materials/purchase', purchaseData);
      return response.data;
    },
  },

  // Consumer endpoints
  consumer: {
    /**
     * Browse all available products
     * @returns {Promise} API response with products array
     */
    browseProducts: async () => {
      const response = await apiClient.get('/consumer/products');
      return response.data;
    },

    /**
     * Get consumer's orders
     * @returns {Promise} API response with orders array
     */
    getMyOrders: async () => {
      const response = await apiClient.get('/consumer/orders');
      return response.data;
    },

    /**
     * Create a new order
     * @param {Object} orderData - Order data
     * @returns {Promise} API response with created order
     */
    createOrder: async (orderData) => {
      const response = await apiClient.post('/consumer/orders', orderData);
      return response.data;
    },

    /**
     * Get consumer's recycle requests
     * @returns {Promise} API response with recycle requests array
     */
    getMyRecycleRequests: async () => {
      const response = await apiClient.get('/consumer/recycle-requests');
      return response.data;
    },

    /**
     * Submit a recycle request
     * @param {Object} requestData - Recycle request data
     * @returns {Promise} API response with created recycle request
     */
    submitRecycleRequest: async (requestData) => {
      const response = await apiClient.post('/consumer/recycle-requests', requestData);
      return response.data;
    },
  },

  // Recycler endpoints
  recycler: {
    /**
     * Get available recycle requests
     * @returns {Promise} API response with recycle requests array
     */
    getAvailableRecycleRequests: async () => {
      const response = await apiClient.get('/recycler/recycle-requests');
      return response.data;
    },

    /**
     * Accept a recycle request
     * @param {number} requestId - Recycle request ID
     * @returns {Promise} API response with updated recycle request
     */
    acceptRecycleRequest: async (requestId) => {
      const response = await apiClient.put(`/recycler/recycle-requests/${requestId}/accept`);
      return response.data;
    },

    /**
     * Complete a recycle request
     * @param {number} requestId - Recycle request ID
     * @returns {Promise} API response with updated recycle request
     */
    completeRecycleRequest: async (requestId) => {
      const response = await apiClient.put(`/recycler/recycle-requests/${requestId}/complete`);
      return response.data;
    },

    /**
     * Get recycler's accepted requests
     * @returns {Promise} API response with recycle requests array
     */
    getMyRecycleRequests: async () => {
      const response = await apiClient.get('/recycler/my-requests');
      return response.data;
    },

    /**
     * Get recycler's raw materials
     * @returns {Promise} API response with raw materials array
     */
    getMyRawMaterials: async () => {
      const response = await apiClient.get('/recycler/raw-materials');
      return response.data;
    },

    /**
     * Create raw material
     * @param {Object} materialData - Raw material data
     * @returns {Promise} API response with created raw material
     */
    createRawMaterial: async (materialData) => {
      const response = await apiClient.post('/recycler/raw-materials', materialData);
      return response.data;
    },
  },

  // Admin endpoints
  admin: {
    /**
     * Get impact summary
     * @returns {Promise} API response with impact data
     */
    getImpactSummary: async () => {
      const response = await apiClient.get('/admin/impact/summary');
      return response.data;
    },
  },

  // Health check
  health: {
    /**
     * Health check endpoint
     * @returns {Promise} API response
     */
    check: async () => {
      const response = await apiClient.get('/health');
      return response.data;
    },
  },
};

export default apiService;