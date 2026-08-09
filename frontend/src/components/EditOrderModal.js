import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiPencilAlt, HiCheck } from 'react-icons/hi';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function EditOrderModal({ isOpen, onClose, order, onOrderUpdated, remainingTimeText }) {
  const [shippingAddress, setShippingAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [itemSizes, setItemSizes] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setShippingAddress(order.shipping_address || '');
      setPhone(order.phone || '');
      setPaymentMethod(order.payment_method || 'cod');

      const initialSizes = {};
      (order.items || []).forEach(item => {
        initialSizes[item.id] = item.size || 'M';
      });
      setItemSizes(initialSizes);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSizeChange = (itemId, newSize) => {
    setItemSizes(prev => ({
      ...prev,
      [itemId]: newSize
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      return toast.error('Please enter a valid shipping address');
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return toast.error('Phone number must contain exactly 10 digits');
    }

    setSubmitting(true);
    try {
      const payload = {
        shipping_address: shippingAddress.trim(),
        phone: cleanPhone,
        payment_method: paymentMethod,
        item_sizes: itemSizes
      };

      const { data: updatedOrder } = await orderAPI.updateOrderDetails(order.id, payload);
      toast.success('Order details updated successfully! ✨');
      if (onOrderUpdated) {
        onOrderUpdated(updatedOrder);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update order details';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-dark-800 rounded-2xl border border-dark-600 shadow-card w-full max-w-xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-dark-600 bg-dark-900/60">
            <div>
              <div className="flex items-center gap-2">
                <HiPencilAlt className="w-5 h-5 text-gold-400" />
                <h2 className="text-xl font-bold text-white">Edit Order Details</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Order #{order.id?.substring(0, 8)} • <span className="text-gold-400 font-semibold">⏱️ {remainingTimeText}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* 1. Item Size Modifications */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Product Sizes
                </label>
                <div className="space-y-3 bg-dark-900/60 p-4 rounded-xl border border-dark-600">
                  {order.items.map((item) => {
                    const availableSizes = item.product?.sizes && Array.isArray(item.product.sizes) && item.product.sizes.length > 0
                      ? item.product.sizes
                      : AVAILABLE_SIZES;

                    return (
                      <div key={item.id} className="flex items-center justify-between gap-4 py-2 border-b border-dark-600/50 last:border-b-0">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.product?.image_url && (
                            <img
                              src={item.product.image_url}
                              alt=""
                              className="w-12 h-14 object-cover rounded bg-dark-900 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {item.product?.name || 'Product'}
                            </p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400 font-medium">Size:</span>
                          <select
                            value={itemSizes[item.id] || item.size || 'M'}
                            onChange={(e) => handleSizeChange(item.id, e.target.value)}
                            className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-gold-400 font-bold focus:border-gold-500 outline-none"
                          >
                            {availableSizes.map((sz) => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Shipping Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Delivery Address <span className="text-red-400">*</span>
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
                required
                placeholder="Enter complete shipping address (House No, Street, City, State, Pincode)"
                className="input-field w-full text-sm bg-dark-900 border-dark-600 focus:border-gold-500"
              />
            </div>

            {/* 3. Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Contact Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                maxLength={10}
                minLength={10}
                pattern="\d{10}"
                placeholder="10-digit mobile number (e.g. 9876543210)"
                className="input-field w-full text-sm bg-dark-900 border-dark-600 focus:border-gold-500 font-mono tracking-wider"
              />
              <p className="text-[11px] text-gray-500">Must contain exactly 10 digits.</p>
            </div>

            {/* 4. Payment Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-field w-full text-sm bg-dark-900 border-dark-600 focus:border-gold-500 text-gray-200 capitalize"
              >
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="upi">UPI / GPay / PhonePe</option>
              </select>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-dark-600 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn-secondary px-5 py-2.5 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-6 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-gold"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <HiCheck className="w-4 h-4" /> Save Order Changes
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
