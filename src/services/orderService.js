import { supabase } from '../lib/supabase';

// Status definitions — single source of truth
export const ORDER_STATUSES = [
  { key: 'processing',       label: 'Sipariş Alındı',   color: '#f59e0b', bg: '#fef3c7' },
  { key: 'shipped',          label: 'Kargoya Verildi',  color: '#3b82f6', bg: '#dbeafe' },
  { key: 'delivered',        label: 'Teslim Edildi',    color: '#10b981', bg: '#d1fae5' },
  { key: 'cancelled',        label: 'İptal Edildi',     color: '#ef4444', bg: '#fee2e2' },
  { key: 'return_requested', label: 'İade Talebi',      color: '#8b5cf6', bg: '#ede9fe' },
];

export const getStatusMeta = (key) =>
  ORDER_STATUSES.find(s => s.key === key) || ORDER_STATUSES[0];

// ─── Customer ────────────────────────────────────────────────────────────────

export const createOrder = async (userId, cartItems) => {
  const orderId = crypto.randomUUID();
  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: orderError } = await supabase.from('orders').insert({
    order_id: orderId,
    user_id: userId,
    order_status: 'processing',
    order_purchase_timestamp: new Date().toISOString(),
    order_estimated_delivery_date: estimatedDelivery,
  });

  if (orderError) throw new Error(orderError.message);

  const orderItems = cartItems.map((item, index) => ({
    order_id: orderId,
    order_item_id: index + 1,
    product_id: item.id,
    price: item.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    if (itemsError.code === '23503') {
      const itemsWithoutRef = orderItems.map(({ product_id, ...rest }) => rest);
      const { error: retryError } = await supabase.from('order_items').insert(itemsWithoutRef);
      if (retryError) throw new Error(retryError.message);
    } else {
      throw new Error(itemsError.message);
    }
  }

  return orderId;
};

export const fetchUserOrders = async (userId) => {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(
      'order_id, order_status, order_purchase_timestamp, order_estimated_delivery_date, order_delivered_customer_date'
    )
    .eq('user_id', userId)
    .order('order_purchase_timestamp', { ascending: false });

  if (ordersError) throw new Error(ordersError.message);
  if (!orders?.length) return [];

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('order_id, order_item_id, product_id, price, quantity')
    .in('order_id', orders.map(o => o.order_id));

  if (itemsError) throw new Error(itemsError.message);

  return orders.map(order => ({
    ...order,
    order_items: (items || []).filter(item => item.order_id === order.order_id),
  }));
};

/**
 * Realtime subscription for a user's orders.
 * Listens to ALL order updates and filters by the user's order IDs client-side
 * (avoids filter replica-identity requirements on the DB).
 * @param {string[]} orderIds  — array of order_id strings to watch
 * @param {function} onUpdate  — called with the updated order row
 * @returns {function}         — unsubscribe / cleanup function
 */
export const subscribeToOrderUpdates = (orderIds, onUpdate) => {
  if (!orderIds?.length) return () => {};

  const channel = supabase
    .channel('orders-realtime-customer')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload) => {
        if (orderIds.includes(payload.new.order_id)) {
          onUpdate(payload.new);
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const fetchAllOrders = async () => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'order_id, user_id, order_status, order_purchase_timestamp, order_estimated_delivery_date, order_delivered_customer_date'
    )
    .order('order_purchase_timestamp', { ascending: false })
    .limit(300);

  if (error) throw new Error(error.message);
  return orders || [];
};

// ─── Customer Actions ───────────────────────────────────────────────────────

/**
 * Cancel a 'processing' order.
 * @param {string} orderId
 * @param {string} reason — selected from predefined list
 */
export const cancelOrder = async (orderId, reason) => {
  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'cancelled' })
    .eq('order_id', orderId);
  if (error) throw new Error(error.message);
};

/**
 * Request a return for a 'delivered' order.
 * @param {string} orderId
 * @param {string} reason — selected from predefined list
 */
export const requestReturn = async (orderId, reason) => {
  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'return_requested' })
    .eq('order_id', orderId);
  if (error) throw new Error(error.message);
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const updateOrderStatus = async (orderId, status, estimatedDelivery) => {
  const patch = { order_status: status };

  if (estimatedDelivery) {
    patch.order_estimated_delivery_date = new Date(estimatedDelivery).toISOString();
  }
  if (status === 'delivered') {
    patch.order_delivered_customer_date = new Date().toISOString();
  }

  const { error } = await supabase.from('orders').update(patch).eq('order_id', orderId);
  if (error) throw new Error(error.message);
};
