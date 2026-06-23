import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiLockClosed, HiShieldCheck, HiOutlineCheckCircle, HiChevronLeft,
  HiQrcode
} from 'react-icons/hi';

export default function PaymentGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const method = searchParams.get('method') || 'phonepe';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (!orderId) {
      toast.error('Invalid order reference');
      navigate('/cart');
      return;
    }

    const fetchOrder = async () => {
      try {
        const { data } = await orderAPI.getById(orderId);
        setOrder(data);
      } catch (err) {
        toast.error('Failed to load transaction details');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const handleCompletePayment = async () => {
    setPaymentProcessing(true);
    const mockTxnId = `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setTransactionId(mockTxnId);

    try {
      // Wait for a simulated payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update order status on the backend
      await orderAPI.pay(orderId, {
        payment_method: method,
        transaction_id: mockTxnId
      });

      setPaymentSuccess(true);

      // Redirect back to orders after success animation
      setTimeout(() => {
        toast.success('Payment completed successfully! 🎉');
        navigate('/orders');
      }, 3000);
    } catch (err) {
      toast.error('Payment verification failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-dark-600 border-t-gold-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-400">Contacting merchant server...</p>
      </div>
    );
  }

  // UPI VPA merchant strings
  const merchantVpa = 'styleheaven@ybl';
  const merchantName = 'Style Heaven Mens Wear';

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-dark-800 rounded-3xl shadow-card overflow-hidden border border-dark-600 relative">
        
        {/* Gateway Header */}
        <div className="px-6 py-4 bg-dark-900 text-white flex items-center justify-between border-b border-dark-600">
          <button onClick={() => navigate('/checkout')} className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-xs transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
            <HiLockClosed className="w-4 h-4 text-gold-500" /> Secure checkout
          </div>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-6 bg-dark-900/50 border-b border-dark-600 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-sm text-white uppercase tracking-wide">{merchantName}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Order Ref: #{orderId?.substring(0, 8)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-500">Amount to Pay</p>
            <p className="text-2xl font-black text-gold-400">₹{order?.total_price?.toLocaleString()}</p>
          </div>
        </div>

        {/* Dynamic App Layouts */}
        <div className="p-6 space-y-6">
          
          {method === 'phonepe' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 p-4 bg-[#8f55df]/5 border border-[#8f55df]/15 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#8f55df] flex items-center justify-center shrink-0 shadow-lg text-white font-black text-sm">
                  P
                </div>
                <div>
                  <h2 className="font-bold text-xs text-[#8f55df] uppercase tracking-wider">PhonePe</h2>
                  <p className="text-xs text-gray-400">Secure UPI payment linked to bank account</p>
                </div>
              </div>
              
              <div className="space-y-4 bg-dark-900/40 p-4 rounded-2xl border border-dark-600">
                <div className="flex justify-between text-xs text-gray-400 border-b border-dark-600/50 pb-2">
                  <span>Merchant</span>
                  <span className="font-semibold text-white">{merchantName}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 border-b border-dark-600/50 pb-2">
                  <span>Merchant VPA</span>
                  <span className="font-semibold text-white">{merchantVpa}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Amount</span>
                  <span className="font-bold text-gold-400">₹{order?.total_price?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {method === 'gpay' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 p-4 bg-[#4a8df8]/5 border border-[#4a8df8]/15 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#4a8df8] flex items-center justify-center shrink-0 shadow-lg text-white font-bold text-lg">
                  G
                </div>
                <div>
                  <h2 className="font-bold text-xs text-[#4a8df8] uppercase tracking-wider">Google Pay</h2>
                  <p className="text-xs text-gray-400">Faster, safer way to pay with Google</p>
                </div>
              </div>
              
              <div className="space-y-4 bg-dark-900/40 p-4 rounded-2xl border border-dark-600">
                <div className="flex justify-between text-xs text-gray-400 border-b border-dark-600/50 pb-2">
                  <span>Payee</span>
                  <span className="font-semibold text-white">{merchantName}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 border-b border-dark-600/50 pb-2">
                  <span>UPI VPA</span>
                  <span className="font-semibold text-white">{merchantVpa}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Total Amount</span>
                  <span className="font-bold text-[#4a8df8]">₹{order?.total_price?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {method === 'paytm' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 p-4 bg-[#33cbf5]/5 border border-[#33cbf5]/15 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#33cbf5] flex items-center justify-center shrink-0 shadow-lg text-white font-bold text-sm">
                  Pay
                </div>
                <div>
                  <h2 className="font-bold text-xs text-white uppercase tracking-wider">Paytm</h2>
                  <p className="text-xs text-gray-400">Instant UPI wallet payments</p>
                </div>
              </div>

              <div className="space-y-4 bg-dark-900/40 p-4 rounded-2xl border border-dark-600">
                <div className="flex justify-between text-xs text-gray-400 border-b border-dark-600/50 pb-2">
                  <span>Merchant Partner</span>
                  <span className="font-semibold text-white">{merchantName}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 border-b border-dark-600/50 pb-2">
                  <span>UPI Address</span>
                  <span className="font-semibold text-white">{merchantVpa}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Total Payable</span>
                  <span className="font-bold text-[#33cbf5]">₹{order?.total_price?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {method === 'any' && (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="flex justify-center mb-2">
                <div className="p-4 bg-white rounded-3xl border border-dark-600 shadow-inner relative group">
                  <HiQrcode className="w-36 h-36 text-dark-900" />
                  <div className="absolute inset-0 bg-dark-900/90 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                    <p className="text-[10px] font-bold text-gold-400 px-4">Static UPI scan simulation</p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-400">Scan this QR code using any UPI app (BHIM, CRED, GPay) or click below to simulate app launch.</p>
              
              <div className="space-y-3 bg-dark-900/40 p-4 rounded-2xl border border-dark-600 text-left">
                <div className="flex justify-between text-xs text-gray-400 pb-2 border-b border-dark-600/50">
                  <span>Merchant VPA</span>
                  <span className="font-mono font-semibold text-white">{merchantVpa}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Total Amount</span>
                  <span className="font-bold text-gold-400">₹{order?.total_price?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cards / Netbanking / Wallets generic mockup */}
          {!['phonepe', 'gpay', 'paytm', 'any'].includes(method) && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 p-4 bg-gold-500/5 border border-gold-500/10 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center shrink-0 shadow-gold text-dark-900">
                  <HiShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-xs text-gold-400 uppercase tracking-wider">Online payment</h2>
                  <p className="text-xs text-gray-400">{method.toUpperCase()} Payment channel</p>
                </div>
              </div>

              <div className="space-y-4 bg-dark-900/40 p-4 rounded-2xl border border-dark-600">
                <div className="flex justify-between text-xs text-gray-400 border-b border-dark-600/50 pb-2">
                  <span>Merchant</span>
                  <span className="font-semibold text-white">{merchantName}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 border-b border-dark-600/50 pb-2">
                  <span>Channel</span>
                  <span className="font-semibold text-white uppercase">{method}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Total Payable</span>
                  <span className="font-bold text-gold-400">₹{order?.total_price?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Pay Button */}
          <button
            type="button"
            onClick={handleCompletePayment}
            disabled={paymentProcessing || paymentSuccess}
            className="w-full py-4 bg-gradient-luxury hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:bg-dark-600 text-dark-900 font-bold text-base rounded-2xl shadow-gold shadow-gold/10 hover:shadow-gold-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {paymentProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                Verifying transaction...
              </>
            ) : paymentSuccess ? (
              'Payment Completed ✓'
            ) : (
              `Pay ₹${order?.total_price?.toLocaleString()} Now`
            )}
          </button>

          <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
            <HiShieldCheck className="w-3.5 h-3.5 text-green-500" /> Powered by Secure UPI Platform
          </p>
        </div>

        {/* Fullscreen Payment Processing Success Modal */}
        <AnimatePresence>
          {paymentSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-900 z-[110] flex flex-col items-center justify-center p-6 text-center space-y-6"
            >
              {/* Checkmark animation */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400"
              >
                <HiOutlineCheckCircle className="w-12 h-12" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Payment Successful</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Your payment of <span className="font-bold text-gold-400">₹{order?.total_price?.toLocaleString()}</span> was securely transferred to {merchantName}.
                </p>
              </div>

              <div className="bg-dark-800 border border-dark-600 p-4 rounded-2xl w-full max-w-xs space-y-2 text-left shadow-card">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Merchant</span>
                  <span className="font-bold text-white">{merchantName}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Transaction ID</span>
                  <span className="font-mono font-bold text-white">{transactionId}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Method</span>
                  <span className="font-bold text-white uppercase">{method}</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-500">
                <div className="w-6 h-6 border-2 border-dark-600 border-t-gold-500 rounded-full animate-spin mx-auto mb-2" />
                Redirecting back to Style Heaven...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
