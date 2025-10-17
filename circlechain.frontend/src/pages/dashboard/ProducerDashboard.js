import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useBlockchain } from '../../context/BlockchainContext';
import { useBlockchainNotifications } from '../../hooks/useBlockchainNotifications';
import WalletBalance from '../../components/wallet/WalletBalance';
import { TransactionHistory } from '../../components/wallet/WalletBalance';
import apiService from '../../services/api';

const ProducerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'electronics',
    price: '',
    weight: '',
    sustainabilityScore: 75
  });
  const navigate = useNavigate();

  // Blockchain hooks
  const { balance, payForProduct, receiveReward } = useBlockchain();
  const { 
    notifyPayment, 
    notifyReward, 
    notifyInsufficientFunds 
  } = useBlockchainNotifications();

  // Navigation items for producer
  const navigationItems = [
    {
      name: 'My Products',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      name: 'Raw Materials',
      path: '/dashboard/materials',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Analytics',
      path: '/dashboard/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

  const categoryOptions = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'textiles', label: 'Textiles' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [productsData, materialsData] = await Promise.all([
        apiService.producer.getMyProducts(),
        apiService.producer.getAvailableMaterials(),
      ]);
      
      setProducts(productsData);
      setRawMaterials(materialsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced product creation with sustainability rewards
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        weight: productForm.weight ? parseFloat(productForm.weight) : null,
      };

      await apiService.producer.createProduct(productData);
      
      // Refresh products
      const productsData = await apiService.producer.getMyProducts();
      setProducts(productsData);
      
      // Give sustainability reward for high-scoring products
      if (productForm.sustainabilityScore >= 80) {
        const sustainabilityReward = Math.floor(productForm.sustainabilityScore * 2); // Up to 200 ECT
        setTimeout(async () => {
          const rewardTransaction = await receiveReward(
            sustainabilityReward,
            `Sustainability bonus for creating ${productForm.name}`
          );
          notifyReward(rewardTransaction);
        }, 1500);
      }
      
      // Reset form and close modal
      setProductForm({
        name: '',
        description: '',
        category: 'electronics',
        price: '',
        weight: '',
        sustainabilityScore: 75
      });
      setShowProductModal(false);
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  // Enhanced material purchase with blockchain payment
  const handlePurchaseMaterial = async () => {
    const totalCost = Math.floor(selectedMaterial.price_per_kg * purchaseQuantity * 10); // Convert to ECT tokens
    
    if (balance < totalCost) {
      notifyInsufficientFunds(totalCost, balance);
      return;
    }

    try {
      // Make blockchain payment
      const transaction = await payForProduct(
        `${selectedMaterial.name} (${purchaseQuantity}kg)`,
        totalCost
      );

      // Create purchase record in backend
      const purchaseData = {
        material_id: selectedMaterial.id,
        quantity: purchaseQuantity,
        total_price: selectedMaterial.price_per_kg * purchaseQuantity, // Store original USD price
        blockchain_transaction_id: transaction.id
      };

      await apiService.producer.purchaseRawMaterial(purchaseData);
      
      // Refresh materials
      const materialsData = await apiService.producer.getAvailableMaterials();
      setRawMaterials(materialsData);
      
      notifyPayment({
        ...transaction,
        productName: `${selectedMaterial.name} raw materials`
      });

      // Reset and close modal
      setSelectedMaterial(null);
      setPurchaseQuantity(1);
      setShowMaterialModal(false);
    } catch (error) {
      console.error('Error purchasing material:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiService.producer.deleteProduct(productId);
        const productsData = await apiService.producer.getMyProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
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

  const getMaterialTypeIcon = (materialType) => {
    const icons = {
      plastic: '♻️',
      metal: '⚡',
      fabric: '🧵',
      glass: '🥤',
      paper: '📄',
      composite: '🔧',
    };
    return icons[materialType] || '📦';
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-success-100 text-success-800',
      sold: 'bg-secondary-100 text-secondary-800',
      out_of_stock: 'bg-error-100 text-error-800',
      reserved: 'bg-warning-100 text-warning-800',
    };
    return colors[status] || 'bg-secondary-100 text-secondary-800';
  };

  if (loading) {
    return (
      <DashboardLayout title="Producer Dashboard" navigationItems={navigationItems}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Producer Dashboard" navigationItems={navigationItems}>
      <div className="space-y-6">
        {/* Wallet Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WalletBalance />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Producer Rewards</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800">Sustainability Bonus</h4>
                <p className="text-xs text-blue-600">Up to 200 ECT for high-impact products</p>
              </div>
              <button
                onClick={() => setShowProductModal(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Product
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">My Products</p>
                <p className="text-2xl font-semibold text-secondary-900">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Available Materials</p>
                <p className="text-2xl font-semibold text-secondary-900">{rawMaterials.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-secondary-900">
                  ${products.reduce((sum, product) => sum + product.price, 0).toFixed(2)}
                </p>
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
              {['products', 'materials', 'wallet'].map((tab) => (
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
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-secondary-900">My Products</h3>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="btn-primary"
                  >
                    Create Product
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-secondary-900">No products yet</h3>
                    <p className="mt-1 text-sm text-secondary-500">Create your first sustainable product to start earning ECT tokens.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowProductModal(true)}
                        className="btn-primary"
                      >
                        Create Product
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
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
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <span className="text-lg font-semibold text-green-600">{Math.floor(product.price * 100)} ECT</span>
                              <p className="text-xs text-gray-500">${product.price}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-error-400 hover:text-error-600 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {product.description && (
                          <p className="mt-3 text-sm text-secondary-600">{product.description}</p>
                        )}
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                              {product.status?.charAt(0).toUpperCase() + product.status?.slice(1) || 'Available'}
                            </span>
                            {product.weight && (
                              <span className="text-sm text-secondary-500">
                                {product.weight}kg
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-success-100 text-success-800 px-2 py-1 rounded-full">
                              Impact: {product.impact_placeholder || 'High'}
                            </span>
                            {(product.sustainabilityScore || 85) >= 80 && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Bonus Eligible
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Materials Tab - Enhanced with ECT pricing */}
            {activeTab === 'materials' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-secondary-900">Available Raw Materials</h3>
                  <button
                    onClick={loadDashboardData}
                    className="btn-secondary"
                  >
                    Refresh
                  </button>
                </div>

                {rawMaterials.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-secondary-900">No materials available</h3>
                    <p className="mt-1 text-sm text-secondary-500">Check back later for recycled raw materials to purchase with ECT tokens.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rawMaterials.map((material) => {
                      const tokenPrice = Math.floor(material.price_per_kg * 10);
                      return (
                        <div key={material.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 text-primary-600 text-2xl">
                                {getMaterialTypeIcon(material.material_type)}
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-secondary-900">{material.name}</h4>
                                <p className="text-sm text-secondary-500 capitalize">{material.material_type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-semibold text-green-600">{tokenPrice} ECT/kg</span>
                              <p className="text-xs text-gray-500">${material.price_per_kg}/kg</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(material.status)}`}>
                                {material.status?.charAt(0).toUpperCase() + material.status?.slice(1) || 'Available'}
                              </span>
                              <span className="text-sm text-secondary-500">
                                {material.quantity}kg available
                              </span>
                            </div>
                            
                            <button
                              onClick={() => {
                                setSelectedMaterial(material);
                                setShowMaterialModal(true);
                              }}
                              className={`btn-primary text-sm py-2 px-4 ${
                                material.status !== 'available' ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={material.status !== 'available'}
                            >
                              Buy with ECT
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800">Sustainability Rewards</h4>
                        <p className="text-sm text-blue-600 mt-1">Earn up to 200 ECT for high-impact products (80+ score)</p>
                        <button
                          onClick={() => setShowProductModal(true)}
                          className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Product
                        </button>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800">Sales Revenue</h4>
                        <p className="text-sm text-green-600 mt-1">Earn ECT tokens when customers buy your products</p>
                        <button
                          onClick={() => setActiveTab('products')}
                          className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          View Products
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

      {/* Enhanced Create Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-secondary-900">Create New Product</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="input-field"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Category
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  className="input-field"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  className="input-field"
                  placeholder="0.00"
                />
                {productForm.price && (
                  <p className="text-sm text-gray-600 mt-1">
                    Will be priced at {Math.floor(productForm.price * 100)} ECT tokens
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Sustainability Score (1-100)
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={productForm.sustainabilityScore}
                  onChange={(e) => setProductForm({...productForm, sustainabilityScore: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Low Impact</span>
                  <span className="font-medium">{productForm.sustainabilityScore}/100</span>
                  <span>High Impact</span>
                </div>
                {productForm.sustainabilityScore >= 80 && (
                  <p className="text-sm text-green-600 mt-1">
                    Eligible for {Math.floor(productForm.sustainabilityScore * 2)} ECT sustainability bonus!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Weight (kg) - Optional
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={productForm.weight}
                  onChange={(e) => setProductForm({...productForm, weight: e.target.value})}
                  className="input-field"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Description - Optional
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="input-field"
                  placeholder="Describe your sustainable product..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Purchase Material Modal */}
      {showMaterialModal && selectedMaterial && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-secondary-900">Purchase Material</h3>
              <button
                onClick={() => setShowMaterialModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-secondary-900">{selectedMaterial.name}</h4>
                <p className="text-sm text-secondary-500 capitalize">{selectedMaterial.material_type}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-semibold text-green-600">
                    {Math.floor(selectedMaterial.price_per_kg * 10)} ECT/kg
                  </span>
                  <span className="text-sm text-gray-500">${selectedMaterial.price_per_kg}/kg</span>
                </div>
                <p className="text-sm text-secondary-600">Available: {selectedMaterial.quantity}kg</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  max={selectedMaterial.quantity}
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseFloat(e.target.value) || 0.1)}
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-secondary-200">
                <span className="font-medium text-secondary-900">Total Cost:</span>
                <div className="text-right">
                  <span className="text-lg font-semibold text-green-600">
                    {Math.floor(selectedMaterial.price_per_kg * purchaseQuantity * 10)} ECT
                  </span>
                  <p className="text-sm text-gray-500">
                    ${(selectedMaterial.price_per_kg * purchaseQuantity).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 bg-gray-50 rounded-lg px-3">
                <span className="text-sm text-secondary-600">Your Balance:</span>
                <span className="font-semibold">{balance.toLocaleString()} ECT</span>
              </div>

              {balance < Math.floor(selectedMaterial.price_per_kg * purchaseQuantity * 10) && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600">
                    Insufficient balance. You need {(Math.floor(selectedMaterial.price_per_kg * purchaseQuantity * 10) - balance).toLocaleString()} more ECT.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMaterialModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchaseMaterial}
                  disabled={balance < Math.floor(selectedMaterial.price_per_kg * purchaseQuantity * 10)}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Purchase with ECT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProducerDashboard;