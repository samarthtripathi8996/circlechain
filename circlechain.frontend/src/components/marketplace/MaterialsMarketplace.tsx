import { useEffect, useState } from 'react';
import { useMarketplaceStore } from '../../stores/marketplaceStore';
import { RawMaterial } from '../../types';

const MaterialsMarketplace: React.FC = () => {
  const { 
    rawMaterials, 
    isLoading, 
    fetchRawMaterials, 
    purchaseRawMaterial 
  } = useMarketplaceStore();

  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchRawMaterials();
  }, [fetchRawMaterials]);

  const handlePurchase = async (materialId: number) => {
    try {
      await purchaseRawMaterial(materialId, quantity);
      setSelectedMaterial(null);
      setQuantity(1);
      alert('Purchase successful!');
    } catch (error: any) {
      alert(error.message || 'Purchase failed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Raw Materials Marketplace</h1>
      
      {isLoading ? (
        <div className="text-center">Loading materials...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rawMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{material.name}</h3>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-green-600">
                    ₹{material.price_per_kg} / kg
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      material.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : material.status === 'reserved'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {material.status}
                  </span>
                </div>
                <div className="mb-4 text-sm text-gray-500">
                  <p>Material Type: {material.material_type}</p>
                  <p>Available Quantity: {material.quantity} kg</p>
                  <p>Recycler ID: {material.recycler_id}</p>
                </div>
                <button
                  onClick={() => setSelectedMaterial(material)}
                  disabled={material.status !== 'available'}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {material.status === 'available' ? 'Purchase' : 'Unavailable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Purchase {selectedMaterial.name}</h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Price: ₹{selectedMaterial.price_per_kg} / kg</p>
              <p className="text-gray-600 mb-2">
                Available: {selectedMaterial.quantity} kg
              </p>
              <p className="text-gray-600 mb-4">Material Type: {selectedMaterial.material_type}</p>
            </div>
            <div className="mb-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (kg)
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                max={selectedMaterial.quantity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="mb-4">
              <p className="text-lg font-semibold">
                Total: ₹{(selectedMaterial.price_per_kg * quantity).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedMaterial(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(selectedMaterial.id)}
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

export default MaterialsMarketplace;
