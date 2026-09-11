import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiLockClosed,
  HiShieldCheck,
  HiChevronLeft,
  HiClock,
  HiClipboardCopy,
  HiCheck,
  HiSparkles,
  HiCreditCard,
  HiRefresh,
} from 'react-icons/hi';
import phonepeQr from '../assets/phonepe_qr.png';

export default function PaymentGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const method = searchParams.get('method') || 'razorpay';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refNo, setRefNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waLink, setWaLink] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [razorpayLaunching, setRazorpayLaunching] = useState(false);
  const [activeTab, setActiveTab] = useState(
    method === 'phonepe' || method === 'manual' ? 'artisan_upi' : 'razorpay'
  );

  // Get razorpay data passed from Checkout via navigate state
  const razorpayData = location.state?.razorpay || null;

  // Load Razorpay official script
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Launch Razorpay Standard Web Checkout
  const launchRazorpay = useCallback(
    async (rzpData, orderData) => {
      setRazorpayLaunching(true);
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Razorpay payment gateway failed to load. Please check your internet connection.');
        setRazorpayLaunching(false);
        return;
      }

      const keyId =
        rzpData?.key_id ||
        process.env.REACT_APP_RAZORPAY_KEY_ID ||
        '';

      const options = {
        key: keyId,
        amount: rzpData.amount,
        currency: rzpData.currency || 'INR',
        name: 'KalaStyle AI',
        description: `Order #${orderData?.order_number || orderId?.substring(0, 8)}`,
        order_id: rzpData.order_id,
        prefill: {
          name: orderData?.shipping_name || orderData?.users?.name || '',
          contact: orderData?.phone || '',
          email: orderData?.users?.email || '',
        },
        theme: {
          color: '#D4AF37', // KalaStyle luxury gold
        },
        modal: {
          ondismiss: () => {
            setRazorpayLaunching(false);
            toast.error('Payment was not completed. Your order has not been confirmed as paid.');
          },
        },
        handler: async (response) => {
          try {
            const toastId = toast.loading('Verifying secure payment with server...');
            const verifyRes = await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            toast.dismiss(toastId);

            if (verifyRes.data?.success) {
              toast.success('Payment successful! 🎉 Order confirmed.');
              setSubmitted(true);
              setTimeout(() => {
                navigate(`/orders/${orderId}/tracking`);
              }, 1200);
            } else {
              toast.error('Payment verification failed on server.');
            }
          } catch (err) {
            toast.dismiss();
            toast.error(
              err.response?.data?.error ||
                'Payment verification failed. Please contact support.'
            );
            console.error('Razorpay verification error:', err);
          } finally {
            setRazorpayLaunching(false);
          }
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          console.warn('[Razorpay] Payment failed event:', resp.error);
          toast.error(resp.error?.description || 'Payment failed. Please retry.');
          setRazorpayLaunching(false);
        });
        rzp.open();
      } catch (err) {
        console.error('Failed to open Razorpay modal:', err);
        toast.error('Could not open payment window. Please try again.');
        setRazorpayLaunching(false);
      }
    },
    [orderId, navigate]
  );

  // Auto-launch Razorpay if razorpayData is available from navigation state
  useEffect(() => {
    if (razorpayData && order && !submitted && activeTab === 'razorpay') {
      launchRazorpay(razorpayData, order);
    }
  }, [razorpayData, order, submitted, activeTab, launchRazorpay]);

  // Load Order details on mount
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
        if (data?.transaction_id) {
          setRefNo(data.transaction_id);
        }
        if (
          data?.payment_status === 'paid' ||
          data?.payment_status === 'pending_verification' ||
          data?.status === 'payment_verification_pending'
        ) {
          setSubmitted(true);
        }
      } catch (err) {
        toast.error('Failed to load transaction details');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  // Trigger manual Razorpay checkout on button click
  const handleTriggerRazorpay = async () => {
    if (razorpayData) {
      return launchRazorpay(razorpayData, order);
    }

    // Try using razorpay_order_id stored on the order
    const orderTotal = Number(order?.total_amount || order?.total_price || 0);
    const amountInPaise = Math.round(orderTotal * 100);

    if (order?.razorpay_order_id) {
      return launchRazorpay(
        {
          order_id: order.razorpay_order_id,
          key_id: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: amountInPaise,
          currency: 'INR',
        },
        order
      );
    }

    // Otherwise check payment details
    try {
      setRazorpayLaunching(true);
      const { data: pmtData } = await paymentAPI.getPayment(orderId);
      if (pmtData?.payment?.provider_order_id) {
        return launchRazorpay(
          {
            order_id: pmtData.payment.provider_order_id,
            key_id: process.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: amountInPaise,
            currency: 'INR',
          },
          order
        );
      }
      toast.error('No Razorpay order found. Please retry placing your order.');
    } catch (err) {
      toast.error('Could not initialize payment session.');
    } finally {
      setRazorpayLaunching(false);
    }
  };

  // Handle manual UTR submission for direct artisan payment
  const handleSubmitRef = async (e) => {
    e.preventDefault();
    const cleanRef = refNo.replace(/\D/g, '').trim();

    if (!cleanRef || cleanRef.length < 6) {
      return toast.error('Please enter a valid Reference Number / UTR (e.g. 12 digits)');
    }

    setSubmitting(true);
    try {
      const res = await orderAPI.pay(orderId, {
        payment_method: 'upi_phonepe',
        transaction_id: cleanRef,
        ref_no: cleanRef,
        utr_number: cleanRef,
      });

      const updated = res.data;
      let link = updated.whatsappLink;
      const targetNumber = updated.artisanPhone || '917349083982';
      const artisanName = updated.artisanStoreName || 'Artisan';

      if (!link) {
        const itemsText = (order?.items || [])
          .map(
            (i) =>
              `• ${i.product?.name || 'Item'} (Size: ${i.size || 'Standard'}, Qty: ${i.quantity || 1}) - ₹${((i.price_at_time || 0) * (i.quantity || 1)).toLocaleString()}`
          )
          .join('\n');
        const msg = `👋 *Hello ${artisanName}!*\n----------------------------------------\nI have made the UPI payment for Order *#${orderId?.substring(0, 8)}*.\n\n👤 *Customer Name:* ${order?.users?.name || 'Customer'}\n📞 *Phone Number:* +91 ${order?.phone || ''}\n📍 *Shipping Address:* ${order?.shipping_address || 'N/A'}\n🔑 *Submitted UTR / Ref. No:* *${cleanRef}*\n💰 *Payment Method:* PhonePe / UPI\n💵 *Total Amount:* ₹${(order?.total_amount || order?.total_price)?.toLocaleString()}\n\n🛒 *Items:*\n${itemsText || 'No items'}\n========================================\n⚡ Please check your UPI / Bank account for UTR *${cleanRef}* and confirm my order in your Artisan Dashboard!`;
        link = `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
      }
      setWaLink(link);
      setSubmitted(true);
      toast.success(`Payment UTR sent to ${artisanName} for confirmation! ⏳`);

      try {
        window.open(link, '_blank', 'noopener,noreferrer');
      } catch (openErr) {
        console.warn('Auto open WhatsApp popup blocked:', openErr);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit payment reference number');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUpi = (upiString) => {
    navigator.clipboard.writeText(upiString);
    setCopiedUpi(true);
    toast.success('Artisan UPI ID copied to clipboard! 📋');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-dark-600 border-t-gold-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-400">Loading secure payment gateway...</p>
      </div>
    );
  }

  const orderTotal = Number(order?.total_amount || order?.total_price || 0);
  const primaryArtisan = order?.primary_artisan || order?.items?.[0]?.product?.artisan || null;
  const payeeName = primaryArtisan?.store_name || 'KalaStyle AI Artisan Marketplace';
  const artisanUpiId = primaryArtisan?.upi_id || '7349083982@upi';
  const customQrImage = primaryArtisan?.upi_qr_code;

  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(artisanUpiId)}&pn=${encodeURIComponent(payeeName)}&am=${orderTotal}&cu=INR&tn=${encodeURIComponent('Order #' + (orderId?.substring(0, 8) || ''))}`;
  const dynamicQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiIntentUrl)}`;
  const displayQr = customQrImage || dynamicQrCode || phonepeQr;

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-dark-800 rounded-3xl shadow-card overflow-hidden border border-dark-600 relative">
        {/* Gateway Header */}
        <div className="px-6 py-4 bg-dark-900 text-white flex items-center justify-between border-b border-dark-600">
          <button
            onClick={() => navigate('/orders')}
            className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            <HiChevronLeft className="w-4 h-4" /> My Orders
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
            <HiLockClosed className="w-4 h-4 text-gold-500" /> Secure Payment Gateway
          </div>
        </div>

        {/* Order Summary Header */}
        <div className="p-5 bg-dark-900/70 border-b border-dark-600 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gold-400/90 font-mono">
              Order #{order?.order_number || orderId?.substring(0, 8)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {order?.items?.length || 1} craft product{(order?.items?.length || 1) > 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Payable</p>
            <p className="text-2xl font-black text-gold-400">₹{orderTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        {!submitted && (
          <div className="grid grid-cols-2 p-1.5 bg-dark-900/90 border-b border-dark-600 text-xs font-bold">
            <button
              onClick={() => setActiveTab('razorpay')}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'razorpay'
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <HiCreditCard className="w-4 h-4" /> Razorpay Checkout
            </button>
            <button
              onClick={() => setActiveTab('artisan_upi')}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'artisan_upi'
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <HiSparkles className="w-4 h-4" /> Direct Artisan QR
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 space-y-6">
          {submitted ? (
            /* Completed / Pending Verification State */
            <div className="py-6 text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-400">
                <HiCheck className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Payment Processed!</h2>
                <p className="text-xs text-green-400 font-semibold uppercase tracking-wider bg-green-500/10 border border-green-500/20 py-1 px-3 rounded-full inline-block">
                  ✓ Order Confirmed
                </p>
              </div>

              <div className="bg-dark-900/80 border border-dark-600 p-4 rounded-2xl text-left space-y-2 font-mono text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Order ID:</span>
                  <span className="text-white font-bold">
                    #{order?.order_number || orderId?.substring(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total Amount:</span>
                  <span className="text-white font-bold">₹{orderTotal.toLocaleString()}</span>
                </div>
                {refNo && (
                  <div className="flex justify-between text-gray-400">
                    <span>UTR / Ref No:</span>
                    <span className="text-gold-400 font-bold">{refNo}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/orders/${orderId}/tracking`)}
                  className="flex-1 py-3.5 bg-gradient-luxury text-dark-900 font-bold text-xs rounded-xl transition-all shadow-gold cursor-pointer"
                >
                  Track Package 📦
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="py-3.5 px-4 bg-dark-700 hover:bg-dark-600 text-white font-bold text-xs rounded-xl transition-all border border-dark-500 cursor-pointer"
                >
                  My Orders
                </button>
              </div>
            </div>
          ) : activeTab === 'razorpay' ? (
            /* ─── TAB 1: Razorpay Standard Web Checkout ─── */
            <div className="space-y-6 text-center">
              <div className="bg-dark-900/60 border border-dark-600 rounded-2xl p-5 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400">
                  <HiLockClosed className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="font-bold text-white text-base">Razorpay Secure Checkout</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Pay securely using UPI apps, Cards, or NetBanking. Verified directly with our backend.
                  </p>
                </div>

                {/* Supported Methods Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-gray-300 font-medium">
                  <div className="bg-dark-800 p-2 rounded-xl border border-dark-600">
                    <span className="block text-gold-400 text-sm mb-0.5">⚡</span>
                    UPI & QR
                  </div>
                  <div className="bg-dark-800 p-2 rounded-xl border border-dark-600">
                    <span className="block text-gold-400 text-sm mb-0.5">💳</span>
                    Cards
                  </div>
                  <div className="bg-dark-800 p-2 rounded-xl border border-dark-600">
                    <span className="block text-gold-400 text-sm mb-0.5">🏦</span>
                    NetBanking
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handleTriggerRazorpay}
                disabled={razorpayLaunching}
                className="w-full py-4 bg-gradient-luxury hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 text-dark-900 font-bold text-sm rounded-xl shadow-gold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {razorpayLaunching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                    Preparing secure payment...
                  </>
                ) : (
                  <>Pay ₹{orderTotal.toLocaleString()} with Razorpay 🔒</>
                )}
              </button>

              <p className="text-[11px] text-gray-400">
                Closing the popup will not cancel your order. You can re-open it at any time.
              </p>
            </div>
          ) : (
            /* ─── TAB 2: Direct Artisan QR + UTR ─── */
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="bg-white p-4 rounded-2xl border-2 border-gold-500/40 inline-block shadow-2xl relative group max-w-[280px]">
                  <img
                    src={displayQr}
                    alt={`UPI QR Code - ${payeeName}`}
                    className="w-56 h-56 mx-auto rounded-lg object-contain"
                  />
                  <div className="mt-2.5 pt-2 border-t border-gray-200 text-center">
                    <p className="text-xs font-bold text-gray-900 tracking-wider truncate">
                      {payeeName}
                    </p>
                    <p className="text-[10px] text-gray-600 font-medium">
                      Scan using PhonePe · GPay · Paytm · BHIM
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-dark-900 border border-dark-600 max-w-xs mx-auto">
                    <span className="text-xs text-gray-400 font-mono">
                      UPI: <strong className="text-white">{artisanUpiId}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyUpi(artisanUpiId)}
                      className="px-2.5 py-1 bg-dark-700 hover:bg-dark-600 text-gold-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-dark-500 cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <HiCheck className="w-3.5 h-3.5 text-green-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <HiClipboardCopy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  <a
                    href={upiIntentUrl}
                    className="sm:hidden inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition-all no-underline"
                  >
                    ⚡ Open in PhonePe / GPay App
                  </a>
                </div>
              </div>

              {/* Reference Number Submission Form */}
              <form onSubmit={handleSubmitRef} className="space-y-4 pt-2 border-t border-dark-600">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                    Ref. No. / UTR No. <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    required
                    maxLength={12}
                    placeholder="Enter 12-digit Ref. No. (e.g. 423198765432)"
                    className="input-field w-full text-base font-mono font-bold tracking-wider bg-dark-900 border-gold-500/50 focus:border-gold-400 text-gold-300"
                  />
                  <p className="text-[11px] text-gray-400">
                    Enter the UTR / Ref. No. shown on your UPI app receipt after payment.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !refNo.trim()}
                  className="w-full py-4 bg-gradient-luxury hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 text-dark-900 font-bold text-sm rounded-xl shadow-gold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                      Submitting Ref. No...
                    </>
                  ) : (
                    'Submit Ref. No. for Verification 🚀'
                  )}
                </button>
              </form>
            </div>
          )}

          <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
            <HiShieldCheck className="w-3.5 h-3.5 text-green-500" /> KalaStyle AI 256-Bit SSL
            Encrypted Checkout
          </p>
        </div>
      </div>
    </div>
  );
}
