import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiStar } from 'react-icons/hi';
import { reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ReviewModal({ isOpen, onClose, product, onReviewSubmitted }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return toast.error('Please write a review message');
    if (!user) return toast.error('Please log in to submit a review');

    setSubmitting(true);
    try {
      const newReviewData = {
        customer_name: user.name || 'Verified Customer',
        product_name: product?.name || 'Style Heaven Product',
        rating,
        review_text: reviewText,
        image_url: ''
      };
      
      const res = await reviewAPI.submit(newReviewData);
      
      toast.success('Review submitted successfully!');
      if (onReviewSubmitted) {
        // Return the full review object (using mock ID if api doesn't return one immediately)
        onReviewSubmitted({ ...newReviewData, id: res?.data?.id || Date.now() });
      }
      setReviewText('');
      setRating(5);
      onClose();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
      } else {
        toast.error('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-dark-800 rounded-2xl border border-dark-600 shadow-card w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-dark-600">
            <div>
              <h2 className="text-xl font-bold text-white">Write a Review</h2>
              <p className="text-sm text-gray-400 mt-1">For {product?.name || 'this product'}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6 flex flex-col items-center">
              <p className="text-sm text-gray-400 mb-3">Overall Rating</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <HiStar 
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating) 
                          ? 'text-gold-500 drop-shadow-[0_0_8px_rgba(201,168,76,0.5)]' 
                          : 'text-dark-600'
                      } transition-colors duration-200`} 
                    />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm font-semibold text-gold-400 min-h-[20px]">
                {(hoverRating || rating) === 5 && "Excellent"}
                {(hoverRating || rating) === 4 && "Very Good"}
                {(hoverRating || rating) === 3 && "Good"}
                {(hoverRating || rating) === 2 && "Average"}
                {(hoverRating || rating) === 1 && "Poor"}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Review Message</label>
              <textarea
                rows="4"
                className="input-field w-full resize-none bg-dark-900 focus:bg-dark-800"
                placeholder="What did you like about this product? How was the fit and quality?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                required
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-outline flex-1 py-3"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="btn-primary flex-1 py-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
