import React, { useState, useEffect } from 'react';
import { reviewAPI } from '../../services/api';
import { HiCheck, HiTrash, HiStar } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await reviewAPI.getAll();
      setReviews(data);
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await reviewAPI.approve(id);
      toast.success('Review approved and is now public!');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to approve review');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewAPI.delete(id);
        toast.success('Review deleted');
        fetchReviews();
      } catch (err) {
        toast.error('Failed to delete review');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Reviews</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-800 border-b border-dark-600">
                <th className="p-4 text-sm font-semibold text-gray-300">Customer</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Product</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Rating</th>
                <th className="p-4 text-sm font-semibold text-gray-300 max-w-xs">Review Text</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-center">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading reviews...</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No reviews found.</td></tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="p-4 font-medium text-white">{r.customer_name}</td>
                    <td className="p-4 text-gray-300 text-sm">{r.product_name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-gold-500">
                        <span>{r.rating}</span>
                        <HiStar className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400 max-w-xs truncate" title={r.review_text}>
                      {r.review_text}
                    </td>
                    <td className="p-4 text-center">
                      {r.is_approved ? (
                        <span className="badge border px-2 py-0.5 uppercase tracking-wider text-[10px] text-green-400 bg-green-400/10 border-green-400/30">Approved</span>
                      ) : (
                        <span className="badge border px-2 py-0.5 uppercase tracking-wider text-[10px] text-amber-400 bg-amber-400/10 border-amber-400/30">Pending</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!r.is_approved && (
                          <button 
                            onClick={() => handleApprove(r.id)} 
                            className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                            title="Approve Review"
                          >
                            <HiCheck className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(r.id)} 
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Review"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
