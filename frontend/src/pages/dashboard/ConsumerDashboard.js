import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useBlockchain } from '../../context/BlockchainContext';
import { useBlockchainNotifications } from '../../hooks/useBlockchainNotifications';
import WalletBalance from '../../components/wallet/WalletBalance';
import { TransactionHistory, PaymentModal } from '../../components/wallet/WalletBalance';
import apiService from '../../services/api';

const ConsumerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [recycleRequests, setRecycleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('products');
  const [showRecycleModal, setShowRecycleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();

  // Blockchain hooks
  const { balance, payForProduct, receiveReward } = useBlockchain();
  const { 
    notifyPayment, 
    notifyReward, 
    notifyInsufficientFunds 
  } = useBlockchainNotifications();

  // Navigation items for consumer
  const navigationItems = [
    {
      name: 'Browse Products',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v-1a4 4 0 118 0v1m-4 0h.01M12 11h.01M8 11h.01" />
        </svg>
      ),
    },
    {
      name: 'My Orders',
      path: '/dashboard/orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      name: 'Recycle Requests',
      path: '/dashboard/recycle',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      name: 'Wallet',
      path: '/dashboard/wallet',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [productsData, ordersData, recycleData] = await Promise.all([
        apiService.consumer.browseProducts(),
        apiService.consumer.getMyOrders(),
        apiService.consumer.getMyRecycleRequests(),
      ]);
      
      setProducts(productsData);
      setOrders(ordersData);
      setRecycleRequests(recycleData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced order handling with blockchain payment
  const handlePurchaseProduct = (product) => {
    // Convert price to ECT tokens (1 USD = 100 ECT for demo)
    const tokenPrice = Math.floor(product.price * 100);
    const productWithTokens = { ...product, price: tokenPrice, originalPrice: product.price };
    
    if (balance < tokenPrice) {
      notifyInsufficientFunds(tokenPrice, balance);
      return;
    }

    setSelectedProduct(productWithTokens);
    setShowPaymentModal(true);
  };

  const confirmPurchase = async (transaction) => {
    try {
      // Create order in backend with blockchain transaction reference
      const orderData = {
        product_id: selectedProduct.id,
        quantity: orderQuantity,
        total_price: selectedProduct.originalPrice, // Store original USD price in backend
        blockchain_transaction_id: transaction.id
      };

      await apiService.consumer.createOrder(orderData);
      
      // Refresh orders data
      const ordersData = await apiService.consumer.getMyOrders();
      setOrders(ordersData);
      
      // Notify successful payment
      notifyPayment({
        ...transaction,
        productName: selectedProduct.name
      });

      // Give eco-bonus reward for sustainable products
      if (selectedProduct.impact_placeholder === 'High' || selectedProduct.price > 500) {
        const bonusReward = Math.floor(selectedProduct.price * 0.1); // 10% cashback in ECT
        setTimeout(async () => {
          const rewardTransaction = await receiveReward(
            bonusReward, 
            `Eco-bonus for purchasing ${selectedProduct.name}`
          );
          notifyReward(rewardTransaction);
        }, 2000);
      }

      setSelectedProduct(null);
      setOrderQuantity(1);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  // Enhanced recycle request with immediate rewards
  const handleRecycleRequest = async (requestData) => {
    try {
      const response = await apiService.consumer.createRecycleRequest(requestData);
      
      // Refresh recycle requests
      const recycleData = await apiService.consumer.getMyRecycleRequests();
      setRecycleRequests(recycleData);
      
      // Give immediate reward for recycling request
      const baseReward = 25;
      const rewardTransaction = await receiveReward(
        baseReward,
        `Recycling request submitted: ${requestData.item_description}`
      );
      
      notifyReward(rewardTransaction);
      setShowRecycleModal(false);
      
    } catch (error) {
      console.error('Error submitting recycle request:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      electronics: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      textiles: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
        </svg>
      ),
      packaging: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      furniture: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      other: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    };
    return icons[category] || icons.other;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-warning-100 text-warning-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-success-100 text-success-800',
      cancelled: 'bg-error-100 text-error-800',
      submitted: 'bg-blue-100 text-blue-800',
      accepted: 'bg-warning-100 text-warning-800',
      in_process: 'bg-purple-100 text-purple-800',
      completed: 'bg-success-100 text-success-800',
      rejected: 'bg-error-100 text-error-800',
    };
    return colors[status] || 'bg-secondary-100 text-secondary-800';
  };

  if (loading) {
    return (
      <DashboardLayout title="Consumer Dashboard" navigationItems={navigationItems}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Consumer Dashboard" navigationItems={navigationItems}>
      <div className="space-y-6">
        {/* Wallet Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WalletBalance />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Rewards</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowRecycleModal(true)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Recycle Request
              </button>
              <div className="text-center text-sm text-gray-500">
                Earn 25+ ECT for each recycling request!
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v-1a4 4 0 118 0v1m-4 0h.01M12 11h.01M8 11h.01" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Available Products</p>
                <p className="text-2xl font-semibold text-secondary-900">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">My Orders</p>
                <p className="text-2xl font-semibold text-secondary-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Recycle Requests</p>
                <p className="text-2xl font-semibold text-secondary-900">{recycleRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">ECT Balance</p>
                <p className="text-2xl font-semibold text-secondary-900">{balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-secondary-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {['products', 'orders', 'recycle', 'wallet'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Products Tab - Enhanced with ECT pricing */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-secondary-900">Available Products</h3>
                  <button onClick={loadDashboardData} className="btn-secondary">
                    Refresh
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-secondary-900">No products available</h3>
                    <p className="mt-1 text-sm text-secondary-500">Check back later for new eco-friendly products.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                      const tokenPrice = Math.floor(product.price * 100);
                      return (
                        <div key={product.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 text-primary-600">
                                {getCategoryIcon(product.category)}
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-secondary-900">{product.name}</h4>
                                <p className="text-sm text-secondary-500">{product.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-semibold text-green-600">{tokenPrice} ECT</span>
                              <p className="text-xs text-gray-500">${product.price}</p>
                            </div>
                          </div>
                          
                          {product.description && (
                            <p className="mt-3 text-sm text-secondary-600">{product.description}</p>
                          )}
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center text-sm text-secondary-500">
                              {product.weight && (
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                  </svg>
                                  {product.weight}kg
                                </span>
                              )}
                              <span className="ml-4 text-xs bg-success-100 text-success-800 px-2 py-1 rounded-full">
                                Impact: {product.impact_placeholder}
                              </span>
                              {product.impact_placeholder === 'High' && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  Eco-Bonus!
                                </span>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handlePurchaseProduct(product)}
                              className={`btn-primary text-sm py-2 px-4 ${
                                balance < tokenPrice ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={balance < tokenPrice}
                            >
                              {balance >= tokenPrice ? 'Buy with ECT' : 'Insufficient Balance'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900">My Orders</h3>

                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-secondary-900">No orders yet</h3>
                    <p className="mt-1 text-sm text-secondary-500">Start browsing products to make your first order!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white border rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-secondary-900">
                                {order.product?.name || 'Product'}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm text-secondary-500">
                              <span>Quantity: {order.quantity}</span>
                              <span className="mx-2">•</span>
                              <span>Total: ${order.total_price}</span>
                              <span className="mx-2">•</span>
                              <span>Ordered: {new Date(order.created_at).toLocaleDateString()}</span>
                              {order.blockchain_transaction_id && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="text-green-600">Paid with ECT</span>
                                </>
                              )}
                            </div>
                            
                            {order.product?.description && (
                              <p className="mt-2 text-sm text-secondary-600">{order.product.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recycle Tab */}
            {activeTab === 'recycle' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-secondary-900">Recycle Requests</h3>
                  <button
                    onClick={() => setShowRecycleModal(true)}
                    className="btn-primary"
                  >
                    New Request
                  </button>
                </div>

                {recycleRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-secondary-900">No recycle requests</h3>
                    <p className="mt-1 text-sm text-secondary-500">Submit items for recycling to earn ECT tokens!</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowRecycleModal(true)}
                        className="btn-primary"
                      >
                        Submit First Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recycleRequests.map((request) => (
                      <div key={request.id} className="bg-white border rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-secondary-900">
                                {request.item_description}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm text-secondary-500">
                              <span className="flex items-center">
                                {getCategoryIcon(request.category)}
                                <span className="ml-1">{request.category}</span>
                              </span>
                              {request.weight && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{request.weight}kg</span>
                                </>
                              )}
                              <span className="mx-2">•</span>
                              <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            {request.processed_at && (
                              <p className="mt-2 text-sm text-secondary-500">
                                Processed: {new Date(request.processed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wallet Tab - New blockchain-specific tab */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <WalletBalance showDetails={true} />
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Earning Opportunities</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800">Recycling Rewards</h4>
                        <p className="text-sm text-green-600 mt-1">Earn 25+ ECT for each recycling request</p>
                        <button
                          onClick={() => setShowRecycleModal(true)}
                          className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Start Recycling
                        </button>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800">Eco-Bonus Purchases</h4>
                        <p className="text-sm text-blue-600 mt-1">Get 10% cashback on sustainable products</p>
                        <button
                          onClick={() => setActiveTab('products')}
                          className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Browse Products
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <TransactionHistory limit={15} showTitle={true} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onConfirm={confirmPurchase}
      />

      {/* Recycle Request Modal */}
      <RecycleRequestModal
        isOpen={showRecycleModal}
        onClose={() => setShowRecycleModal(false)}
        onSubmit={handleRecycleRequest}
      />
    </DashboardLayout>
  );
};

// Enhanced Recycle Request Modal Component
const RecycleRequestModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    item_description: '',
    category: 'electronics',
    weight: '',
    condition: 'good'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      weight: formData.weight ? parseFloat(formData.weight) : null
    });
    setFormData({
      item_description: '',
      category: 'electronics',
      weight: '',
      condition: 'good'
    });
  };

  const categoryOptions = [
    { value: 'electronics', label: 'Electronics', reward: '25-50 ECT' },
    { value: 'textiles', label: 'Textiles', reward: '15-30 ECT' },
    { value: 'packaging', label: 'Packaging', reward: '10-20 ECT' },
    { value: 'furniture', label: 'Furniture', reward: '30-75 ECT' },
    { value: 'other', label: 'Other', reward: '20-40 ECT' }
  ];

  return (
    <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-secondary-900">Submit Recycle Request</h3>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Item Description
            </label>
            <input
              type="text"
              required
              value={formData.item_description}
              onChange={(e) => setFormData(prev => ({ ...prev, item_description: e.target.value }))}
              className="input-field"
              placeholder="Describe the item you want to recycle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="input-field"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.reward}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Weight (kg) - Optional
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
              className="input-field"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Condition
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
              className="input-field"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              Earn 25 ECT immediately for submitting this request, plus additional rewards when processed!
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsumerDashboard;