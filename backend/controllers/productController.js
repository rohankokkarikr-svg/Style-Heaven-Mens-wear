const { safeQuery, formatSupabaseError } = require('../config/supabase');
const supabase = require('../config/supabase');
const { HANDICRAFT_PRODUCTS } = require('../data/handicraftsData');

let productCache = {
  all: { data: null, timestamp: 0 },
  featured: { data: null, timestamp: 0 }
};
const CACHE_TTL = 60000; // 60 seconds

const invalidateCache = () => {
  productCache.all = { data: null, timestamp: 0 };
  productCache.featured = { data: null, timestamp: 0 };
};
exports.invalidateCache = invalidateCache;

exports.getCategories = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() =>
      supabase.from('categories').select('*').order('name')
    );

    if (data && data.length > 0) {
      return res.json(data);
    }
    return res.json(HANDICRAFT_CATEGORIES.map((c, i) => ({
      id: String(i + 1),
      name: c.name,
      slug: c.id,
      description: c.description,
      image_url: c.image,
      subcategories: c.subcategories || [],
      is_active: true
    })));
  } catch (err) {
    console.error('getCategories error, returning static fallback:', err.message);
    res.json(HANDICRAFT_CATEGORIES.map((c, i) => ({
      id: String(i + 1),
      name: c.name,
      slug: c.id,
      description: c.description,
      image_url: c.image,
      subcategories: c.subcategories || [],
      is_active: true
    })));
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { category, search, material, is_handmade, artisan_id, min_price, max_price } = req.query;
    
    // Check cache for basic requests (no search/filter)
    const isBasicRequest = (!category || category === 'all') && !search && !material && !is_handmade && !artisan_id && !min_price && !max_price;
    if (isBasicRequest && productCache.all.data && (Date.now() - productCache.all.timestamp < CACHE_TTL)) {
      return res.json(productCache.all.data);
    }

    const { data, error } = await safeQuery(async () => {
      let query = supabase.from('products').select('*, artisan_profiles(id, store_name, location, specialization, verification_status)').order('created_at', { ascending: false });

      // For public shoppers (no specific artisan query), only show approved, non-hidden products
      if (!artisan_id) {
        query = query.neq('is_hidden', true);
        query = query.neq('status', 'rejected');
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      if (material && material !== 'all') {
        query = query.ilike('material', `%${material}%`);
      }
      if (min_price) {
        query = query.gte('price', Number(min_price));
      }
      if (max_price) {
        query = query.lte('price', Number(max_price));
      }
      if (is_handmade === 'true') {
        query = query.eq('is_handmade', true);
      }
      if (artisan_id) {
        query = query.eq('artisan_id', artisan_id);
      }
      return await query;
    });

    let filteredData = (data && data.length > 0) ? data : HANDICRAFT_PRODUCTS;

    // Further sanitize fallback or raw data
    if (!artisan_id) {
      filteredData = filteredData.filter(p => !p.is_hidden && p.status !== 'rejected');
    }

    if (isBasicRequest) {
      productCache.all = { data: filteredData, timestamp: Date.now() };
    }

    res.json(filteredData);
  } catch (error) {
    console.error('Products Fetch Notice, returning handicrafts dataset:', error.message);
    res.json(HANDICRAFT_PRODUCTS.filter(p => !p.is_hidden && p.status !== 'rejected'));
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    if (productCache.featured.data && (Date.now() - productCache.featured.timestamp < CACHE_TTL)) {
      return res.json(productCache.featured.data);
    }

    const { data, error } = await safeQuery(() => 
      supabase
        .from('products')
        .select('*, artisan_profiles(id, store_name, location, specialization)')
        .neq('is_hidden', true)
        .neq('status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(9)
    );

    if (error) throw error;
    
    let filteredData = (data || []).filter(p => !p.is_hidden && p.status !== 'rejected').slice(0, 8);
    if (filteredData.length === 0) {
      filteredData = HANDICRAFT_PRODUCTS.filter(p => !p.is_hidden && p.status !== 'rejected').slice(0, 8);
    }
    
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
      .select('*, artisan_profiles(id, store_name, location, specialization, profile_image, verification_status)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (data) {
      return res.json(data);
    }

    // Check local handicrafts catalog
    const localMatch = HANDICRAFT_PRODUCTS.find(
      (p) => p.id === req.params.id || String(p.id) === String(req.params.id)
    );
    if (localMatch) {
      return res.json(localMatch);
    }

    res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    const localMatch = HANDICRAFT_PRODUCTS.find(
      (p) => p.id === req.params.id || String(p.id) === String(req.params.id)
    );
    if (localMatch) {
      return res.json(localMatch);
    }
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name, description, price, original_price, category, subcategory, sizes,
      stock_quantity = 0, is_in_stock = true, image_url, barcode,
      artisan_id, is_handmade, material, style, ai_generated, ai_suggested_price, tags
    } = req.body;

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name, description, price, original_price, category, subcategory, sizes,
        stock_quantity, is_in_stock,
        barcode: barcode ? barcode.trim() : null,
        ...(image_url ? { image_url } : {}),
        ...(artisan_id ? { artisan_id } : {}),
        ...(is_handmade !== undefined ? { is_handmade } : {}),
        ...(material ? { material } : {}),
        ...(style ? { style } : {}),
        ...(ai_generated !== undefined ? { ai_generated } : {}),
        ...(ai_suggested_price ? { ai_suggested_price } : {}),
        ...(tags ? { tags } : {}),
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Barcode already exists. Please use a unique barcode.' });
      }
      throw error;
    }

    invalidateCache();
    const { broadcastSync } = require('../utils/realtime');
    broadcastSync('PRODUCTS_UPDATED', { action: 'create', product: data });
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Server Error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const {
      name, description, price, original_price, category, subcategory, sizes,
      stock_quantity, is_in_stock, image_url, barcode,
      artisan_id, is_handmade, material, style, ai_generated, ai_suggested_price, tags
    } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({ 
        name, description, price, original_price, category, subcategory, sizes, 
        stock_quantity, is_in_stock, image_url,
        barcode: barcode ? barcode.trim() : null,
        artisan_id, is_handmade, material, style, ai_generated, ai_suggested_price, tags
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Barcode already exists. Please use a unique barcode.' });
      }
      throw error;
    }
    
    invalidateCache();
    const { broadcastSync } = require('../utils/realtime');
    broadcastSync('PRODUCTS_UPDATED', { action: 'update', id: req.params.id, product: data });
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
    const { broadcastSync } = require('../utils/realtime');
    broadcastSync('PRODUCTS_UPDATED', { action: 'delete', id: req.params.id });
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
