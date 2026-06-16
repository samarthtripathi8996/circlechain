// src/context/BlockchainContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const BlockchainContext = createContext();

// Action types
const BLOCKCHAIN_ACTIONS = {
  SET_BALANCE: 'SET_BALANCE',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  balance: 0,
  transactions: [],
  loading: false,
  error: null
};

// Reducer
function blockchainReducer(state, action) {
  switch (action.type) {
    case BLOCKCHAIN_ACTIONS.SET_BALANCE:
      return { ...state, balance: action.payload };
    case BLOCKCHAIN_ACTIONS.ADD_TRANSACTION:
      return { 
        ...state, 
        transactions: [action.payload, ...state.transactions],
        balance: action.payload.type === 'payment' 
          ? state.balance - action.payload.amount 
          : state.balance + action.payload.amount
      };
    case BLOCKCHAIN_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case BLOCKCHAIN_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case BLOCKCHAIN_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
}

// Create axios instance with auth token
const createApiClient = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

// Provider component
export const BlockchainProvider = ({ children }) => {
  const [state, dispatch] = useReducer(blockchainReducer, initialState);
  const { user, token } = useAuth();
  const apiClient = createApiClient(token);

  // Load user's wallet data from backend
  useEffect(() => {
    if (user && token) {
      loadWalletData();
    }
  }, [user, token]);

  const loadWalletData = async () => {
    try {
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_LOADING, payload: true });
      
      // Load wallet summary from backend
      const response = await apiClient.get('/wallet/summary');
      const walletData = response.data;
      
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_BALANCE, payload: walletData.balance });
      
      // Transform backend transactions to frontend format
      const transformedTransactions = walletData.recent_transactions.map(tx => ({
        id: tx.id,
        type: tx.tx_type === 'payment' ? 'payment' : 'reward',
        amount: tx.amount,
        description: tx.details,
        date: tx.created_at,
        status: tx.status,
        productName: tx.tx_type === 'payment' ? tx.details.replace('Payment for ', '') : undefined
      }));
      
      // Set transactions directly instead of adding one by one
      state.transactions = transformedTransactions;
      
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_ERROR, payload: 'Failed to load wallet data' });
    }
  };

  // Payment function
  const payForProduct = async (productName, amount, productId = null) => {
    dispatch({ type: BLOCKCHAIN_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: BLOCKCHAIN_ACTIONS.CLEAR_ERROR });

    try {
      const response = await apiClient.post('/wallet/payment', {
        product_name: productName,
        amount: amount,
        product_id: productId
      });

      const backendResult = response.data;
      
      // Create frontend transaction format
      const transaction = {
        id: backendResult.transaction_id,
        type: 'payment',
        amount: amount,
        description: `Payment for ${productName}`,
        date: backendResult.timestamp,
        status: backendResult.status,
        productName
      };

      // Update balance
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_BALANCE, payload: backendResult.new_balance });
      dispatch({ type: BLOCKCHAIN_ACTIONS.ADD_TRANSACTION, payload: transaction });
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_LOADING, payload: false });

      return transaction;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Payment failed';
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Reward function
  const receiveReward = async (amount, reason = 'Reward') => {
    dispatch({ type: BLOCKCHAIN_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: BLOCKCHAIN_ACTIONS.CLEAR_ERROR });

    try {
      const response = await apiClient.post('/wallet/reward', {
        amount: amount,
        reason: reason
      });

      const backendResult = response.data;
      
      // Create frontend transaction format
      const transaction = {
        id: backendResult.transaction_id,
        type: 'reward',
        amount: amount,
        description: reason,
        date: backendResult.timestamp,
        status: backendResult.status
      };

      // Update balance
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_BALANCE, payload: backendResult.new_balance });
      dispatch({ type: BLOCKCHAIN_ACTIONS.ADD_TRANSACTION, payload: transaction });
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_LOADING, payload: false });

      return transaction;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Reward processing failed';
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Recycling reward function
  const receiveRecyclingReward = async (materialType, quantity) => {
    dispatch({ type: BLOCKCHAIN_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: BLOCKCHAIN_ACTIONS.CLEAR_ERROR });

    try {
      const response = await apiClient.post('/wallet/recycling-reward', {
        material_type: materialType,
        quantity: quantity
      });

      const backendResult = response.data;
      
      // Create frontend transaction format
      const transaction = {
        id: backendResult.transaction_id,
        type: 'reward',
        amount: backendResult.amount,
        description: backendResult.reason,
        date: backendResult.timestamp,
        status: backendResult.status
      };

      // Update balance
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_BALANCE, payload: backendResult.new_balance });
      dispatch({ type: BLOCKCHAIN_ACTIONS.ADD_TRANSACTION, payload: transaction });
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_LOADING, payload: false });

      return transaction;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Recycling reward failed';
      dispatch({ type: BLOCKCHAIN_ACTIONS.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Get transaction history with filtering
  const getTransactionHistory = (type = null) => {
    if (!type) return state.transactions;
    return state.transactions.filter(tx => tx.type === type);
  };

  // Calculate total earned through rewards
  const getTotalEarned = () => {
    return state.transactions
      .filter(tx => tx.type === 'reward')
      .reduce((total, tx) => total + tx.amount, 0);
  };

  // Calculate total spent
  const getTotalSpent = () => {
    return state.transactions
      .filter(tx => tx.type === 'payment')
      .reduce((total, tx) => total + tx.amount, 0);
  };

  const value = {
    // State
    balance: state.balance,
    transactions: state.transactions,
    loading: state.loading,
    error: state.error,
    
    // Actions
    payForProduct,
    receiveReward,
    receiveRecyclingReward,
    
    // Utility functions
    getTransactionHistory,
    getTotalEarned,
    getTotalSpent,
    
    // Clear error
    clearError: () => dispatch({ type: BLOCKCHAIN_ACTIONS.CLEAR_ERROR })
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

// Custom hook
export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};