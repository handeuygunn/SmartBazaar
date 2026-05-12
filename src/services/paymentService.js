import { supabase } from '../lib/supabase';

/**
 * Secure Payment Service (Simulated)
 */

export const processPayment = async (paymentData) => {
  console.log('Processing payment via RESTful API...', paymentData);
  
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const status = Math.random() > 0.1 ? 'success' : 'failed'; // 10% failure rate for demo
  
  // Log transaction to database
  try {
    await supabase.from('transactions').insert({
      user_id: paymentData.userId,
      amount: paymentData.amount,
      status: status,
      payment_method: paymentData.method,
      details: {
        browser: navigator.userAgent,
        ip: '192.168.1.1', // Mock IP
        ...paymentData
      }
    });
  } catch (err) {
    console.error('Failed to log transaction:', err);
  }

  if (status === 'failed') {
    throw new Error('Payment failed. Please check your credentials or try a different method.');
  }

  // Simulate a successful response
  return {
    success: true,
    transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    message: 'Payment processed successfully'
  };
};

export const PAYMENT_METHODS = [
  { id: 'apple_pay', name: 'Apple Pay', icon: 'Apple' },
  { id: 'google_pay', name: 'Google Pay', icon: 'Wallet' },
  { id: 'paypal', name: 'PayPal', icon: 'CreditCard' },
  { id: 'credit_card', name: 'Credit Card', icon: 'CreditCard' }
];
