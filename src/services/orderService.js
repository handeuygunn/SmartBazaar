import { supabase } from '../lib/supabase';

export const createOrder = async (userId, cartItems) => {
  const orderId = crypto.randomUUID();

  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      order_id: orderId,
      user_id: userId,
      order_status: 'processing',
      order_purchase_timestamp: new Date().toISOString(),
    });

  if (orderError) throw new Error(orderError.message);

  const orderItems = cartItems.map((item, index) => ({
    order_id: orderId,
    order_item_id: index + 1,
    product_id: item.id,
    price: item.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    // FK violation (23503): product_id doesn't exist in products table
    // (e.g. mock product IDs). Retry without product_id reference.
    if (itemsError.code === '23503') {
      const itemsWithoutRef = orderItems.map(({ product_id, ...rest }) => rest);
      const { error: retryError } = await supabase
        .from('order_items')
        .insert(itemsWithoutRef);
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
    .select('order_id, order_status, order_purchase_timestamp')
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
