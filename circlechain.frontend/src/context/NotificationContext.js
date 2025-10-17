// src/context/NotificationContext.js
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = {
      id,
      message,
      type,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (message, duration) => addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
  const error = (message, duration = 8000) => addNotification(message, NOTIFICATION_TYPES.ERROR, duration);
  const info = (message, duration) => addNotification(message, NOTIFICATION_TYPES.INFO, duration);
  const warning = (message, duration) => addNotification(message, NOTIFICATION_TYPES.WARNING, duration);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    info,
    warning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// src/components/notifications/NotificationContainer.js
export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  const getNotificationStyles = (type) => {
    const baseStyles = "mb-4 p-4 rounded-lg shadow-lg flex items-center justify-between max-w-sm w-full";
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `${baseStyles} bg-green-500 text-white`;
      case NOTIFICATION_TYPES.ERROR:
        return `${baseStyles} bg-red-500 text-white`;
      case NOTIFICATION_TYPES.WARNING:
        return `${baseStyles} bg-yellow-500 text-white`;
      default:
        return `${baseStyles} bg-blue-500 text-white`;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case NOTIFICATION_TYPES.ERROR:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case NOTIFICATION_TYPES.WARNING:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationStyles(notification.type)} animate-in slide-in-from-right`}
        >
          <div className="flex items-center">
            {getIcon(notification.type)}
            <span className="ml-3 text-sm font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

// src/components/notifications/BlockchainActionNotification.js
export const BlockchainActionNotification = ({ transaction, type }) => {
  const { success, info } = useNotifications();

  React.useEffect(() => {
    if (!transaction) return;

    const { type: txType, amount, description, id } = transaction;
    
    if (type === 'payment') {
      success(
        `Payment successful! ${amount} ECT sent. Transaction: ${id.substr(0, 8)}...`,
        6000
      );
    } else if (type === 'reward') {
      success(
        `Reward received! +${amount} ECT earned. ${description}`,
        6000
      );
    } else {
      info(`Transaction completed: ${description}`, 5000);
    }
  }, [transaction, type, success, info]);

  return null; // This component doesn't render anything visible
};

// src/hooks/useBlockchainNotifications.js
export const useBlockchainNotifications = () => {
  const { success, error, info } = useNotifications();

  const notifyPayment = (transaction) => {
    success(
      `💳 Payment successful! ${transaction.amount} ECT spent on ${transaction.productName}`,
      6000
    );
  };

  const notifyReward = (transaction) => {
    success(
      `🎉 Reward earned! +${transaction.amount} ECT - ${transaction.description}`,
      6000
    );
  };

  const notifyInsufficientFunds = (required, available) => {
    error(
      `❌ Insufficient funds! Need ${required} ECT but only have ${available} ECT`,
      8000
    );
  };

  const notifyTransactionPending = () => {
    info('⏳ Transaction pending... Please wait for blockchain confirmation', 3000);
  };

  const notifyTransactionFailed = (reason) => {
    error(`❌ Transaction failed: ${reason}`, 8000);
  };

  const notifyWalletConnected = () => {
    success('✅ Wallet connected successfully!', 4000);
  };

  return {
    notifyPayment,
    notifyReward,
    notifyInsufficientFunds,
    notifyTransactionPending,
    notifyTransactionFailed,
    notifyWalletConnected
  };
};