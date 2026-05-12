/**
 * Secure Payment Service (Simulated)
 * In a real production app, this would use Stripe, PayPal SDK, or another payment provider.
 */

export const processPayment = async (paymentData) => {
  console.log('Processing payment via RESTful API...', paymentData);
  
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Basic validation
  if (!paymentData.method) {
    throw new Error('Payment method is required.');
  }
  
  if (!paymentData.amount || paymentData.amount <= 0) {
    throw new Error('Invalid payment amount.');
  }

  // Simulate a successful response from a payment gateway
  const mockApiResponse = {
    success: true,
    transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    message: 'Payment processed successfully'
  };

  return mockApiResponse;
};

export const PAYMENT_METHODS = [
  { id: 'apple_pay', name: 'Apple Pay', icon: 'Apple' },
  { id: 'google_pay', name: 'Google Pay', icon: 'Wallet' },
  { id: 'paypal', name: 'PayPal', icon: 'CreditCard' },
  { id: 'credit_card', name: 'Credit Card', icon: 'CreditCard' }
];
