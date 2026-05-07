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

  if (itemsError) throw new Error(itemsError.message);

  return orderId;
};

export const fetchUserOrders = async (userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      order_id,
      order_status,
      order_purchase_timestamp,
      order_items (
        order_item_id,
        product_id,
        price,
        quantity
      )
    `)
    .eq('user_id', userId)
    .order('order_purchase_timestamp', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};
