const { safeQuery, formatSupabaseError } = require('../config/supabase');
const supabase = require('../config/supabase');

let productCache = {
  all: { data: null, timestamp: 0 },
  featured: { data: null, timestamp: 0 }
};
const CACHE_TTL = 60000; // 60 seconds

const invalidateCache = () => {
  productCache.all = { data: null, timestamp: 0 };
  productCache.featured = { data: null, timestamp: 0 };
};

exports.getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    // Check cache for basic requests (no search/filter)
    const isBasicRequest = (!category || category === 'all') && !search;
    if (isBasicRequest && productCache.all.data && (Date.now() - productCache.all.timestamp < CACHE_TTL)) {
      return res.json(productCache.all.data);
    }

    const { data, error } = await safeQuery(async () => {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      return await query;
    });

    if (error) throw error;
    
    // Filter out the customized T-shirt unless includeCustom is true
    let filteredData = data || [];
    if (req.query.includeCustom !== 'true') {
      filteredData = filteredData.filter(p => p.name !== 'Style Heaven Customized T-Shirt');
    }

    // If search looks like a barcode
    if (search && filteredData.length === 0 && !search.includes(' ')) {
      const { data: barcodeData } = await safeQuery(() => 
        supabase.from('products').select('*').eq('barcode', search)
      );
      if (barcodeData && barcodeData.length > 0) {
        let filteredBarcodeData = barcodeData;
        if (req.query.includeCustom !== 'true') {
          filteredBarcodeData = barcodeData.filter(p => p.name !== 'Style Heaven Customized T-Shirt');
        }
        if (filteredBarcodeData.length > 0) {
          return res.json(filteredBarcodeData);
        }
      }
    }

    if (isBasicRequest) {
      productCache.all = { data: filteredData, timestamp: Date.now() };
    }

    res.json(filteredData);
  } catch (error) {
    console.error('Products Fetch Error:', error);
    const friendly = formatSupabaseError(error);
    res.status(friendly ? 503 : 500).json(friendly || { error: 'Server Error' });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() => 
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(9)
    );

    if (error) throw error;
    
    let filteredData = (data || []).filter(p => p.name !== 'Style Heaven Customized T-Shirt').slice(0, 8);
    
    productCache.featured = { data: filteredData, timestamp: Date.now() };
    
    res.json(filteredData);
  } catch (error) {
    console.error('Featured Products Fetch Error:', error);
    const friendly = formatSupabaseError(error);
    res.status(friendly ? 503 : 500).json(friendly || { error: 'Server Error' });
  }
};


exports.getProductById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, original_price, category, sizes, stock_quantity = 0, is_in_stock = true, image_url, barcode } = req.body;

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name, description, price, original_price, category, sizes,
        stock_quantity, is_in_stock,
        barcode: barcode ? barcode.trim() : null,
        ...(image_url ? { image_url } : {}),
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Barcode already exists. Please use a unique barcode.' });
      }
      if (error.code === 'PGRST204') {
        return res.status(400).json({ error: 'Database column missing. Please run the SQL to add stock columns.' });
      }
      throw error;
    }

    invalidateCache();
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Server Error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, original_price, category, sizes, stock_quantity, is_in_stock, image_url, barcode } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({ 
        name, description, price, original_price, category, sizes, 
        stock_quantity, is_in_stock, image_url,
        barcode: barcode ? barcode.trim() : null 
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Barcode already exists. Please use a unique barcode.' });
      }
      if (error.code === 'PGRST204') {
        return res.status(400).json({ error: 'Database column missing. Please run the SQL to add stock columns.' });
      }
      throw error;
    }
    
    invalidateCache();
    res.json(data);
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ error: error.message || 'Server Error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    
    invalidateCache();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const imageUrl = req.file.path || req.file.url || req.file.secure_url;

    if (!imageUrl) {
      return res.status(500).json({ error: 'Failed to retrieve image URL from storage' });
    }

    const { data, error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    
    invalidateCache();
    res.json(data);
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Server Error during upload' });
  }
};

exports.uploadDirect = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const imageUrl = req.file.path || req.file.url || req.file.secure_url;

    if (!imageUrl) {
      return res.status(500).json({ error: 'Failed to retrieve image URL from storage' });
    }

    res.json({ imageUrl });
  } catch (error) {
    console.error('Direct Upload Error:', error);
    res.status(500).json({ error: 'Server Error during direct upload' });
  }
};
