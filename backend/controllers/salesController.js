const supabase = require('../config/supabase');

exports.recordScanSale = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Insert sale record
    const { data, error } = await supabase
      .from('sales')
      .insert([{
        product_id,
        quantity: quantity || 1,
        date: new Date().toISOString().split('T')[0] // current date YYYY-MM-DD
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
};
