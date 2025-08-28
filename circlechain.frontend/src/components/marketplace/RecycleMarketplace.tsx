import { useEffect, useState } from 'react';
import { useMarketplaceStore } from '../../stores/marketplaceStore';
import { Product, RecycleRequest } from '../../types';

const RecycleMarketplace: React.FC = () => {
  const { products, recycleRequests, isLoading, fetchProducts, fetchRecycleRequests, submitRecycleRequest } =
    useMarketplaceStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchRecycleRequests();
  }, [fetchProducts, fetchRecycleRequests]);

  const handleSubmitRequest = async (productId: number) => {
    try {
      await submitRecycleRequest(productId, notes);
      setSelectedProduct(null);
      setNotes('');
      alert('Recycle request submitted successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to submit recycle request');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recycle Marketplace</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Products */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Available Products for Recycling</h2>
          {isLoading ? (
            <div className="text-center">Loading products...</div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Category: {product.category}</span>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                      Request Recycling
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Requests */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Recycle Requests</h2>
          {isLoading ? (
            <div className="text-center">Loading recycle requests...</div>
          ) : recycleRequests.length === 0 ? (
            <div className="text-center text-gray-500">No recycle requests yet</div>
          ) : (
            <div className="space-y-4">
              {recycleRequests.map((request: RecycleRequest) => (
                <div key={request.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium">Product #{request.id}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.status === 'accepted' || request.status === 'in_process' || request.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'submitted'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Submitted on {new Date(request.created_at).toLocaleDateString()}
                  </p>
                  {request.processed_at && (
                    <p className="text-sm text-gray-500">
                      Processed on {new Date(request.processed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Recycle {selectedProduct.name}</h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Category: {selectedProduct.category}</p>
              {/* If product has environmentalImpact */}
              {'environmentalImpact' in selectedProduct && (
                <p className="text-blue-600 mb-4">
                  Environmental Impact: {selectedProduct.impact_placeholder} kg CO₂ saved when recycled
                </p>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions or details about the product condition..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setNotes('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitRequest(selectedProduct.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecycleMarketplace;
