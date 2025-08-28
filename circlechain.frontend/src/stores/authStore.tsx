import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, SignupCredentials } from '../types';
import { apiService } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      initializeAuth: () => {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, token });
          } catch (error) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        }
      },

      login: async (credentials: LoginCredentials) => {
  set({ isLoading: true, error: null });
  try {
    const response = await apiService.login(credentials);
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    set({ user: response.user, token: response.token, isLoading: false });
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || 'Login failed';
    set({ error: errorMessage, isLoading: false });
    throw new Error(errorMessage);
  }
},

signup: async (credentials: SignupCredentials) => {
  set({ isLoading: true, error: null });
  try {
    const response = await apiService.signup(credentials);
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    set({ user: response.user, token: response.token, isLoading: false });
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || 'Signup failed';
    set({ error: errorMessage, isLoading: false });
    throw new Error(errorMessage);
  }
},

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          set({ user: null, token: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);