import { useEffect, useState } from 'react';
import { useMarketplaceStore } from '../../stores/marketplaceStore';
import { Product } from '../../types';
import AddProductForm from './AddProductForm';

const ProductMarketplace: React.FC = () => {
  const { products, isLoading, fetchProducts, purchaseProduct } = useMarketplaceStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePurchase = async (productId: number) => {
    try {
      await purchaseProduct(productId, quantity);
      setSelectedProduct(null);
      setQuantity(1);
      alert('Purchase successful!');
    } catch (error: any) {
      alert(error.message || 'Purchase failed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Marketplace</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : '+ Add New Product'}
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="mb-8">
          <AddProductForm />
        </div>
      )}

      {isLoading ? (
        <div className="text-center">Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-green-600">${product.price}</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : product.status === 'sold'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Category: {product.category}</span>
                  <span className="mx-2">•</span>
                  <span className="text-sm text-blue-600">
                    Saves {product.impact_placeholder} kg CO₂
                  </span>
                </div>
                <button
                  onClick={() => setSelectedProduct(product)}
                  disabled={product.status !== 'available'}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.status === 'available' ? 'Buy Now' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Purchase {selectedProduct.name}</h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Price: ${selectedProduct.price}</p>
              <p className="text-gray-600 mb-2">Status: {selectedProduct.status}</p>
              <p className="text-blue-600 mb-4">
                Environmental Impact: {selectedProduct.impact_placeholder} kg CO₂ saved
              </p>
            </div>
            <div className="mb-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="mb-4">
              <p className="text-lg font-semibold">
                Total: ${(selectedProduct.price * quantity).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(selectedProduct.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMarketplace;