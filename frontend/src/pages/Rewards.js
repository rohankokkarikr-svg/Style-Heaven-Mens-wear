import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiGift, HiStar, HiClock, HiCheckCircle, HiArrowRight,
  HiShieldCheck, HiTruck, HiTicket, HiLightningBolt, HiShoppingBag,
  HiClipboardCopy, HiSparkles, HiTag
} from 'react-icons/hi';
import { FaTrophy } from 'react-icons/fa';
import { authAPI, productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';

const THRESHOLD = 10;

/* ── 5 KalaStyle AI Patron Tiers ── */
const LEVELS = [
  {
    name: 'Bronze',
    title: 'Shilpi (Craft Novice)',
    emoji: '🥉',
    minSpend: 0,
    nextSpend: 5000,
    gradient: 'from-amber-700 to-yellow-800',
    bg: 'bg-amber-700/10',
    border: 'border-amber-700/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-700/20',
    badge: 'bg-gradient-to-r from-amber-700 to-yellow-800',
    perks: ['Welcome 10% craft discount', '90% OFF on 10 delivered items', 'Full catalog access'],
    reward: '90% OFF Voucher on 10 delivered items',
  },
  {
    name: 'Silver',
    title: 'Karigar (Craft Patron)',
    emoji: '🥈',
    minSpend: 5000,
    nextSpend: 20000,
    gradient: 'from-slate-400 to-gray-500',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/30',
    text: 'text-slate-300',
    glow: 'shadow-slate-400/20',
    badge: 'bg-gradient-to-r from-slate-400 to-gray-500',
    perks: ['All Bronze perks', '15% VIP Festive Coupons', 'Early access to artisan master-weaves'],
    reward: '90% OFF Voucher + Early Master-Weaves',
  },
  {
    name: 'Gold',
    title: 'Ustad (Master Connoisseur)',
    emoji: '🥇',
    minSpend: 20000,
    nextSpend: 35000,
    gradient: 'from-yellow-500 to-amber-600',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/20',
    badge: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    perks: ['All Silver perks', 'Free nationwide express delivery', 'Direct artisan craft requests'],
    reward: '90% OFF Voucher + Free Delivery',
  },
  {
    name: 'Diamond',
    title: 'Navratna (Heritage Collector)',
    emoji: '💎',
    minSpend: 35000,
    nextSpend: 50000,
    gradient: 'from-cyan-400 to-blue-600',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/30',
    text: 'text-cyan-300',
    glow: 'shadow-cyan-400/20',
    badge: 'bg-gradient-to-r from-cyan-400 to-blue-600',
    perks: ['All Gold perks', 'Exclusive previews of museum-grade crafts', 'Festive surprise craft gift box'],
    reward: '90% OFF Voucher + Heritage Previews',
  },
  {
    name: 'Elite',
    title: 'Maharaja (Royal Guild)',
    emoji: '👑',
    minSpend: 50000,
    nextSpend: null,
    gradient: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/20',
    badge: 'bg-gradient-to-r from-purple-500 to-indigo-600',
    perks: ['All Diamond perks', 'Personal Craft Concierge', 'VIP Invitations to National Artisan Expos'],
    reward: '90% OFF Voucher + Royal VIP Status',
  },
];

const getLevelConfig = (name) => LEVELS.find(l => l.name === name) || LEVELS[0];

export default function Rewards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [sampleProducts, setSampleProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    authAPI.getRewards()
      .then(({ data: res }) => setData(res))
      .catch(() => toast.error('Failed to load rewards data'))
      .finally(() => setLoading(false));
  }, []);

  const handleCelebrate = async () => {
    confetti({ particleCount: 220, spread: 90, origin: { y: 0.5 }, colors: ['#C9A84C', '#fff', '#E8C96B', '#FFD700'] });
    setShowUnlockModal(true);
    setLoadingProducts(true);
    try {
      const { data: prods } = await productAPI.getAll({ limit: 6 });
      if (Array.isArray(prods)) {
        setSampleProducts(prods.slice(0, 6));
      } else {
        setSampleProducts([]);
      }
    } catch {
      setSampleProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const rewardCode = data?.history?.find(h => h.status === 'Available')?.code || (data?.history?.[1]?.code) || 'KALA90';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rewardCode);
    toast.success('90% OFF Coupon Code Copied! 🎉');
  };

  const handleGoToCatalog = () => {
    setShowUnlockModal(false);
    navigate('/products');
    toast.success('Apply your 90% discount at checkout on any handicraft! ✨');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="w-12 h-12 border-4 border-dark-600 border-t-gold-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-dark-900">
      <HiGift className="w-16 h-16 text-gray-700 mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Could not load rewards</h2>
      <p className="text-gray-400 mb-6">Please check your connection or try logging in again.</p>
      <Link to="/" className="btn-primary px-8 py-3">Back to Home</Link>
    </div>
  );

  const threshold = data.rewardThreshold || THRESHOLD;
  const progressPct = Math.min((data.progress / threshold) * 100, 100);
  const levelCfg = getLevelConfig(data.membershipLevel);

  return (
    <div className="min-h-screen bg-dark-900 pb-24">

      {/* ── Hero ── */}
      <section className="relative py-20 overflow-hidden border-b border-dark-700/60">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/10 via-dark-950/60 to-dark-900" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-bold uppercase tracking-widest mb-6">
              <span>🇮🇳</span>
              <span>KalaStyle AI Patron Guild</span>
              <HiSparkles className="w-4 h-4 text-gold-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tight">
              Artisan Patron <span className="text-gold-400">Rewards</span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Support traditional craft masteries across India. Complete 10 delivered orders to unlock our exclusive{' '}
              <span className="text-gold-400 font-bold bg-gold-500/10 px-2.5 py-0.5 rounded-md border border-gold-500/30">
                90% OFF
              </span>{' '}
              Grand Milestone Reward on your next handcrafted masterpiece!
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Profile + Loyalty Cards ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Profile & Tier Card */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="card p-8 text-center relative overflow-hidden group border border-dark-700 bg-dark-800/80 backdrop-blur-sm"
            >
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${levelCfg.gradient}`} />
              <div className="relative mx-auto mb-6 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${levelCfg.gradient} blur-md opacity-40 scale-110`} />
                <UserAvatar name={user?.name} size={96} ring className="relative z-10 shadow-xl" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{user?.name || 'Artisan Patron'}</h2>
              <p className="text-gray-400 text-sm mb-4">{user?.phone ? `+91 ${user.phone}` : user?.email || ''}</p>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${levelCfg.badge} text-white text-xs font-bold uppercase tracking-widest shadow-lg`}>
                <span>{levelCfg.emoji}</span> {levelCfg.title || `${data.membershipLevel} Member`}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-dark-600 mb-6">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Craft Spend</p>
                  <p className="text-xl font-bold text-white">₹{data.totalSpent?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Patron Points</p>
                  <p className="text-xl font-bold text-gold-400">{data.points || 0}</p>
                </div>
              </div>
              <Link
                to="/profile"
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-xs font-bold shadow-gold"
              >
                <FaTrophy className="w-4 h-4 text-dark-900" /> View Leaderboard Rank 🏆
              </Link>
            </motion.div>

            {/* Member Perks */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="card p-8 border border-dark-700 bg-dark-800/80"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <HiShieldCheck className="text-gold-400 w-5 h-5" /> Your {data.membershipLevel} Privileges
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: HiTag,           title: '90% OFF Milestone Voucher', desc: 'Unlock 90% discount once 10 items are delivered!' },
                  { icon: HiLightningBolt, title: 'Early Artisan Releases',    desc: 'Exclusive access to limited handmade drops.' },
                  { icon: HiTicket,        title: 'Festive Craft Coupons',     desc: 'Special seasonal discounts celebrating Indian arts.' },
                  { icon: HiStar,          title: 'Diwali & Birthday Surprise',desc: 'Handcrafted artisan tokens on celebratory dates.' },
                  { icon: HiTruck,         title: 'Express Delivery',          desc: 'Complimentary shipping for Gold & Elite tiers.' },
                ].map((perk, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center border border-dark-600">
                      <perk.icon className="w-4 h-4 text-gold-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{perk.title}</h4>
                      <p className="text-xs text-gray-400">{perk.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Right: 90% Discount Progress + History */}
          <div className="lg:col-span-2 space-y-8">

            {/* ── 90% OFF Milestone Progress Card ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="card p-8 sm:p-10 relative overflow-hidden border border-gold-500/30 bg-gradient-to-br from-dark-800 via-dark-850 to-dark-900 shadow-[0_0_40px_rgba(201,168,76,0.1)]"
            >
              <div className="absolute top-0 right-0 w-72 h-72 bg-gold-500/10 blur-[100px] pointer-events-none" />

              <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-bold uppercase tracking-widest mb-3">
                    <HiTag className="w-4 h-4 text-gold-400" />
                    <span>Grand Milestone Reward</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                    90% OFF <span className="text-gold-400">Handicraft Voucher</span>
                  </h3>
                  <p className="text-gray-300 text-sm max-w-lg leading-relaxed">
                    Have <span className="text-gold-400 font-bold">{threshold} handcrafted items delivered</span> from any category
                    (Handloom, Jewelry, Pottery, Woodcraft, or Décor) to unlock a massive{' '}
                    <span className="text-white font-bold underline decoration-gold-400">90% DISCOUNT</span> on your next order!
                  </p>
                </div>
                <div className="text-right shrink-0 bg-dark-900/80 px-5 py-3 rounded-2xl border border-dark-600">
                  <span className="text-4xl sm:text-5xl font-bold text-gold-400 font-serif">{data.progress}</span>
                  <span className="text-gray-400 text-2xl font-serif"> / {threshold}</span>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Delivered Items</p>
                </div>
              </div>

              {/* Step Bubbles */}
              <div className="flex items-center gap-1.5 my-6 overflow-x-auto pb-2">
                {Array.from({ length: threshold }).map((_, i) => {
                  const filled = i < data.progress;
                  return (
                    <React.Fragment key={i}>
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          filled
                            ? 'bg-gold-500 border-gold-500 text-dark-900 shadow-[0_0_12px_rgba(201,168,76,0.5)]'
                            : 'bg-dark-700 border-dark-500 text-gray-500'
                        }`}
                      >
                        {filled ? <HiCheckCircle className="w-4 h-4" /> : i + 1}
                      </motion.div>
                      {i < threshold - 1 && (
                        <div className={`h-0.5 flex-1 min-w-[8px] rounded-full transition-all duration-500 ${filled ? 'bg-gold-500' : 'bg-dark-600'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
                {/* 90% Badge at end */}
                <div className={`h-10 px-2.5 shrink-0 ml-1 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all ${
                  data.needed === 0
                    ? 'bg-gold-500 border-gold-500 text-dark-900 shadow-[0_0_20px_rgba(201,168,76,0.6)] animate-pulse'
                    : 'bg-dark-700 border-dark-500 text-gold-400'
                }`}>
                  <span>90% OFF</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-4 bg-dark-700 rounded-full overflow-hidden border border-dark-600 p-0.5 mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-gold-600 via-gold-400 to-amber-300 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />
                </motion.div>
              </div>

              {/* Status + CTA */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                <p className="text-sm text-gray-200">
                  {data.needed === 0 ? (
                    data.rewardClaimed ? (
                      <span className="text-blue-400 font-bold flex items-center gap-1.5">
                        <HiCheckCircle className="w-5 h-5" /> 90% OFF Voucher redeemed & used at checkout ✓
                      </span>
                    ) : (
                      <span className="text-green-400 font-bold flex items-center gap-1.5">
                        <HiSparkles className="w-5 h-5 text-gold-400" /> 🎉 Milestone Unlocked! Claim your 90% discount!
                      </span>
                    )
                  ) : (
                    <>
                      Only <span className="text-gold-400 font-bold">{data.needed} more delivered item{data.needed > 1 ? 's' : ''}</span>{' '}
                      to unlock your <span className="text-white font-semibold">90% DISCOUNT</span>!
                    </>
                  )}
                </p>

                {data.needed === 0 && !data.rewardClaimed && (
                  <button
                    onClick={handleCelebrate}
                    className="btn-primary py-2.5 px-6 text-sm font-bold flex items-center gap-2 shadow-gold animate-bounce"
                  >
                    <HiTag className="w-4 h-4 text-dark-900" /> Claim 90% OFF Voucher
                  </button>
                )}

                {data.needed === 0 && data.rewardClaimed && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <HiCheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-green-400">Coupon Redeemed</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{rewardCode}</p>
                    </div>
                  </div>
                )}
              </div>

              {data.needed > 0 && (
                <div className="mt-6 flex items-start gap-3 bg-gold-500/5 border border-gold-500/20 rounded-xl p-4">
                  <HiShoppingBag className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <span className="text-white font-semibold">Patron Tip:</span> Every handcrafted item you order — handloom sarees, Pashmina shawls, brass idols, Blue Pottery, jewelry —{' '}
                    <span className="text-gold-400">automatically counts toward your 90% discount milestone once delivered</span>.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Status Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6 border-l-4 border-gold-500 bg-dark-800/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <HiTag className="w-6 h-6 text-gold-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Reward Discount</h4>
                    <p className={`text-xs font-medium tracking-wide uppercase mt-1 ${
                      data.needed === 0 && data.rewardClaimed ? 'text-blue-400' : 'text-gold-400'
                    }`}>
                      {data.needed === 0 && data.rewardClaimed
                        ? '90% Coupon Redeemed ✓'
                        : data.needed === 0 ? '90% OFF Unlocked 🎉'
                        : data.needed <= 2 ? 'Almost There!'
                        : 'In Progress'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6 border-l-4 border-blue-500 bg-dark-800/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <HiClock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Voucher Validity</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Your 90% discount coupon remains valid for 30 days once unlocked.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reward History */}
            <div className="card overflow-hidden border border-dark-700 bg-dark-800/80">
              <div className="p-6 border-b border-dark-700 bg-dark-850/60 flex justify-between items-center">
                <h3 className="font-bold text-white font-serif">Patron Reward History</h3>
                <span className="text-xs text-gold-400 font-semibold">{data.history?.length || 0} Records</span>
              </div>
              <div className="divide-y divide-dark-700">
                {data.history?.map((item) => (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.status === 'Redeemed' ? 'bg-dark-700 text-gray-500' : 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                      }`}>
                        <HiTag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold uppercase tracking-widest ${item.status === 'Redeemed' ? 'text-gray-500' : 'text-green-400'}`}>
                        {item.status}
                      </p>
                      <code className="text-xs text-gold-400/80 font-mono block mt-1">{item.code}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 90% Discount Unlock Modal ── */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUnlockModal(false)}
              className="absolute inset-0 bg-dark-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-2xl bg-dark-800 rounded-3xl border border-gold-500/40 shadow-[0_0_60px_rgba(201,168,76,0.25)] overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-gold-600 via-gold-400 to-amber-300" />
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-amber-600 rounded-2xl rotate-12 flex items-center justify-center shadow-xl shadow-gold-500/20 mx-auto mb-4">
                    <HiTag className="w-8 h-8 text-dark-950 -rotate-12" />
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-white mb-1">🎉 Congratulations!</h2>
                  <p className="text-gold-400 font-bold tracking-widest uppercase text-xs mb-3">Grand 90% OFF Voucher Unlocked</p>
                  <p className="text-gray-300 text-sm max-w-md mx-auto leading-relaxed">
                    You've supported our artisan community with <span className="text-white font-bold">{data.totalItemsOrdered || threshold}+ delivered items</span>!
                    Enjoy a massive <span className="text-gold-400 font-bold">90% DISCOUNT</span> on any authentic handcrafted masterpiece.
                  </p>
                </div>

                {/* Coupon Code Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-900 border border-dashed border-gold-500/60 rounded-2xl px-6 py-4 mb-6 text-center sm:text-left">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Your 90% OFF Coupon Code</p>
                    <span className="text-2xl font-mono font-bold text-gold-400 tracking-widest">{rewardCode}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center justify-center gap-2 text-xs font-bold text-dark-900 bg-gradient-luxury px-4 py-2.5 rounded-xl hover:scale-105 transition-all shadow-gold"
                  >
                    <HiClipboardCopy className="w-4 h-4" /> Copy Coupon Code
                  </button>
                </div>

                {/* Handicraft Sample Showcase with 90% Discounted Prices */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <HiSparkles className="w-4 h-4 text-gold-400" /> Eligible Handcrafted Masterpieces (90% OFF)
                    </h3>
                    <span className="text-[11px] text-gold-400 font-medium">Pay only 10%</span>
                  </div>

                  {loadingProducts ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-2 border-dark-600 border-t-gold-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                      {sampleProducts.map((prod, idx) => {
                        const originalPrice = prod.price || 2999;
                        const discountedPrice = Math.round(originalPrice * 0.1);
                        return (
                          <div
                            key={prod.id || idx}
                            className="rounded-xl border border-dark-600 bg-dark-900/60 overflow-hidden hover:border-gold-500/50 transition-all p-2 flex flex-col justify-between"
                          >
                            <div className="aspect-square rounded-lg overflow-hidden bg-dark-700 mb-2">
                              <img
                                src={prod.image_url || prod.images?.[0] || prod.image}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-white font-medium truncate">{prod.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gold-400 font-bold">₹{discountedPrice}</span>
                                <span className="text-[10px] text-gray-500 line-through">₹{originalPrice}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleGoToCatalog}
                    className="flex-1 btn-primary py-3.5 flex items-center justify-center gap-2 text-sm font-bold shadow-gold cursor-pointer"
                  >
                    <span>Shop Handicrafts with 90% Off</span>
                    <HiArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="btn-outline py-3.5 px-6 text-sm font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <p className="text-center text-[11px] text-gray-400 mt-4">
                  Apply coupon <span className="text-gold-400 font-mono font-bold">{rewardCode}</span> at checkout for 90% off on your entire craft order. Valid for 30 days.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
