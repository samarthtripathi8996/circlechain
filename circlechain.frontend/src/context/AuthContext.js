import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';

// Initial state for authentication
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types for authentication
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  SIGNUP_START: 'SIGNUP_START',
  SIGNUP_SUCCESS: 'SIGNUP_SUCCESS',
  SIGNUP_FAILURE: 'SIGNUP_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_USER: 'SET_USER',
};

// Reducer function to handle authentication state changes
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.SIGNUP_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.SIGNUP_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.SIGNUP_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.loading,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Create the authentication context
const AuthContext = createContext();

// AuthProvider component to wrap the app and provide authentication state
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication state by checking for stored token
   * and fetching current user data
   */
  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        // Try to get current user to validate token
        try {
          const user = await apiService.auth.getCurrentUser();
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: { user },
          });
          
          // Update stored user data
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          dispatch({
            type: AUTH_ACTIONS.SET_LOADING,
            payload: { loading: false },
          });
        }
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_LOADING,
          payload: { loading: false },
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_LOADING,
        payload: { loading: false },
      });
    }
  };

  /**
   * Login function
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login promise
   */
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Call login API
      const tokenResponse = await apiService.auth.login(email, password);
      
      // Store token
      localStorage.setItem('accessToken', tokenResponse.access_token);
      
      // Get user data
      const user = await apiService.auth.getCurrentUser();
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user,
          token: tokenResponse.access_token,
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please try again.';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });

      return { success: false, error: errorMessage };
    }
  };

  /**
   * Signup function
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.role - User role
   * @returns {Promise} Signup promise
   */
  const signup = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SIGNUP_START });

      // Call signup API
      const user = await apiService.auth.signup(userData);
      
      dispatch({
        type: AUTH_ACTIONS.SIGNUP_SUCCESS,
        payload: { user },
      });

      return { success: true, user };
    } catch (error) {
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors
          errorMessage = error.response.data.detail
            .map(err => err.msg)
            .join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      dispatch({
        type: AUTH_ACTIONS.SIGNUP_FAILURE,
        payload: { error: errorMessage },
      });

      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    // Clear stored data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  /**
   * Clear error function
   */
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    ...state,
    login,
    signup,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export context for potential direct use
export default AuthContext;