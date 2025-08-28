import { useEffect, useState } from 'react';
import { Product, RawMaterial } from '../../types';
import { apiService } from '../../services/api';
import { Factory, Package, ShoppingCart, TrendingUp, Plus } from 'lucide-react';

const ProducerDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [productsData, materialsData] = await Promise.all([
        apiService.getMyProducts(),
        apiService.getAvailableMaterials()
      ]);
      
      setProducts(productsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Failed to fetch producer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalRevenue = () => {
    return products.reduce((sum, product) => {
      return sum + (product.status === 'sold' ? product.price : 0);
    }, 0);
  };

  const getTotalImpact = () => {
    return products.reduce((sum, product) => sum + product.impact_placeholder, 0);
  };

  const getProductsByStatus = () => {
    return {
      available: products.filter(p => p.status === 'available').length,
      sold: products.filter(p => p.status === 'sold').length,
      out_of_stock: products.filter(p => p.status === 'out_of_stock').length
    };
  };

  const productStats = getProductsByStatus();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Factory className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Producer Dashboard</h1>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Products Sold</h3>
              <p className="text-2xl font-bold text-gray-900">{productStats.sold}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">${getTotalRevenue().toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-green-600">{getTotalImpact().toFixed(1)} kg saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Product Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Available</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {productStats.available}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sold</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {productStats.sold}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Out of Stock</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                {productStats.out_of_stock}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Categories</h3>
          <div className="space-y-3">
            {Array.from(new Set(products.map(p => p.category))).map(category => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{category}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                  {products.filter(p => p.category === category).length}
                </span>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-gray-500 text-sm">No products yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setShowAddForm(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
              Create New Product
            </button>
            <a href="/marketplace/materials" 
               className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Buy Raw Materials
            </a>
            <button className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Product Management */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Your Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product: Product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-48">
                        {product.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium capitalize">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'sold'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {product.impact_placeholder} kg CO₂
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No products found. Create your first product to get started!
            </div>
          )}
        </div>
      </div>

      {/* Available Raw Materials */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Available Raw Materials</h2>
          <p className="text-sm text-gray-500 mt-1">Materials you can purchase for production</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {materials.slice(0, 6).map((material) => (
            <div key={material.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{material.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  material.status === 'available' ? 'bg-green-100 text-green-800' :
                  material.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {material.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">Type: {material.material_type}</p>
              <p className="text-sm text-gray-500 mb-2">{material.quantity} kg available</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-green-600">${material.price_per_kg}/kg</span>
                <button 
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  disabled={material.status !== 'available'}
                >
                  Purchase
                </button>
              </div>
            </div>
          ))}
          {materials.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              No raw materials available at the moment
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProducerDashboard;