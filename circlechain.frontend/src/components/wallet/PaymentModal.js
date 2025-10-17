// If PaymentModal doesn't exist, create it:
// src/components/wallet/PaymentModal.jsx
import React from 'react';

export const PaymentModal = ({ isOpen, onClose, product, onConfirm }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Confirm Purchase</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-gray-600">{product.description}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <span>Price:</span>
            <span className="text-lg font-semibold text-green-600">
              {product.price} ECT (${product.originalPrice})
            </span>
          </div>

          {product.impact_placeholder === 'High' && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                🎉 Eco-bonus! You'll get 10% cashback for this sustainable purchase!
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Confirm Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};