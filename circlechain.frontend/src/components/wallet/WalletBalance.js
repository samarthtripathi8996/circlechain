// src/components/wallet/WalletBalance.js
import React from 'react';
import { useBlockchain } from '../../context/BlockchainContext';

const WalletBalance = ({ showDetails = true, className = '' }) => {
  const { balance, loading, getTotalEarned, getTotalSpent } = useBlockchain();

  return (
    <div className={`bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">Wallet Balance</p>
          <p className="text-3xl font-bold">
            {loading ? (
              <span className="animate-pulse">---</span>
            ) : (
              `${balance.toLocaleString()} ECT`
            )}
          </p>
          <p className="text-xs opacity-75 mt-1">EcoCircle Tokens</p>
        </div>
        <div className="text-right">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-75">Total Earned</p>
              <p className="text-lg font-semibold text-green-200">
                +{getTotalEarned().toLocaleString()} ECT
              </p>
            </div>
            <div>
              <p className="text-xs opacity-75">Total Spent</p>
              <p className="text-lg font-semibold text-red-200">
                -{getTotalSpent().toLocaleString()} ECT
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// src/components/wallet/TransactionHistory.js
export const TransactionHistory = ({ limit = null, showTitle = true }) => {
  const { transactions, loading } = useBlockchain();

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  const getTransactionIcon = (type) => {
    return type === 'payment' ? (
      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
    ) : (
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        {showTitle && <h3 className="text-lg font-semibold mb-4">Transaction History</h3>}
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {showTitle && (
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <p className="text-sm text-gray-600 mt-1">Your recent blockchain transactions</p>
        </div>
      )}
      
      <div className="p-6">
        {displayTransactions.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start making purchases or recycling to see your transaction history.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>ID: {transaction.id}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'payment' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.type === 'payment' ? '-' : '+'}
                    {transaction.amount.toLocaleString()} ECT
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    transaction.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// src/components/wallet/PaymentModal.js
export const PaymentModal = ({ isOpen, onClose, product, onConfirm }) => {
  const { balance, payForProduct, loading } = useBlockchain();
  const [paymentLoading, setPaymentLoading] = React.useState(false);
  
  if (!isOpen || !product) return null;

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const transaction = await payForProduct(product.name, product.price);
      onConfirm(transaction);
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
      // You might want to show an error toast here
    } finally {
      setPaymentLoading(false);
    }
  };

  const canAfford = balance >= product.price;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Confirm Payment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={paymentLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="border rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-4">
              <img 
                src={product.image || '/api/placeholder/80/80'} 
                alt={product.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-gray-600 text-sm">{product.description}</p>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {product.price} ECT
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Your Balance:</span>
              <span className="font-semibold">{balance.toLocaleString()} ECT</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Amount to Pay:</span>
              <span className="font-semibold text-red-600">-{product.price} ECT</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <span className="text-gray-600">Balance After Payment:</span>
              <span className="font-bold text-green-600">
                {(balance - product.price).toLocaleString()} ECT
              </span>
            </div>
          </div>

          {!canAfford && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600 text-sm">
                Insufficient balance. You need {(product.price - balance).toLocaleString()} more ECT.
              </p>
            </div>
          )}

          <div className="flex space-x-4 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={paymentLoading}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={!canAfford || paymentLoading || loading}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                canAfford 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-400'
              }`}
            >
              {paymentLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Confirm Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletBalance;