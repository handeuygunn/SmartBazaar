/**
 * Secure Notification Service (Simulated)
 */

export const sendNotification = async ({ type, recipient, message, trackingLink }) => {
  console.log(`[SIMULATION] Sending ${type} to ${recipient}...`);
  console.log(`Message: ${message}`);
  if (trackingLink) {
    console.log(`Tracking Link: ${trackingLink}`);
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
  const { emailOptIn, phoneOptIn } = userMetadata || {};
  const trackingLink = `https://smartbazaar.com/track/${order.order_id}`;
  const message = `Great news! Your order #${order.order_id.slice(0, 8)} has been shipped. Track it here: ${trackingLink}`;

  const notifications = [];

  if (emailOptIn !== false) { // Default to true if not set
    notifications.push(sendNotification({
      type: 'email',
      recipient: userMetadata.email,
      message,
      trackingLink
    }));
  }

  if (phoneOptIn && userMetadata.phone) {
    notifications.push(sendNotification({
      type: 'sms',
      recipient: userMetadata.phone,
      message,
      trackingLink
    }));
  }

  if (notifications.length === 0) return null;

  return Promise.all(notifications);
};
