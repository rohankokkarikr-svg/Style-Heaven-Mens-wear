import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiLockClosed, HiShieldCheck, HiChevronLeft, HiClock, HiClipboardCopy, HiCheck, HiSparkles
} from 'react-icons/hi';
import phonepeQr from '../assets/phonepe_qr.png';

export default function PaymentGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const method = searchParams.get('method') || 'phonepe';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refNo, setRefNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waLink, setWaLink] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

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
        if (data?.payment_status === 'pending_verification' || data?.status === 'payment_verification_pending') {
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

  const handleSubmitRef = async (e) => {
    e.preventDefault();
    const cleanRef = refNo.replace(/\D/g, '').trim();

    if (!cleanRef || cleanRef.length < 6) {
      return toast.error('Please enter a valid Reference Number / UTR (e.g. 12 digits)');
    }

    setSubmitting(true);
    try {
      const res = await orderAPI.pay(orderId, {
        payment_method: method || 'upi_phonepe',
        transaction_id: cleanRef,
        ref_no: cleanRef
      });

      let link = res.data?.whatsappLink;
      if (!link) {
        const adminPhone = '917349083982';
        const itemsText = (order?.items || []).map(i => `• ${i.product?.name || 'Item'} (Size: ${i.size}, Qty: ${i.quantity}) - ₹${((i.price_at_time || 0) * (i.quantity || 1)).toLocaleString()}`).join('\n');
        const msg = `⏱️ *UPI Payment Ref. No. Submitted!*\n----------------------------------------\n📦 *Order ID:* #${orderId?.substring(0, 8)}\n👤 *Customer Name:* ${order?.users?.name || 'Customer'}\n📞 *Phone Number:* +91 ${order?.phone || ''}\n📍 *Shipping Address:* ${order?.shipping_address || 'N/A'}\n🔑 *Submitted Ref. No / UTR:* ${cleanRef}\n💰 *Payment Method:* PhonePe / UPI\n💵 *Total Amount:* ₹${order?.total_price?.toLocaleString()}\n\n🛒 *Items:*\n${itemsText || 'No items'}\n========================================\n⌛ *Status:* Pending Admin Payment Verification`;
        link = `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
      }
      setWaLink(link);
      setSubmitted(true);
      toast.success('Payment Ref. No. submitted for Admin Verification! ⏳');

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
        <p className="text-sm font-medium text-gray-400">Loading artisan payment details...</p>
      </div>
    );
  }

  // Determine Artisan Payment Profile
  const primaryArtisan = order?.primary_artisan || order?.items?.[0]?.product?.artisan || null;
  const payeeName = primaryArtisan?.store_name || 'KalaStyle AI Artisan Marketplace';
  const artisanUpiId = primaryArtisan?.upi_id || '7349083982@upi';
  const customQrImage = primaryArtisan?.upi_qr_code;

  // Generate standard UPI payment link (opens PhonePe, GPay, Paytm on mobile)
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(artisanUpiId)}&pn=${encodeURIComponent(payeeName)}&am=${order?.total_price || 0}&cu=INR&tn=${encodeURIComponent('Order #' + (orderId?.substring(0, 8) || ''))}`;
  const dynamicQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiIntentUrl)}`;
  const displayQr = customQrImage || dynamicQrCode || phonepeQr;

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-dark-800 rounded-3xl shadow-card overflow-hidden border border-dark-600 relative">
        
        {/* Gateway Header */}
        <div className="px-6 py-4 bg-dark-900 text-white flex items-center justify-between border-b border-dark-600">
          <button onClick={() => navigate('/orders')} className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-xs transition-colors cursor-pointer">
            <HiChevronLeft className="w-4 h-4" /> My Orders
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
            <HiLockClosed className="w-4 h-4 text-gold-500" /> Artisan UPI Gateway
          </div>
        </div>

        {/* Artisan Payee Summary Header */}
        <div className="p-5 bg-dark-900/70 border-b border-dark-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {primaryArtisan?.profile_image ? (
              <img src={primaryArtisan.profile_image} alt={payeeName} className="w-11 h-11 rounded-full object-cover border border-gold-500/40" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-xl">🧑‍🎨</div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm text-white tracking-wide">{payeeName}</h1>
                <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full font-bold">Artisan</span>
              </div>
              <p className="text-[11px] text-gold-400/90 font-mono mt-0.5">Order ID: #{orderId?.substring(0, 8)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Payable</p>
            <p className="text-2xl font-black text-gold-400">₹{order?.total_price?.toLocaleString()}</p>
          </div>
        </div>

        {/* Direct Artisan Badge Banner */}
        <div className="px-5 py-2.5 bg-gold-500/10 border-b border-gold-500/20 flex items-center justify-between text-xs text-gold-300">
          <span className="flex items-center gap-1.5 font-medium">
            <HiSparkles className="w-4 h-4 text-gold-400" /> 100% Direct Artisan Payment
          </span>
          <span className="text-[11px] text-gray-400">0% Commission</span>
        </div>

        {/* QR Code and Reference Number Container */}
        <div className="p-6 space-y-6">

          {!submitted ? (
            <>
              {/* Artisan QR Code Image Display */}
              <div className="text-center space-y-3">
                <div className="bg-white p-4 rounded-2xl border-2 border-gold-500/40 inline-block shadow-2xl relative group max-w-[280px]">
                  <img
                    src={displayQr}
                    alt={`UPI QR Code - ${payeeName}`}
                    className="w-56 h-56 mx-auto rounded-lg object-contain"
                  />
                  <div className="mt-2.5 pt-2 border-t border-gray-200 text-center">
                    <p className="text-xs font-bold text-gray-900 tracking-wider truncate">{payeeName}</p>
                    <p className="text-[10px] text-gray-600 font-medium">Scan using PhonePe · GPay · Paytm · BHIM</p>
                  </div>
                </div>

                {/* 1-Click Copy UPI ID & Mobile App Launcher */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-dark-900 border border-dark-600 max-w-xs mx-auto">
                    <span className="text-xs text-gray-400 font-mono">UPI: <strong className="text-white">{artisanUpiId}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopyUpi(artisanUpiId)}
                      className="px-2.5 py-1 bg-dark-700 hover:bg-dark-600 text-gold-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-dark-500 cursor-pointer"
                    >
                      {copiedUpi ? <><HiCheck className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><HiClipboardCopy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>

                  {/* Mobile Direct Pay Intent Button */}
                  <a
                    href={upiIntentUrl}
                    className="sm:hidden inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition-all no-underline"
                  >
                    ⚡ Open in PhonePe / GPay App
                  </a>
                </div>

                <div className="space-y-1 pt-1">
                  <p className="text-xs font-semibold text-gold-400">Step 1: Scan Artisan QR Code & Pay ₹{order?.total_price?.toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400">Step 2: Copy the 12-digit Ref. No. / UTR from your UPI app</p>
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
            </>
          ) : (
            /* Pending Admin Verification State */
            <div className="py-6 text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto text-gold-400">
                <HiClock className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Ref. No. Submitted!</h2>
                <p className="text-xs text-gold-400 font-semibold uppercase tracking-wider bg-gold-500/10 border border-gold-500/20 py-1 px-3 rounded-full inline-block">
                  ⏱️ Pending Payment Verification
                </p>
              </div>

              <div className="bg-dark-900/80 border border-dark-600 p-4 rounded-2xl text-left space-y-2 font-mono text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Order ID:</span>
                  <span className="text-white font-bold">#{orderId?.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Payee Artisan:</span>
                  <span className="text-white font-bold truncate max-w-[180px]">{payeeName}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Submitted Ref. No:</span>
                  <span className="text-gold-400 font-bold">{refNo || order?.transaction_id}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total Amount:</span>
                  <span className="text-white font-bold">₹{order?.total_price?.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed px-2">
                Thank you! Your payment reference number has been received. Your artisan order is now being processed.
              </p>

              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.143 4.174 4.29-1.125z" />
                  </svg>
                  Send Ref. No. on WhatsApp 🚀
                </a>
              )}

              <button
                onClick={() => navigate('/orders')}
                className="w-full py-3.5 bg-dark-700 hover:bg-dark-600 text-white font-bold text-xs rounded-xl transition-all border border-dark-500 cursor-pointer"
              >
                Go to My Orders
              </button>
            </div>
          )}

          <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
            <HiShieldCheck className="w-3.5 h-3.5 text-green-500" /> Direct Artisan UPI Settlement & Secure Handshake
          </p>
        </div>

      </div>
    </div>
  );
}

