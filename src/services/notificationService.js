import { supabase } from '../lib/supabase';

/**
 * Secure Notification Service (Simulated)
 */

export const sendNotification = async ({ type, recipient, message, trackingLink, userId, title }) => {
  console.log(`[SIMULATION] Sending ${type} to ${recipient}...`);
  console.log(`Message: ${message}`);
  
  // Save to database for user to see in their "Notification Center"
  if (userId) {
    try {
      await supabase.from('user_notifications').insert({
        user_id: userId,
        type: type,
        title: title || 'Sipariş Güncellemesi',
        message: message,
        tracking_link: trackingLink,
        is_read: false
      });
    } catch (err) {
      console.error('Failed to save notification to DB:', err);
    }
  }
  
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    provider: type === 'email' ? 'SendGrid' : 'Twilio',
    timestamp: new Date().toISOString()
  };
};

export const triggerOrderShippedNotification = async (order, userMetadata) => {
  const { emailOptIn, phoneOptIn, id: userId, email, phone } = userMetadata || {};
  const trackingLink = `https://smartbazaar.com/track/${order.order_id}`;
  const title = 'Siparişiniz Yola Çıktı! 🚚';
  const message = `Harika haber! #${order.order_id.slice(0, 8)} numaralı siparişiniz kargoya verildi.`;

  const notifications = [];

  if (emailOptIn !== false) {
    notifications.push(sendNotification({
      type: 'email',
      recipient: email,
      message,
      trackingLink,
      userId,
      title
    }));
  }

  if (phoneOptIn && phone) {
    notifications.push(sendNotification({
      type: 'sms',
      recipient: phone,
      message,
      trackingLink,
      userId,
      title
    }));
  }

  if (notifications.length === 0) return null;

  return Promise.all(notifications);
};
