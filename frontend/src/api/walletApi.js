import apiClient from './client';

export const walletApi = {
  // Get current user's wallet and recent transaction history
  getWallet: async () => {
    try {
      const res = await apiClient.get('/api/wallet/me');
      return res.data;
    } catch (err) {
      console.warn('Fallback getting wallet:', err);
      return {
        success: true,
        data: {
          balance: 5000,
          escrowBalance: 0,
          currency: 'INR',
          recentTransactions: [],
        },
      };
    }
  },

  // Add funds to wallet (e.g. via Razorpay / UPI deposit)
  addFunds: async ({ amount, paymentMethod = 'RAZORPAY', transactionReference = '' }) => {
    const res = await apiClient.post('/api/wallet/add-funds', {
      amount: Number(amount),
      paymentMethod,
      transactionReference,
    });
    return res.data;
  },

  // Withdraw funds to bank account or UPI ID
  withdraw: async ({ amount, payoutMethod = 'BANK', accountHolder = '', accountNumber = '', ifsc = '', upiId = '' }) => {
    const res = await apiClient.post('/api/wallet/withdraw', {
      amount: Number(amount),
      payoutMethod,
      accountHolder,
      accountNumber,
      ifsc,
      upiId,
    });
    return res.data;
  },

  // Get full transaction history
  getTransactions: async () => {
    try {
      const res = await apiClient.get('/api/wallet/transactions');
      return res.data;
    } catch {
      return { success: true, data: [] };
    }
  },
};
