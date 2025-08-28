import { useEffect, useState } from 'react';
import { useMarketplaceStore } from '../../stores/marketplaceStore';
import { Order, RecycleRequest, Product } from '../../types';
import { apiService } from '../../services/api';
import { ShoppingCart, Package, Recycle, TrendingUp } from 'lucide-react';

const ConsumerDashboard: React.FC = () => {
  const {
    recycleRequests,
    fetchRecycleRequests,
  } = useMarketplaceStore();

  const [products, setProducts] = useState<Record<number, Product>>({});
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrdersData();
    fetchRecycleRequests();
    fetchProducts();
  }, [fetchRecycleRequests]);

  const fetchOrdersData = async () => {
    try {
      const orderData = await apiService.getMyOrders();
      setRecentOrders(orderData);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const productList: Product[] = await apiService.getProducts();
      const productMap = productList.reduce(
        (acc: Record<number, Product>, product) => {
          acc[product.id] = product;
          return acc;
        },
        {}
      );
      setProducts(productMap);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const getProductName = (productId: number) => {
    return products[productId]?.name || `Product #${productId}`;
  };

  const getTotalSpent = () => {
    return recentOrders.reduce((sum, order) => sum + order.total_price, 0);
  };

  const getEnvironmentalImpact = () => {
    return recentOrders.reduce((sum, order) => {
      const product = products[order.product_id];
      return sum + (product?.impact_placeholder || 0) * order.quantity;
    }, 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="h-8 w-8 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900">Consumer Dashboard</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <Recycle className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Recycle Requests</h3>
              <p className="text-2xl font-bold text-gray-900">{recycleRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
              <p className="text-2xl font-bold text-gray-900">${getTotalSpent().toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">CO₂</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Environmental Impact</h3>
              <p className="text-2xl font-bold text-green-600">{getEnvironmentalImpact().toFixed(1)} kg saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Order Status</h3>
          <div className="space-y-3">
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => {
              const count = recentOrders.filter(order => order.status === status).length;
              return (
                <div key={status} className="flex justify-between items-center">
                  <span className="capitalize text-gray-600">{status}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'delivered' ? 'bg-green-100 text-green-800' :
                    status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recycle Status</h3>
          <div className="space-y-3">
            {['submitted', 'accepted', 'in_process', 'completed', 'rejected'].map(status => {
              const count = recycleRequests.filter(req => req.status === status).length;
              return (
                <div key={status} className="flex justify-between items-center">
                  <span className="capitalize text-gray-600">{status.replace('_', ' ')}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'completed' ? 'bg-green-100 text-green-800' :
                    status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/marketplace/products" 
               className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
              Browse Products
            </a>
            <a href="/marketplace/recycle" 
               className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Request Recycling
            </a>
            <button className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
              View All Orders
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentOrders.slice(0, 5).map((order: Order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {getProductName(order.product_id)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Quantity: {order.quantity} • ${order.total_price}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No orders yet. Start shopping to see your orders here!
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recycle Requests</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recycleRequests.slice(0, 5).map((request: RecycleRequest) => (
              <div key={request.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {request.item_description}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Category: {request.category || 'Not specified'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                    request.status === 'submitted' || request.status === 'in_process' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
            {recycleRequests.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No recycle requests yet. Start recycling to help the environment!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumerDashboard;