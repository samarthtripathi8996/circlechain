// src/hooks/useBlockchainNotifications.js
import { useNotifications } from '../context/NotificationContext';

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
