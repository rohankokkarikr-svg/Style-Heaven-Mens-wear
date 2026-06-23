const supabase = require('../config/supabase');
const path = require('path');
const fs = require('fs');
const { sendOrderWhatsappNotification, sendOrderCancelWhatsappNotification } = require('../utils/whatsapp');

const getAdminWhatsappNumber = () => {
  const settingsFile = path.join(__dirname, '../data/site_settings.json');
  const defaultNumber = '917676558335';
  try {
    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      return settings.whatsappNumber || defaultNumber;
    }
  } catch (err) {
    console.warn('Could not read whatsappNumber from settings:', err.message);
  }
  return defaultNumber;
};

exports.createOrder = async (req, res) => {
  try {
    const { items, total_price, shipping_address, phone, discount_amount, coupon_code } = req.body;
    const user_id = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No order items' });
    }

    // 0. Validate stock for all items before creating the order
    for (const item of items) {
      const { data: prod, error: prodError } = await supabase
        .from('products')
        .select('name, stock_quantity, is_in_stock')
        .eq('id', item.product_id)
        .single();

      if (prodError || !prod) {
        return res.status(404).json({ error: `Product not found` });
      }

      if (prod.is_in_stock === false || (prod.stock_quantity !== undefined && prod.stock_quantity <= 0)) {
        return res.status(400).json({ error: `"${prod.name}" is out of stock` });
      }

      if (prod.stock_quantity !== undefined && (item.quantity || 1) > prod.stock_quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for "${prod.name}". Only ${prod.stock_quantity} pieces left.` 
        });
      }
    }

    // 0.5 Validate coupon if provided
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.trim().toUpperCase())
        .single();

      if (couponError || !coupon) {
        return res.status(400).json({ error: 'Invalid coupon code' });
      }

      if (coupon.is_used) {
        return res.status(400).json({ error: 'This coupon code has already been used' });
      }

      if (coupon.user_id !== user_id) {
        return res.status(403).json({ error: 'This coupon code does not belong to you' });
      }

      if (new Date(coupon.expiry_date) < new Date()) {
        return res.status(400).json({ error: 'This coupon code has expired' });
      }
    }

    // 1. Create the order
    const { payment_method, payment_status } = req.body;
    let orderData = {
      user_id,
      total_price,
      shipping_address,
      phone,
      discount_amount: discount_amount || 0,
      coupon_code: coupon_code ? coupon_code.trim().toUpperCase() : null,
      status: 'pending',
      payment_method: payment_method || 'cod',
      payment_status: payment_status || 'pending'
    };

    let { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    // Fallback for missing columns (e.g. payment_method, payment_status, discount_amount, coupon_code)
    if (orderError && (orderError.code === 'PGRST204' || (orderError.message && (orderError.message.includes('column') || orderError.message.includes('does not exist'))))) {
      console.warn('Warning: Some columns are missing in Supabase. Attempting fallback inserts...');
      
      const fallbackOrderData = {
        user_id,
        total_price,
        shipping_address,
        phone,
        status: 'pending',
        discount_amount: discount_amount || 0,
        coupon_code: coupon_code ? coupon_code.trim().toUpperCase() : null
      };
      
      const fallbackResult = await supabase
        .from('orders')
        .insert([fallbackOrderData])
        .select()
        .single();
      
      if (fallbackResult.error && (fallbackResult.error.message.includes('column') || fallbackResult.error.message.includes('does not exist'))) {
        console.warn('Warning: discount_amount or coupon_code is also missing. Using base columns.');
        const absoluteBaseData = {
          user_id,
          total_price,
          shipping_address: `${shipping_address} [Method: ${payment_method || 'cod'}]`,
          phone,
          status: 'pending'
        };
        const absoluteResult = await supabase
          .from('orders')
          .insert([absoluteBaseData])
          .select()
          .single();
        
        order = absoluteResult.data;
        orderError = absoluteResult.error;
      } else {
        order = fallbackResult.data;
        orderError = fallbackResult.error;
      }
    }

    if (orderError) throw orderError;

    // 2. Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      size: item.size
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;
    
    // Decrement product stock quantities
    for (const item of items) {
      try {
        const { data: prod } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();
        
        if (prod) {
          const newStock = Math.max(0, (prod.stock_quantity || 0) - (item.quantity || 1));
          const inStock = newStock > 0;
          await supabase
            .from('products')
            .update({ stock_quantity: newStock, is_in_stock: inStock })
            .eq('id', item.product_id);
        }
      } catch (err) {
        console.error(`Failed to update stock for product ${item.product_id}:`, err);
      }
    }
    
    // 3. Mark coupon as used if provided
    if (coupon_code) {
      await supabase
        .from('coupons')
        .update({ is_used: true })
        .eq('code', coupon_code.trim().toUpperCase())
        .eq('user_id', user_id);
    }

    // 4. Send WhatsApp Notification to the Admin
    try {
      const { data: fullOrder } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            quantity, price_at_time, size,
            product:products (id, name, image_url, category)
          )
        `)
        .eq('id', order.id)
        .single();

      if (fullOrder) {
        const adminWhatsapp = getAdminWhatsappNumber();
        const customerName = req.user?.name || 'Customer';
        await sendOrderWhatsappNotification(adminWhatsapp, fullOrder, customerName);
      }
    } catch (wsErr) {
      console.error('Failed to trigger WhatsApp notification:', wsErr.message);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    // Fetch orders with their items and nested products
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          quantity, price_at_time, size,
          product:products (id, name, image_url, category)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
};

// Admin endpoints
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        users (id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching all orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // 1. Fetch order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Security Check: ensure it belongs to the logged-in user
    if (order.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized to cancel this order' });
    }

    // 3. Status check: only pending orders can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel an order that is already ${order.status}` });
    }

    // 4. Timing Check: 12 hours limit
    const createdTime = new Date(order.created_at);
    const diffMs = Date.now() - createdTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours > 12) {
      return res.status(400).json({ error: 'Orders can only be cancelled within 12 hours of placement' });
    }

    // 5. Update status to 'cancelled'
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 6. Release coupon if used
    if (order.coupon_code) {
      await supabase
        .from('coupons')
        .update({ is_used: false })
        .eq('code', order.coupon_code.trim().toUpperCase())
        .eq('user_id', user_id);
    }

    // 7. Send cancellation WhatsApp notification to the Admin
    try {
      const { data: fullOrder } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            quantity, price_at_time, size,
            product:products (id, name, image_url, category)
          )
        `)
        .eq('id', id)
        .single();

      if (fullOrder) {
        const adminWhatsapp = getAdminWhatsappNumber();
        const customerName = req.user?.name || 'Customer';
        await sendOrderCancelWhatsappNotification(adminWhatsapp, fullOrder, customerName);
      }
    } catch (wsErr) {
      console.error('Failed to trigger WhatsApp cancellation notification:', wsErr.message);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

exports.payOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, transaction_id } = req.body;

    // 1. Fetch order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Update order as paid
    const updateData = {
      payment_status: 'paid',
      payment_method: payment_method || order.payment_method || 'upi',
      transaction_id: transaction_id || `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: 'processing'
    };

    let { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // Fallback if columns are missing
    if (updateError && (updateError.message.includes('column') || updateError.message.includes('does not exist'))) {
      console.warn('Warning: payment_status or transaction_id column is missing. Falling back to status update.');
      const fallbackUpdate = {
        status: 'processing',
        shipping_address: `${order.shipping_address} [PAID via ${payment_method || 'upi'}, TXN: ${transaction_id || 'MOCK'}]`
      };
      
      const fallbackResult = await supabase
        .from('orders')
        .update(fallbackUpdate)
        .eq('id', id)
        .select()
        .single();
      
      updatedOrder = fallbackResult.data;
      updateError = fallbackResult.error;
    }

    if (updateError) throw updateError;
    res.json(updatedOrder);
  } catch (error) {
    console.error('Pay order error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          quantity, price_at_time, size,
          product:products (id, name, image_url, category)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to this order' });
    }

    res.json(order);
  } catch (err) {
    console.error('Get order by id error:', err);
    res.status(500).json({ error: 'Server error fetching order details' });
  }
};
