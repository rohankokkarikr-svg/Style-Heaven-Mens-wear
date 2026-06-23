import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, couponAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiShieldCheck, HiTruck, HiUser, HiPhone, HiLocationMarker,
  HiCheckCircle, HiArrowRight, HiArrowLeft, HiTag, HiExclamationCircle,
  HiLockClosed, HiReceiptTax, HiCash, HiRefresh, HiMap, HiX
} from 'react-icons/hi';

/* ─── Field error ─── */
const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
      <HiExclamationCircle className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </p>
  ) : null;

/* ─── Step indicator ─── */
const steps = [
  { label: 'Delivery Info',    icon: HiLocationMarker },
  { label: 'Review & Confirm', icon: HiShieldCheck },
];

/* ─── LocationIQ/Nominatim reverse-geocode (lat/lng → address) ─── */
async function reverseGeocode(lat, lng) {
  const locationIqKey = process.env.REACT_APP_LOCATIONIQ_API_KEY;
  
  if (locationIqKey && locationIqKey !== 'your_locationiq_api_key' && locationIqKey.trim() !== '') {
    try {
      const res = await fetch(
        `https://us1.locationiq.com/v1/reverse.php?key=${locationIqKey}&lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`
      );
      if (res.ok) {
        return await res.json();
      }
      console.warn('LocationIQ reverse geocode returned non-OK status. Falling back...');
    } catch (liqErr) {
      console.error('LocationIQ reverse geocode API request failed. Falling back...', liqErr);
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&email=support@styleheaven.com`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      return await res.json();
    }
    console.warn('Nominatim reverse geocode returned non-OK status. Attempting fallback...');
  } catch (err) {
    console.warn('Nominatim reverse geocode fetch failed. Attempting fallback...', err);
  }

  // Fallback to BigDataCloud Free Reverse Geocoding Client
  try {
    const fallbackRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (!fallbackRes.ok) throw new Error('BigDataCloud API returned non-OK status');
    
    const bdcData = await fallbackRes.json();
    
    // Normalize response to Nominatim structure expected by caller
    return {
      display_name: [bdcData.locality, bdcData.city, bdcData.principalSubdivision, bdcData.countryName].filter(Boolean).join(', '),
      address: {
        city: bdcData.city || bdcData.locality || '',
        state: bdcData.principalSubdivision || '',
        postcode: bdcData.postcode || '',
        road: bdcData.locality || '',
      }
    };
  } catch (fallbackErr) {
    console.error('All reverse geocoding API requests failed:', fallbackErr);
    throw new Error('Reverse geocode failed');
  }
}

/* ─── LocationIQ/Nominatim forward-geocode (text → location) ─── */
async function forwardGeocode(query) {
  const locationIqKey = process.env.REACT_APP_LOCATIONIQ_API_KEY;
  
  if (locationIqKey && locationIqKey !== 'your_locationiq_api_key' && locationIqKey.trim() !== '') {
    try {
      const res = await fetch(
        `https://us1.locationiq.com/v1/search.php?key=${locationIqKey}&q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&countrycodes=in&accept-language=en`
      );
      if (res.ok) {
        return await res.json();
      }
      console.warn('LocationIQ forward geocode returned non-OK status. Falling back...');
    } catch (liqErr) {
      console.error('LocationIQ forward geocode API request failed. Falling back...', liqErr);
    }
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&countrycodes=in&email=support@styleheaven.com`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Forward geocode failed');
  return res.json();
}

/* ─── Extract fields from Nominatim address object ─── */
function parseNominatimAddress(addr = {}) {
  const city =
    addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
  const state    = addr.state || '';
  const postcode = (addr.postcode || '').replace(/\s/g, '').slice(0, 6);
  const road     = addr.road || addr.neighbourhood || '';
  const quarter  = addr.quarter || addr.suburb || '';
  const street   = [road, quarter].filter(Boolean).join(', ');
  return { city, state, postcode, street };
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]                   = useState(1);
  const [loading, setLoading]             = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const [showLoadingPopup, setShowLoadingPopup] = useState(false);
  const [popupText, setPopupText] = useState('Please wait...');
  const [upiApp, setUpiApp] = useState('phonepe');

  // Card states
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });

  // Netbanking states
  const [selectedBank, setSelectedBank] = useState('sbi');

  // Wallet states
  const [selectedWallet, setSelectedWallet] = useState('paytm');

  const [form, setForm] = useState({
    fullName:     user?.name || '',
    phone:        '',
    confirmPhone: '',
    address:      '',
    landmark:     '',
    city:         '',
    state:        '',
    pinCode:      '',
  });

  const [errors, setErrors] = useState({});

  // ── Location states ──
  const [gpsLoading, setGpsLoading]           = useState(false);
  const [verifyLoading, setVerifyLoading]     = useState(false);
  const [verifyResult, setVerifyResult]       = useState(null); // { ok, display, lat, lng, mapUrl }
  const [addressVerified, setAddressVerified] = useState(false);

  // ── Coupon ──
  const [couponCode, setCouponCode]       = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [discountType, setDiscountType]   = useState('percentage');
  const [couponError, setCouponError]     = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  /* ─── Field helper ─── */
  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
    // If address-related field changes, reset verification
    if (['address', 'city', 'state', 'pinCode'].includes(key)) {
      setAddressVerified(false);
      setVerifyResult(null);
    }
  };

  /* ─── GPS: Use My Location ─── */
  const handleUseMyLocation = useCallback(() => {
    setGpsLoading(true);

    const getPosition = (options) => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
        } else {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        }
      });
    };

    const runGeo = async () => {
      try {
        let pos;
        let coords;
        let isIPFallback = false;

        try {
          // Attempt high accuracy first (useful on mobile devices with actual GPS)
          pos = await getPosition({ enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 });
          coords = pos.coords;
        } catch (err) {
          console.warn('High accuracy geolocation timed out/failed. Falling back to standard accuracy...', err);
          try {
            // Fall back to standard accuracy (fast and extremely reliable on desktop/laptops via IP lookup)
            pos = await getPosition({ enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
            coords = pos.coords;
          } catch (stdErr) {
            console.warn('Standard accuracy geolocation also failed. Falling back to IP-based geolocator...', stdErr);
            isIPFallback = true;
          }
        }

        if (isIPFallback) {
          // Fallback to IP-based geolocation (works on all devices without requesting GPS hardware permissions)
          let ipData;
          try {
            const ipRes = await fetch('https://ipapi.co/json/');
            if (!ipRes.ok) throw new Error('ipapi.co failed');
            ipData = await ipRes.json();
          } catch (ipApiErr) {
            console.warn('ipapi.co failed, trying ipinfo.io...', ipApiErr);
            const ipInfoRes = await fetch('https://ipinfo.io/json');
            if (!ipInfoRes.ok) throw new Error('ipinfo.io failed');
            const ipInfoData = await ipInfoRes.json();
            // Map ipinfo.io structure to similar fields
            const [lat, lng] = (ipInfoData.loc || '').split(',');
            ipData = {
              city: ipInfoData.city,
              region: ipInfoData.region,
              postal: ipInfoData.postal,
              country_name: ipInfoData.country,
              latitude: lat ? parseFloat(lat) : null,
              longitude: lng ? parseFloat(lng) : null,
            };
          }

          if (!ipData.city && !ipData.region) {
            throw new Error('IP geolocation returned empty data');
          }

          setForm(f => ({
            ...f,
            address: ipData.city || '',
            city:    ipData.city || '',
            state:   ipData.region || '',
            pinCode: ipData.postal || '',
          }));

          const mapUrl = ipData.latitude ? `https://www.google.com/maps?q=${ipData.latitude},${ipData.longitude}` : null;
          setVerifyResult({
            ok: true,
            display: [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(', '),
            lat: ipData.latitude || null,
            lng: ipData.longitude || null,
            mapUrl,
          });
          setAddressVerified(true);
          setErrors(e => ({ ...e, address: '', city: '', state: '', pinCode: '' }));
          toast.success('Location detected via IP and auto-filled! ✅');
          return;
        }

        // Standard GPS coordinate translation
        const data = await reverseGeocode(coords.latitude, coords.longitude);
        const addr = data.address || {};
        const { city, state, postcode, street } = parseNominatimAddress(addr);

        // Build a readable street address
        const houseNum = addr.house_number || '';
        const fullStreet = [houseNum, street].filter(Boolean).join(' ');

        setForm(f => ({
          ...f,
          address: fullStreet || data.display_name?.split(',').slice(0, 3).join(', ') || '',
          city:    city,
          state:   state,
          pinCode: postcode,
        }));

        const mapUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
        setVerifyResult({
          ok: true,
          display: data.display_name,
          lat: coords.latitude,
          lng: coords.longitude,
          mapUrl,
        });
        setAddressVerified(true);
        setErrors(e => ({ ...e, address: '', city: '', state: '', pinCode: '' }));
        toast.success('Location detected and auto-filled! ✅');
      } catch (err) {
        console.error('Geolocation error:', err);
        const msgs = {
          1: 'Location permission is denied. Please click the site settings/lock icon in your browser URL bar, enable Location permissions, and make sure your device location services are turned on! 📍',
          2: 'Could not detect your position. Please check that your device Location/GPS is turned on and try again.',
          3: 'Location request timed out. Please check that your device Location/GPS is turned on and try again.',
        };
        toast.error(msgs[err.code] || 'Could not read your location details. Please ensure your device Location/GPS is turned on.', { duration: 6000 });
      } finally {
        setGpsLoading(false);
      }
    };

    runGeo();
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  const shipping = totalPrice > 2000 || (isCouponApplied && discountType === 'free_shipping') ? 0 : 150;
  let discountAmount = 0;
  const isFreeShirtApplied = isCouponApplied && couponCode.trim().toUpperCase().startsWith('FREESHIRT');

  if (isCouponApplied) {
    if (isFreeShirtApplied) {
      const customTshirt = items.find(item => item.product.name === 'Style Heaven Customized T-Shirt');
      if (customTshirt) {
        // Discount exactly one customized T-shirt price
        discountAmount = customTshirt.product.price;
      }
    } else {
      if (discountType === 'percentage') discountAmount = (totalPrice * appliedDiscount) / 100;
      else if (discountType === 'fixed') discountAmount = appliedDiscount;
    }
  }
  const finalTotal = Math.max(0, totalPrice + shipping - discountAmount);

  /* ─── Verify Address ─── */
  const handleVerifyAddress = async () => {
    const query = [form.address, form.city, form.state, form.pinCode, 'India']
      .filter(Boolean).join(', ');

    if (query.replace(/,\s*India/gi, '').trim().length < 10) {
      toast.error('Please enter more address details before verifying');
      return;
    }

    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const results = await forwardGeocode(query);
      if (!results || results.length === 0) {
        setVerifyResult({ ok: false, display: 'Address not found on map. Please check and correct your address.', lat: null, lng: null, mapUrl: null });
        setAddressVerified(false);
        return;
      }
      const place = results[0];
      const addr  = place.address || {};
      const { city, state, postcode } = parseNominatimAddress(addr);

      // Check if key fields roughly match
      const cityMatch  = !form.city  || city.toLowerCase().includes(form.city.toLowerCase())  || form.city.toLowerCase().includes(city.toLowerCase());
      const stateMatch = !form.state || state.toLowerCase().includes(form.state.toLowerCase()) || form.state.toLowerCase().includes(state.toLowerCase());
      const isGood = cityMatch || stateMatch; // at least city or state confirmed

      const mapUrl = `https://www.google.com/maps?q=${place.lat},${place.lon}`;
      setVerifyResult({
        ok: isGood,
        display: place.display_name,
        lat: place.lat,
        lng: place.lon,
        mapUrl,
        detectedCity:    city,
        detectedState:   state,
        detectedPincode: postcode,
      });
      setAddressVerified(isGood);

      if (isGood) {
        toast.success('Address verified successfully! ✅');
      } else {
        toast.error('Address could not be confirmed. Please review the detected location below.');
      }
    } catch {
      toast.error('Verification failed. Please check your internet and try again.');
      setAddressVerified(false);
    } finally {
      setVerifyLoading(false);
    }
  };

  /* ─── Step 1 validation ─── */
  const validateStep1 = () => {
    const e = {};
    const trimmed = (k) => form[k].trim();

    if (!trimmed('fullName') || trimmed('fullName').length < 3)
      e.fullName = 'Enter your full name (at least 3 characters)';

    const digits = form.phone.replace(/\D/g, '');
    if (digits.length !== 10) e.phone = 'Phone must be exactly 10 digits';

    const confirmDigits = form.confirmPhone.replace(/\D/g, '');
    if (!form.confirmPhone) e.confirmPhone = 'Please confirm your phone number';
    else if (digits !== confirmDigits) e.confirmPhone = 'Phone numbers do not match';

    if (trimmed('address').length < 10)
      e.address = 'Please enter a complete address (min 10 characters)';
    if (!trimmed('city'))    e.city    = 'City is required';
    if (!trimmed('state'))   e.state   = 'State is required';
    if (!/^\d{6}$/.test(trimmed('pinCode')))
      e.pinCode = 'Enter a valid 6-digit PIN code';

    if (!addressVerified)
      e.address = (e.address ? e.address + ' · ' : '') + 'Please verify your address before proceeding';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) setStep(2);
    else toast.error('Please fix the highlighted errors before continuing');
  };

  /* ─── Coupon ─── */
  const handleApplyCoupon = async () => {
    setCouponError('');
    const codeUpper = couponCode.trim().toUpperCase();
    if (!codeUpper) { setCouponError('Please enter a coupon code'); return; }

    // Validation for FREESHIRT coupon: check if cart has the customized T-shirt
    if (codeUpper.startsWith('FREESHIRT')) {
      const hasCustomTshirt = items.some(item => item.product.name === 'Style Heaven Customized T-Shirt');
      if (!hasCustomTshirt) {
        setCouponError("This coupon is only valid for the Style Heaven Customized T-Shirt. Add it to your cart first.");
        setIsCouponApplied(false);
        return;
      }
    }

    setCouponApplying(true);
    try {
      const response = await couponAPI.validate(codeUpper);
      const { discount_type, discount_value } = response.data;
      setDiscountType(discount_type);
      setAppliedDiscount(discount_value || 0);
      setIsCouponApplied(true);
      toast.success('Coupon applied! 🎉');
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid or expired coupon code');
      setAppliedDiscount(0);
      setIsCouponApplied(false);
    } finally {
      setCouponApplying(false);
    }
  };

  /* ─── Place Order ─── */
  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const fullAddress = [
        form.address.trim(),
        form.landmark.trim() ? `Landmark: ${form.landmark.trim()}` : '',
        form.city.trim(),
        form.state.trim(),
        `PIN: ${form.pinCode.trim()}`,
        verifyResult?.lat ? `(GPS: ${Number(verifyResult.lat).toFixed(5)}, ${Number(verifyResult.lng).toFixed(5)})` : '',
      ].filter(Boolean).join(', ');

      const orderData = {
        total_price: finalTotal,
        discount_amount: discountAmount,
        coupon_code: isCouponApplied ? couponCode : null,
        shipping_address: fullAddress,
        phone: form.phone.replace(/\D/g, ''),
        payment_method: paymentMethod === 'cod' ? 'cod' : `${paymentMethod}_${paymentMethod === 'upi' ? upiApp : paymentMethod === 'card' ? 'card' : paymentMethod === 'netbanking' ? selectedBank : selectedWallet}`,
        payment_status: 'pending',
        items: items.map(i => ({
          product_id:    i.product.id,
          quantity:      i.quantity,
          price_at_time: i.product.price,
          size:          i.size,
        })),
      };

      const res = await orderAPI.create(orderData);
      const createdOrder = res.data;

      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully! 🎉');
        clearCart();
        navigate('/orders');
      } else {
        // Show simulated loading popup
        setShowLoadingPopup(true);
        setPopupText("Setting up secure payment gateway handshake...");
        
        setTimeout(() => {
          setPopupText("Contacting NPCI servers to resolve VPA...");
          setTimeout(() => {
            setPopupText("UPI application is opening. Please complete payment...");
            setTimeout(() => {
              setShowLoadingPopup(false);
              const methodKey = paymentMethod === 'upi' ? upiApp : paymentMethod;
              navigate(`/payment-gateway?orderId=${createdOrder.id}&method=${methodKey}`);
            }, 1000);
          }, 1200);
        }, 1200);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to place order. Please try again.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) =>
    `input-field transition-all ${errors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}`;

  /* ─── Order Summary ─── */
  const OrderSummary = () => (
    <div className="space-y-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-600 flex items-center gap-2">
          <HiReceiptTax className="w-4 h-4 text-gold-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Order Summary</h3>
        </div>
        <div className="divide-y divide-dark-600 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3 px-5 py-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-dark-700 border border-dark-600">
                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{item.product.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Size: <span className="text-gold-400 font-medium">{item.size}</span>
                  {' · '}Qty: <span className="text-gold-400 font-medium">{item.quantity}</span>
                </p>
              </div>
              <p className="text-gold-400 font-bold text-sm shrink-0">
                ₹{(item.product.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 space-y-2.5 border-t border-dark-600 bg-dark-900/30">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span>₹{totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Shipping</span>
            <span className={shipping === 0 ? 'text-green-400 font-medium' : ''}>
              {shipping === 0 ? '✓ FREE' : `₹${shipping}`}
            </span>
          </div>
          {appliedDiscount > 0 && discountType !== 'free_shipping' && (
            <div className="flex justify-between text-sm text-gold-400 font-medium">
              <span>Coupon Discount {discountType === 'percentage' ? `(${appliedDiscount}%)` : ''}</span>
              <span>–₹{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2.5 border-t border-dark-600">
            <span className="text-white font-bold">Total to Pay</span>
            <span className="text-2xl font-bold text-gold-400">₹{finalTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="bg-dark-800/50 border border-dark-600 rounded-xl p-4 space-y-3">
        {[
          { icon: HiShieldCheck, label: '100% Secure Checkout', sub: 'Your data is encrypted & protected' },
          { icon: HiTruck,       label: 'Free Delivery on ₹2000+', sub: '2-3 business days delivery' },
          { icon: HiCash,        label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="h-1 w-full bg-gradient-luxury" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <HiLockClosed className="w-5 h-5 text-gold-400" />
            <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">Secure Checkout</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white">Complete Your Order</h1>
          <p className="text-gray-400 mt-1 text-sm">Style Heaven · Premium Menswear</p>
        </div>

        {/* Step Progress */}
        <div className="mb-10">
          <div className="flex items-center gap-0 max-w-md">
            {steps.map((s, idx) => {
              const num = idx + 1;
              const done = step > num;
              const active = step === num;
              return (
                <React.Fragment key={s.label}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                      done   ? 'bg-gold-500 border-gold-500 text-dark-900'
                      : active ? 'bg-gold-500/10 border-gold-500 text-gold-400'
                      : 'bg-dark-800 border-dark-500 text-gray-500'
                    }`}>
                      {done ? <HiCheckCircle className="w-5 h-5" /> : num}
                    </div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${
                      active ? 'text-gold-400' : done ? 'text-green-400' : 'text-gray-500'
                    }`}>{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full transition-all duration-500 ${
                      step > idx + 1 ? 'bg-gold-500' : 'bg-dark-600'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Personal Info */}
                  <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 shadow-card">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-dark-600">
                      <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                        <HiUser className="w-4 h-4 text-gold-400" />
                      </div>
                      <h2 className="text-base font-bold text-white">Personal Information</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Full Name *</label>
                        <input type="text" className={inputCls('fullName')} placeholder="e.g. Rohan Kumar"
                          value={form.fullName} onChange={e => setField('fullName', e.target.value)} />
                        <FieldError msg={errors.fullName} />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 shadow-card">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-dark-600">
                      <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                        <HiPhone className="w-4 h-4 text-gold-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Phone Number</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Must match to confirm and prevent fraudulent orders</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-sm text-gray-400 font-medium pointer-events-none">+91</span>
                          <input type="tel" maxLength="10" className={`${inputCls('phone')} pl-11`} placeholder="9876543210"
                            value={form.phone} onChange={e => setField('phone', e.target.value.replace(/\D/g, ''))} />
                        </div>
                        <FieldError msg={errors.phone} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          Confirm Phone * <span className="text-gold-400/70 normal-case font-normal">(re-enter)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-sm text-gray-400 font-medium pointer-events-none">+91</span>
                          <input type="tel" maxLength="10" className={`${inputCls('confirmPhone')} pl-11`} placeholder="Re-enter number"
                            value={form.confirmPhone} onChange={e => setField('confirmPhone', e.target.value.replace(/\D/g, ''))} />
                        </div>
                        {!errors.confirmPhone && form.confirmPhone && form.phone.replace(/\D/g,'') === form.confirmPhone.replace(/\D/g,'') && form.confirmPhone.length === 10 && (
                          <p className="flex items-center gap-1 text-green-400 text-xs mt-1.5">
                            <HiCheckCircle className="w-3.5 h-3.5" /> Numbers match ✓
                          </p>
                        )}
                        <FieldError msg={errors.confirmPhone} />
                      </div>
                    </div>
                  </div>

                  {/* ── Delivery Address with Location Detection ── */}
                  <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-dark-600 flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                          <HiLocationMarker className="w-4 h-4 text-gold-400" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white">Delivery Address</h2>
                          <p className="text-xs text-gray-500 mt-0.5">Use GPS or type your address, then verify it</p>
                        </div>
                      </div>

                      {/* GPS button */}
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={gpsLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {gpsLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                        ) : (
                          <HiLocationMarker className="w-3.5 h-3.5" />
                        )}
                        {gpsLoading ? 'Detecting...' : '📍 Use My Location'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          Full Address * <span className="text-gray-500 normal-case font-normal">(House No., Street, Area)</span>
                        </label>
                        <textarea
                          rows={3}
                          className={`${inputCls('address')} resize-none`}
                          placeholder="e.g. Flat 12B, Rose Apartments, MG Road"
                          value={form.address}
                          onChange={e => setField('address', e.target.value)}
                        />
                        <div className="flex justify-between items-center mt-1">
                          <FieldError msg={errors.address} />
                          <span className={`text-xs ml-auto ${form.address.length < 10 ? 'text-gray-600' : 'text-green-400'}`}>
                            {form.address.length} / 10+ chars
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          Landmark <span className="text-gray-500 normal-case font-normal">(optional)</span>
                        </label>
                        <input type="text" className="input-field" placeholder="e.g. Near City Mall, Opposite Bus Stand"
                          value={form.landmark} onChange={e => setField('landmark', e.target.value)} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">City *</label>
                          <input type="text" className={inputCls('city')} placeholder="Bangalore"
                            value={form.city} onChange={e => setField('city', e.target.value)} />
                          <FieldError msg={errors.city} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">State *</label>
                          <input type="text" className={inputCls('state')} placeholder="Karnataka"
                            value={form.state} onChange={e => setField('state', e.target.value)} />
                          <FieldError msg={errors.state} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">PIN Code *</label>
                        <input type="text" maxLength="6" className={inputCls('pinCode')} placeholder="560001"
                          value={form.pinCode} onChange={e => setField('pinCode', e.target.value.replace(/\D/g, ''))} />
                        <FieldError msg={errors.pinCode} />
                      </div>

                      {/* ── Verify Address button ── */}
                      <button
                        type="button"
                        onClick={handleVerifyAddress}
                        disabled={verifyLoading || gpsLoading}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          addressVerified
                            ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/15'
                            : 'border-gold-500/40 bg-gold-500/5 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500'
                        }`}
                      >
                        {verifyLoading ? (
                          <div className="w-4 h-4 border-2 border-gold-400/40 border-t-gold-400 rounded-full animate-spin" />
                        ) : addressVerified ? (
                          <HiCheckCircle className="w-4 h-4" />
                        ) : (
                          <HiMap className="w-4 h-4" />
                        )}
                        {verifyLoading ? 'Verifying address on map...' : addressVerified ? 'Address Verified ✅' : 'Verify My Address'}
                      </button>

                      {/* ── Verification Result Card ── */}
                      <AnimatePresence>
                        {verifyResult && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className={`rounded-xl border p-4 ${
                              verifyResult.ok
                                ? 'bg-green-500/5 border-green-500/25'
                                : 'bg-red-500/5 border-red-500/25'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                {verifyResult.ok ? (
                                  <HiCheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                                ) : (
                                  <HiX className="w-5 h-5 text-red-400 shrink-0" />
                                )}
                                <p className={`text-sm font-bold ${verifyResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                                  {verifyResult.ok ? 'Address Confirmed on Map' : 'Address Not Found'}
                                </p>
                              </div>
                              <button onClick={() => { setVerifyResult(null); setAddressVerified(false); }}
                                className="text-gray-500 hover:text-white shrink-0">
                                <HiX className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Detected address */}
                            <p className="text-xs text-gray-400 leading-relaxed mb-3">
                              <span className="text-gray-300 font-semibold">Detected location:</span>{' '}
                              {verifyResult.display}
                            </p>

                            {/* Detected vs entered comparison */}
                            {verifyResult.ok && (
                              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                {[
                                  { label: 'City',    detected: verifyResult.detectedCity,    entered: form.city },
                                  { label: 'State',   detected: verifyResult.detectedState,   entered: form.state },
                                  { label: 'Pincode', detected: verifyResult.detectedPincode, entered: form.pinCode },
                                ].map(({ label, detected, entered }) => {
                                  const match = detected && entered &&
                                    (detected.toLowerCase().includes(entered.toLowerCase()) ||
                                     entered.toLowerCase().includes(detected.toLowerCase()));
                                  return (
                                    <div key={label} className="bg-dark-800/70 rounded-lg p-2">
                                      <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">{label}</p>
                                      <p className="text-white font-medium truncate">{detected || '—'}</p>
                                      {detected && entered && (
                                        <p className={`text-[10px] mt-0.5 ${match ? 'text-green-400' : 'text-yellow-400'}`}>
                                          {match ? '✓ Matches' : `You entered: ${entered}`}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Free Embedded Map */}
                            {verifyResult.lat && verifyResult.lng && (
                              <div className="mt-4 mb-4 rounded-xl overflow-hidden border border-dark-600 h-48 w-full bg-dark-900 relative">
                                <iframe
                                  title="Delivery Location Map"
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  scrolling="no"
                                  marginHeight="0"
                                  marginWidth="0"
                                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(verifyResult.lng) - 0.005},${Number(verifyResult.lat) - 0.005},${Number(verifyResult.lng) + 0.005},${Number(verifyResult.lat) + 0.005}&layer=mapnik&marker=${verifyResult.lat},${verifyResult.lng}`}
                                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                                />
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 flex-wrap">
                              {verifyResult.lat && verifyResult.lng && (
                                <a
                                  href={`https://www.openstreetmap.org/?mlat=${verifyResult.lat}&mlon=${verifyResult.lng}#map=16/${verifyResult.lat}/${verifyResult.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300 border border-gold-500/30 hover:border-gold-500 px-3 py-1.5 rounded-lg bg-gold-500/5 transition-all"
                                >
                                  <HiMap className="w-3.5 h-3.5" /> View on OpenStreetMap
                                </a>
                              )}
                              {!verifyResult.ok && (
                                <button
                                  onClick={handleVerifyAddress}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300 border border-gold-500/30 px-3 py-1.5 rounded-lg bg-gold-500/5 transition-all"
                                >
                                  <HiRefresh className="w-3.5 h-3.5" /> Try Again
                                </button>
                              )}
                              {!verifyResult.ok && (
                                <button
                                  onClick={() => { setAddressVerified(true); setVerifyResult(r => ({ ...r, ok: true })); toast('Address accepted manually ✓'); }}
                                  className="text-xs text-gray-500 hover:text-white underline transition-colors"
                                >
                                  My address is correct, proceed anyway
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 shadow-card">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-dark-600">
                      <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                        <HiTag className="w-4 h-4 text-gold-400" />
                      </div>
                      <h2 className="text-base font-bold text-white">Have a Coupon?</h2>
                    </div>
                    <div className="flex gap-3">
                      <input type="text" className="input-field uppercase tracking-widest" placeholder="Enter coupon code (e.g. STYLE20)"
                        value={couponCode} onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                        disabled={isCouponApplied} />
                      <button type="button" onClick={handleApplyCoupon}
                        disabled={couponApplying || isCouponApplied}
                        className="btn-outline px-5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                        {couponApplying ? 'Checking...' : isCouponApplied ? '✓ Applied' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><HiExclamationCircle className="w-3.5 h-3.5" />{couponError}</p>}
                    {isCouponApplied && (
                      <p className="text-gold-400 text-sm mt-2 font-medium flex items-center gap-1.5">
                        <HiCheckCircle className="w-4 h-4 text-green-400" />
                        Coupon applied:{' '}
                        {discountType === 'percentage' ? `${appliedDiscount}% OFF`
                          : discountType === 'fixed' ? `₹${appliedDiscount} OFF`
                          : 'FREE DELIVERY'}
                        <button onClick={() => { setAppliedDiscount(0); setIsCouponApplied(false); setCouponCode(''); }}
                          className="text-gray-500 hover:text-red-400 text-xs underline ml-2">Remove</button>
                      </p>
                    )}
                  </div>

                  {/* Next */}
                  <button type="button" onClick={handleNextStep}
                    className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-2">
                    Review My Order <HiArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-gold-500/5 border border-gold-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <HiShieldCheck className="w-5 h-5 text-gold-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gold-400">Please review your details carefully</p>
                      <p className="text-xs text-gray-400 mt-0.5">Incorrect details may cause failed deliveries. This is your final check before placing the order.</p>
                    </div>
                  </div>

                  {/* Delivery review */}
                  <div className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden shadow-card">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-dark-600">
                      <div className="flex items-center gap-2">
                        <HiLocationMarker className="w-4 h-4 text-gold-400" />
                        <h3 className="font-bold text-white text-sm">Delivery Information</h3>
                        {addressVerified && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                            <HiCheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      <button type="button" onClick={() => setStep(1)}
                        className="text-xs text-gold-400 hover:text-gold-300 font-semibold border border-gold-500/30 hover:border-gold-500 px-3 py-1 rounded-lg transition-all">
                        ✏️ Edit Details
                      </button>
                    </div>
                    <div className="divide-y divide-dark-600/50">
                      {[
                        { label: 'Full Name',    value: form.fullName },
                        { label: 'Mobile',       value: `+91 ${form.phone}` },
                        { label: 'Address',      value: form.address },
                        form.landmark && { label: 'Landmark', value: form.landmark },
                        { label: 'City',         value: form.city },
                        { label: 'State',        value: form.state },
                        { label: 'PIN Code',     value: form.pinCode },
                      ].filter(Boolean).map(({ label, value }) => (
                        <div key={label} className="flex gap-4 px-6 py-3">
                          <span className="text-xs text-gray-500 uppercase tracking-wider w-28 shrink-0 pt-0.5">{label}</span>
                          <span className="text-sm text-white font-medium">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Map link on step 2 */}
                    {verifyResult?.mapUrl && (
                      <div className="px-6 pb-4">
                        <a href={verifyResult.mapUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400 px-3 py-1.5 rounded-lg bg-blue-500/5 transition-all">
                          <HiMap className="w-3.5 h-3.5" /> View Delivery Location on Map
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Payment method */}
                  <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 shadow-card">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-dark-600">
                      <HiShieldCheck className="w-5 h-5 text-gold-400" />
                      <h3 className="font-bold text-white text-base">Select Payment Method</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Cash on Delivery option */}
                      <div className={`border rounded-xl transition-all ${
                        paymentMethod === 'cod' ? 'border-gold-500 bg-gold-500/10' : 'border-dark-600'
                      }`}>
                        <button type="button" onClick={() => setPaymentMethod('cod')}
                          className="flex items-center justify-between w-full p-4 text-left">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center text-gray-400">
                              <HiCash className="w-5 h-5 text-gold-400" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">Cash on Delivery (COD)</p>
                              <p className="text-gray-400 text-xs mt-0.5">Pay in cash upon delivery</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'cod' ? 'border-gold-500' : 'border-dark-500'
                          }`}>
                            {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                          </div>
                        </button>
                      </div>

                      {/* UPI Option */}
                      <div className={`border rounded-xl transition-all ${
                        paymentMethod === 'upi' ? 'border-gold-500 bg-gold-500/10' : 'border-dark-600'
                      }`}>
                        <button type="button" onClick={() => setPaymentMethod('upi')}
                          className="flex items-center justify-between w-full p-4 text-left border-b border-dashed border-dark-600">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center text-gray-400">
                              <svg viewBox="0 0 24 24" className="w-6 h-6 text-gold-400" fill="currentColor">
                                <path d="M12 2L3 17h6v5h6v-5h6L12 2zm0 4.5l5.25 8.75H14v5h-4v-5H6.75L12 6.5z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">UPI / Mobile Pay</p>
                              <p className="text-gray-400 text-xs mt-0.5">Google Pay, PhonePe, Paytm, or BHIM</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'upi' ? 'border-gold-500' : 'border-dark-500'
                          }`}>
                            {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                          </div>
                        </button>

                        {/* UPI Sub-Apps */}
                        {paymentMethod === 'upi' && (
                          <div className="p-4 bg-dark-900/50 rounded-b-xl border-t border-dark-600 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                            {[
                              { id: 'phonepe', name: 'PhonePe', color: '#8f55df', desc: 'Pay using PhonePe App', icon: (
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#8f55df]" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5zm4 4h-2v-5h2v5zm0-7h-2V7h2v2z" />
                                </svg>
                              )},
                              { id: 'gpay', name: 'Google Pay', color: '#4a8df8', desc: 'Pay using Google Pay App', icon: (
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#4a8df8]" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                              )},
                              { id: 'paytm', name: 'Paytm UPI', color: '#33cbf5', desc: 'Pay using Paytm App', icon: (
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#33cbf5]" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z" />
                                </svg>
                              )},
                              { id: 'any', name: 'Pay by any UPI App', color: '#D4AF37', desc: 'BHIM, Cred, or net banking apps', icon: (
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold-400" fill="currentColor">
                                  <path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
                                </svg>
                              )}
                            ].map((app) => (
                              <label key={app.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                upiApp === app.id ? 'border-gold-500 bg-dark-900 shadow-md' : 'border-dark-600 bg-dark-800 hover:border-gold-500/50'
                              }`}>
                                <input type="radio" name="upi-app" value={app.id} checked={upiApp === app.id}
                                  onChange={() => setUpiApp(app.id)} className="sr-only" />
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-dark-900 shrink-0">
                                  {app.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-xs text-white">{app.name}</p>
                                  <p className="text-[10px] text-gray-400 truncate">{app.desc}</p>
                                </div>
                                <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  upiApp === app.id ? 'border-gold-500 text-gold-400' : 'border-dark-500'
                                }`}>
                                  {upiApp === app.id && <div className="w-2 h-2 rounded-full bg-gold-500" />}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Option */}
                      <div className={`border rounded-xl transition-all ${
                        paymentMethod === 'card' ? 'border-gold-500 bg-gold-500/10' : 'border-dark-600'
                      }`}>
                        <button type="button" onClick={() => setPaymentMethod('card')}
                          className="flex items-center justify-between w-full p-4 text-left border-b border-dashed border-dark-600">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center text-gray-400">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                <line x1="2" y1="10" x2="22" y2="10" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">Debit / Credit Card</p>
                              <p className="text-gray-400 text-xs mt-0.5">Visa, Mastercard, RuPay, Maestro</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'card' ? 'border-gold-500' : 'border-dark-500'
                          }`}>
                            {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                          </div>
                        </button>

                        {/* Card input forms */}
                        {paymentMethod === 'card' && (
                          <div className="p-4 bg-dark-900/50 rounded-b-xl border-t border-dark-600 space-y-3 animate-fade-in">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Card Number</label>
                              <input type="text" maxLength="19" placeholder="XXXX XXXX XXXX XXXX"
                                className="w-full bg-dark-900 border border-dark-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-gold-500"
                                value={cardForm.number} onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                  setCardForm(c => ({ ...c, number: val }));
                                }} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expiry Date</label>
                                <input type="text" maxLength="5" placeholder="MM/YY"
                                  className="w-full bg-dark-900 border border-dark-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-gold-500"
                                  value={cardForm.expiry} onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').replace(/(.{2})/, '$1/').trim();
                                    setCardForm(c => ({ ...c, expiry: val }));
                                  }} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">CVV</label>
                                <input type="password" maxLength="3" placeholder="***"
                                  className="w-full bg-dark-900 border border-dark-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-gold-500"
                                  value={cardForm.cvv} onChange={e => setCardForm(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))} />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cardholder Name</label>
                              <input type="text" placeholder="e.g. Rohan Kumar"
                                className="w-full bg-dark-900 border border-dark-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-gold-500"
                                value={cardForm.name} onChange={e => setCardForm(c => ({ ...c, name: e.target.value }))} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Net Banking Option */}
                      <div className={`border rounded-xl transition-all ${
                        paymentMethod === 'netbanking' ? 'border-gold-500 bg-gold-500/10' : 'border-dark-600'
                      }`}>
                        <button type="button" onClick={() => setPaymentMethod('netbanking')}
                          className="flex items-center justify-between w-full p-4 text-left border-b border-dashed border-dark-600">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center text-gray-400">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">Net Banking</p>
                              <p className="text-gray-400 text-xs mt-0.5">Pay via direct bank account transfer</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'netbanking' ? 'border-gold-500' : 'border-dark-500'
                          }`}>
                            {paymentMethod === 'netbanking' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                          </div>
                        </button>

                        {/* Netbanking selects */}
                        {paymentMethod === 'netbanking' && (
                          <div className="p-4 bg-dark-900/50 rounded-b-xl border-t border-dark-600 space-y-3 animate-fade-in">
                            <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">Popular Banks</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'sbi', name: 'State Bank of India' },
                                { id: 'hdfc', name: 'HDFC Bank' },
                                { id: 'icici', name: 'ICICI Bank' },
                                { id: 'axis', name: 'Axis Bank' }
                              ].map(bank => (
                                <button type="button" key={bank.id} onClick={() => setSelectedBank(bank.id)}
                                  className={`p-2.5 text-center text-xs font-semibold rounded-lg border-2 transition-all ${
                                    selectedBank === bank.id ? 'border-gold-500 text-gold-400 bg-dark-900 shadow-md' : 'border-dark-500 bg-dark-800 hover:border-gold-500/50 text-gray-300'
                                  }`}>
                                  {bank.name}
                                </button>
                              ))}
                            </div>
                            <div className="pt-2">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Select Other Bank</label>
                              <select className="w-full bg-dark-900 border border-dark-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
                                value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                                <option value="kotak">Kotak Mahindra Bank</option>
                                <option value="pnb">Punjab National Bank</option>
                                <option value="bob">Bank of Baroda</option>
                                <option value="yes">Yes Bank</option>
                                <option value="indusind">IndusInd Bank</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Wallets Option */}
                      <div className={`border rounded-xl transition-all ${
                        paymentMethod === 'wallet' ? 'border-gold-500 bg-gold-500/10' : 'border-dark-600'
                      }`}>
                        <button type="button" onClick={() => setPaymentMethod('wallet')}
                          className="flex items-center justify-between w-full p-4 text-left border-b border-dashed border-dark-600">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center text-gray-400">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12V7H5a2 2 0 010-4h14v4M3 10h18M5 7v13a2 2 0 002 2h12a2 2 0 002-2v-5" />
                                <circle cx="16" cy="14" r="1" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">Mobile Wallets</p>
                              <p className="text-gray-400 text-xs mt-0.5">Paytm Wallet, Amazon Pay, PhonePe Wallet</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'wallet' ? 'border-gold-500' : 'border-dark-500'
                          }`}>
                            {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                          </div>
                        </button>

                        {/* Wallet subselects */}
                        {paymentMethod === 'wallet' && (
                          <div className="p-4 bg-dark-900/50 rounded-b-xl border-t border-dark-600 grid grid-cols-3 gap-2 animate-fade-in">
                            {[
                              { id: 'paytm', name: 'Paytm' },
                              { id: 'phonepe', name: 'PhonePe' },
                              { id: 'amazonpay', name: 'Amazon Pay' }
                            ].map(w => (
                              <button type="button" key={w.id} onClick={() => setSelectedWallet(w.id)}
                                  className={`p-2 text-center text-xs font-semibold rounded-lg border-2 transition-all ${
                                    selectedWallet === w.id ? 'border-gold-500 text-gold-400 bg-dark-900 shadow-md' : 'border-dark-500 bg-dark-800 hover:border-gold-500/50 text-gray-300'
                                  }`}>
                                {w.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 px-4 py-3 bg-gold-500/5 border border-gold-500/10 rounded-xl flex items-start gap-2.5">
                      <HiShieldCheck className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-450 leading-relaxed">
                        {paymentMethod === 'cod'
                          ? `You will pay ₹${finalTotal.toLocaleString()} in cash when your order is delivered.`
                          : `Pay ₹${finalTotal.toLocaleString()} securely online. You will be redirected to the gateway to complete the transaction.`}
                      </p>
                    </div>
                  </div>

                  {/* Final amount */}
                  <div className="bg-dark-800 border border-gold-500/20 rounded-2xl p-6 shadow-gold shadow-gold/5">
                    <h3 className="font-serif font-bold text-white text-lg mb-4">Final Amount</h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Shipping</span>
                        <span className={shipping === 0 ? 'text-green-400' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                      </div>
                      {appliedDiscount > 0 && discountType !== 'free_shipping' && (
                        <div className="flex justify-between text-sm text-gold-400 font-medium">
                          <span>Discount</span><span>–₹{discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-dark-600 mt-2">
                        <span className="text-white font-bold text-base">Total to Pay</span>
                        <span className="text-3xl font-bold text-gold-400">₹{finalTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-800/50 border border-dark-600 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
                    <p>By placing this order, you confirm that the delivery details above are correct, and you agree to Style Heaven's return & refund policy. Orders with incorrect addresses will not be eligible for re-delivery at no charge.</p>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={() => setStep(1)} className="btn-outline flex items-center gap-2 px-6 py-4">
                      <HiArrowLeft className="w-4 h-4" /> Go Back
                    </button>
                    <button type="button" onClick={handlePlaceOrder} disabled={loading}
                      className="flex-1 btn-primary text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100">
                      {loading ? (
                        <><div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" /> Placing Order...</>
                      ) : (
                        <><HiShieldCheck className="w-5 h-5" /> Confirm & Place Order</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <OrderSummary />
          </div>
        </div>
      </div>

      {/* Loading Popup */}
      <AnimatePresence>
        {showLoadingPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 border border-dark-600 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-gold shadow-gold/10 text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="relative w-20 h-20">
                  {/* Rotating Outer Ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-dark-900 border-t-gold-500 animate-spin" />
                  {/* Secure Shield Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <HiShieldCheck className="w-10 h-10 text-gold-400 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Processing Payment</h3>
                <p className="text-sm text-gray-400 font-medium h-12 flex items-center justify-center">{popupText}</p>
              </div>
              <div className="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden border border-dark-600">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                  className="h-full bg-gradient-luxury"
                />
              </div>
              <p className="text-[10px] text-gray-500">Do not refresh or go back. Transacting securely.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
