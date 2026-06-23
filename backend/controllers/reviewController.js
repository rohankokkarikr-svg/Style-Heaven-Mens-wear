const { safeQuery } = require('../config/supabase');
const supabase = require('../config/supabase');

// Fallback reviews if table doesn't exist yet
const FALLBACK_REVIEWS = [
  {
    id: 'fallback-1',
    customer_name: 'Rahul Sharma',
    image_url: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336528/style-heaven-assets/review_rahul.jpg',
    rating: 5,
    review_text: "Excellent quality and premium fitting. The designs are stylish and perfect for modern fashion lovers.",
    product_name: 'Premium Tailored Suit',
    is_approved: true
  },
  {
    id: 'fallback-2',
    customer_name: 'Arjun Patel',
    image_url: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336531/style-heaven-assets/review_arjun.jpg',
    rating: 5,
    review_text: "Fast delivery and amazing customer service. The fabric quality feels luxurious.",
    product_name: 'Linen Summer Shirt',
    is_approved: true
  },
  {
    id: 'fallback-3',
    customer_name: 'Vikram Singh',
    image_url: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336532/style-heaven-assets/review_vikram.jpg',
    rating: 5,
    review_text: "Best menswear website I've used. Stylish collection and affordable prices.",
    product_name: 'Classic Chinos',
    is_approved: true
  },
  {
    id: 'fallback-4',
    customer_name: 'Karan Mehta',
    image_url: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336534/style-heaven-assets/review_karan.jpg',
    rating: 5,
    review_text: "The jackets and hoodies look even better in real life. Highly recommended.",
    product_name: 'Urban Streetwear Hoodie',
    is_approved: true
  }
];


let cachedReviews = [];

exports.getApprovedReviews = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() => 
      supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20)
    );
      
    if (error) {
      if (error.code === '42P01') {
        return res.json([...cachedReviews.filter(r => r.is_approved), ...FALLBACK_REVIEWS].slice(0, 10));
      }
      throw error;
    }
    
    res.json(data && data.length > 0 ? data : FALLBACK_REVIEWS);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.json(FALLBACK_REVIEWS);
  }
};


exports.getAllReviews = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      if (error.code === '42P01') {
        return res.json([...cachedReviews, ...FALLBACK_REVIEWS]);
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const { customer_name, product_name, rating, review_text, image_url } = req.body;
    
    if (!customer_name || !product_name || !rating || !review_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newReview = {
      user_id: req.user ? req.user.id : null,
      customer_name,
      product_name,
      rating: Number(rating),
      review_text,
      image_url: image_url || null,
      is_approved: true // Auto-approve for demo/dev purposes
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert([newReview])
      .select();

    if (error) {
      if (error.code === '42P01') {
        const memReview = { ...newReview, id: 'mem-' + Date.now(), created_at: new Date().toISOString() };
        cachedReviews.unshift(memReview);
        return res.status(201).json(memReview);
      }
      throw error;
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

exports.approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id.startsWith('mem-') || id.startsWith('fallback-')) {
      const idx = cachedReviews.findIndex(r => r.id === id);
      if (idx !== -1) cachedReviews[idx].is_approved = true;
      const fIdx = FALLBACK_REVIEWS.findIndex(r => r.id === id);
      if (fIdx !== -1) FALLBACK_REVIEWS[fIdx].is_approved = true;
      return res.json({ message: 'Review approved' });
    }

    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) throw error;
    
    res.json({ message: 'Review approved successfully' });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ error: 'Failed to approve review' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id.startsWith('mem-') || id.startsWith('fallback-')) {
      cachedReviews = cachedReviews.filter(r => r.id !== id);
      return res.json({ message: 'Review deleted' });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
