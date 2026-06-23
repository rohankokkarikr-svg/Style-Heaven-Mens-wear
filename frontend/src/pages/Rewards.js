import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiGift, HiStar, HiClock, HiCheckCircle, HiArrowRight,
  HiShieldCheck, HiTruck, HiTicket, HiLightningBolt, HiShoppingBag,
  HiClipboardCopy, HiChevronRight
} from 'react-icons/hi';
import { authAPI, productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';

const THRESHOLD = 10;

/* ── Level definitions ── */
const LEVELS = [
  {
    name: 'Bronze',
    emoji: '🥉',
    minSpend: 0,
    nextSpend: 5000,
    gradient: 'from-orange-600 to-amber-700',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20',
    badge: 'bg-gradient-to-r from-orange-600 to-amber-700',
    perks: ['Welcome discount coupon', 'Free T-shirt on 10 delivered items', 'Access to all categories'],
    reward: 'Free T-Shirt on 10 delivered items',
  },
  {
    name: 'Silver',
    emoji: '🥈',
    minSpend: 5000,
    nextSpend: 20000,
    gradient: 'from-slate-400 to-gray-500',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/30',
    text: 'text-slate-300',
    glow: 'shadow-slate-400/20',
    badge: 'bg-gradient-to-r from-slate-400 to-gray-500',
    perks: ['All Bronze perks', 'Early access to sales', 'Free T-shirt on 10 delivered items'],
    reward: 'Free T-Shirt + Early Sale Access',
  },
  {
    name: 'Gold',
    emoji: '🥇',
    minSpend: 20000,
    nextSpend: 35000,
    gradient: 'from-yellow-500 to-amber-600',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/20',
    badge: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    perks: ['All Silver perks', 'Free delivery on all orders', 'Priority customer support'],
    reward: 'Free T-Shirt + Free Delivery',
  },
  {
    name: 'Diamond',
    emoji: '💎',
    minSpend: 35000,
    nextSpend: 50000,
    gradient: 'from-cyan-400 to-blue-600',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/30',
    text: 'text-cyan-300',
    glow: 'shadow-cyan-400/20',
    badge: 'bg-gradient-to-r from-cyan-400 to-blue-600',
    perks: ['All Gold perks', 'Exclusive limited edition drops', 'Birthday surprise gift'],
    reward: 'Free T-Shirt + Birthday Gift',
  },
  {
    name: 'Elite',
    emoji: '👑',
    minSpend: 50000,
    nextSpend: null,
    gradient: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/20',
    badge: 'bg-gradient-to-r from-purple-500 to-indigo-600',
    perks: ['All Diamond perks', 'Personal style consultant', 'VIP-first new arrivals'],
    reward: 'Free T-Shirt + VIP Perks',
  },
];

const getLevelConfig = (name) => LEVELS.find(l => l.name === name) || LEVELS[0];

export default function Rewards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [tshirts, setTshirts] = useState([]);
  const [loadingShirts, setLoadingShirts] = useState(false);
  const [selectedShirt, setSelectedShirt] = useState(null);

  useEffect(() => {
    authAPI.getRewards()
      .then(({ data: res }) => setData(res))
      .catch(() => toast.error('Failed to load rewards data'))
      .finally(() => setLoading(false));
  }, []);

  const handleCelebrate = async () => {
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: ['#D4AF37', '#fff', '#aa8a2e'] });
    setShowUnlockModal(true);
    setLoadingShirts(true);
    try {
      const { data: products } = await productAPI.getAll({ category: 'T-Shirts', includeCustom: 'true' });
      const customShirt = (products || []).filter(p => p.name === 'Style Heaven Customized T-Shirt');
      setTshirts(customShirt);
      if (customShirt.length > 0) {
        setSelectedShirt(customShirt[0]);
      }
    } catch { toast.error('Could not load customized T-shirt'); }
    finally { setLoadingShirts(false); }
  };

  const handleCopyCode = () => {
    const code = data?.history?.find(h => h.status === 'Available')?.code || 'FREESHIRT10';
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied! 🎉');
  };

  const handleRedeemShirt = () => {
    if (!selectedShirt) { toast.error('Please choose a T-shirt first'); return; }
    setShowUnlockModal(false);
    navigate(`/products/${selectedShirt.id}`);
    toast.success(`Head to checkout and use your coupon for FREE! 🎽`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-dark-600 border-t-gold-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <HiGift className="w-16 h-16 text-gray-700 mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Could not load rewards</h2>
      <p className="text-gray-400 mb-6">Please check your connection or try logging in again.</p>
      <Link to="/" className="btn-primary px-8 py-3">Back to Home</Link>
    </div>
  );

  const threshold = data.rewardThreshold || THRESHOLD;
  const progressPct = Math.min((data.progress / threshold) * 100, 100);
  const rewardCode = data.history?.find(h => h.status === 'Available')?.code || `FREESHIRT${threshold}`;
  const levelCfg = getLevelConfig(data.membershipLevel);
  const currentLevelIdx = LEVELS.findIndex(l => l.name === data.membershipLevel);

  return (
    <div className="min-h-screen bg-dark-900 pb-24">

      {/* ── Hero ── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6">
              <HiStar className="w-4 h-4 text-gold-400" />
              <span className="text-gold-400 text-xs font-bold uppercase tracking-widest">Loyalty Program</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
              Style Heaven <span className="text-gold-400">Rewards</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              5 exclusive tiers. Every level earns you a <span className="text-gold-400 font-semibold">FREE T-Shirt</span> of your choice, plus premium perks.
            </p>
          </motion.div>
        </div>
      </section>



      {/* ── Profile + Loyalty Cards ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Profile */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="card p-8 text-center relative overflow-hidden group"
            >
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${levelCfg.gradient}`} />
              <div className="relative mx-auto mb-6 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${levelCfg.gradient} blur-md opacity-40 scale-110`} />
                <UserAvatar name={user?.name} size={96} ring className="relative z-10 shadow-xl" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{user?.email ? `+91 ${user.email}` : ''}</p>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${levelCfg.badge} text-white text-xs font-bold uppercase tracking-widest shadow-lg`}>
                <span>{levelCfg.emoji}</span> {data.membershipLevel} Member
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-dark-600">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter mb-1">Total Spent</p>
                  <p className="text-xl font-bold text-white">₹{data.totalSpent?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter mb-1">Loyalty Points</p>
                  <p className="text-xl font-bold text-gold-400">{data.points}</p>
                </div>
              </div>
            </motion.div>

            {/* Member Perks */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="card p-8"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <HiShieldCheck className="text-gold-500" /> Your {data.membershipLevel} Perks
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: HiGift,          title: 'Free T-Shirt Reward',    desc: 'Get 8 items delivered from any category to win!' },
                  { icon: HiLightningBolt, title: 'Early Access',           desc: 'Shop new arrivals before everyone else.' },
                  { icon: HiTicket,        title: 'Exclusive Coupons',      desc: 'Special discounts for your level.' },
                  { icon: HiStar,          title: 'Birthday Rewards',       desc: 'Special gift on your big day.' },
                  { icon: HiTruck,         title: 'Free Delivery',          desc: 'Available for Gold & Elite members.' },
                ].map((perk, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
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

          {/* Right: Progress + History */}
          <div className="lg:col-span-2 space-y-8">

            {/* Free T-Shirt Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-10 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold-500/5 blur-[100px] pointer-events-none" />

              <div className="flex justify-between items-start mb-2 flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                      <HiGift className="w-4 h-4 text-gold-400" />
                    </div>
                    <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">Loyalty Reward</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-1">Free T-Shirt Program</h3>
                  <p className="text-gray-400 text-sm">
                    Get <span className="text-gold-400 font-bold">{threshold} items delivered</span> from{' '}
                    <span className="text-white font-semibold">any category</span> and get a{' '}
                    <span className="text-gold-400 font-bold">FREE T-Shirt of your choice!</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-5xl font-bold text-gold-500">{data.progress}</span>
                  <span className="text-gray-500 text-2xl"> / {threshold}</span>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">items delivered</p>
                </div>
              </div>

              {/* Step bubbles */}
              <div className="flex items-center gap-1 my-6 overflow-x-auto pb-2">
                {Array.from({ length: threshold }).map((_, i) => {
                  const filled = i < data.progress;
                  return (
                    <React.Fragment key={i}>
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          filled
                            ? 'bg-gold-500 border-gold-500 text-dark-900 shadow-[0_0_12px_rgba(212,175,55,0.5)]'
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
                {/* Gift at end */}
                <div className={`w-10 h-10 shrink-0 ml-1 rounded-full flex items-center justify-center border-2 transition-all ${
                  data.needed === 0
                    ? 'bg-gold-500 border-gold-500 text-dark-900 shadow-[0_0_20px_rgba(212,175,55,0.6)]'
                    : 'bg-dark-700 border-dark-500 text-gray-500'
                } ${data.needed === 0 && !data.rewardClaimed ? 'animate-bounce' : ''}`}>
                  <HiGift className="w-5 h-5" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-5 bg-dark-700 rounded-full overflow-hidden border border-dark-600 shadow-inner p-0.5 mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full blur-[3px] opacity-70" />
                </motion.div>
              </div>

              {/* Status + CTA */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-300">
                  {data.needed === 0 ? (
                    data.rewardClaimed ? (
                      <span className="text-blue-400 font-bold flex items-center gap-1.5">
                        <HiCheckCircle className="w-5 h-5" /> Reward claimed & used at checkout ✓
                      </span>
                    ) : (
                      <span className="text-green-400 font-bold flex items-center gap-1.5">
                        <HiCheckCircle className="w-5 h-5" /> 🎉 Reward Unlocked! Claim your free T-shirt!
                      </span>
                    )
                  ) : (
                    <>Only{' '}
                      <span className="text-gold-400 font-bold">{data.needed} more item{data.needed > 1 ? 's' : ''}</span>{' '}
                      to unlock your FREE T-Shirt!
                    </>
                  )}
                </p>
                {data.needed === 0 && !data.rewardClaimed && (
                  <button onClick={handleCelebrate} className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2 animate-pulse">
                    <HiGift className="w-4 h-4" /> Choose My Free Shirt
                  </button>
                )}
                {data.needed === 0 && data.rewardClaimed && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <HiCheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-green-400">Coupon Redeemed</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{rewardCode}</p>
                    </div>
                  </div>
                )}
              </div>

              {data.needed > 0 && (
                <div className="mt-5 flex items-start gap-3 bg-gold-500/5 border border-gold-500/15 rounded-xl p-4">
                  <HiShoppingBag className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <span className="text-white font-semibold">Tip:</span> Every item you order — T-shirts, shirts, pants, jackets, accessories —{' '}
                    <span className="text-gold-400">counts toward your reward once delivered</span>. Mix and match from any category!
                  </p>
                </div>
              )}
            </motion.div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6 border-l-4 border-gold-500/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                    <HiGift className="w-6 h-6 text-gold-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Reward Status</h4>
                    <p className={`text-xs font-medium tracking-wide uppercase mt-1 ${
                      data.needed === 0 && data.rewardClaimed ? 'text-blue-400' : 'text-gold-400'
                    }`}>
                      {data.needed === 0 && data.rewardClaimed
                        ? 'Coupon Redeemed ✓'
                        : data.needed === 0 ? 'Unlocked 🎉'
                        : data.needed <= 2 ? 'Almost There!'
                        : 'In Progress'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card p-6 border-l-4 border-blue-500/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <HiClock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Coupon Validity</h4>
                    <p className="text-xs text-gray-400 mt-1">Free T-shirt coupon valid for 30 days after unlock.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reward History */}
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-dark-600 bg-dark-800/50 flex justify-between items-center">
                <h3 className="font-bold text-white">Reward History</h3>
                <span className="text-xs text-gray-400">{data.history?.length} Records</span>
              </div>
              <div className="divide-y divide-dark-600">
                {data.history?.map((item) => (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'Redeemed' ? 'bg-dark-700 text-gray-500' : 'bg-gold-500/20 text-gold-500'}`}>
                        <HiGift className="w-5 h-5" />
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
                      <code className="text-[10px] text-dark-400 block mt-1">{item.code}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Unlock Modal ── */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUnlockModal(false)}
              className="absolute inset-0 bg-dark-950/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-2xl bg-dark-800 rounded-3xl border border-gold-500/30 shadow-[0_0_60px_rgba(212,175,55,0.2)] overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-gold-600 via-gold-400 to-amber-500" />
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-amber-600 rounded-2xl rotate-12 flex items-center justify-center shadow-xl shadow-gold-500/20 mx-auto mb-4">
                    <HiGift className="w-8 h-8 text-white -rotate-12" />
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-white mb-1">🎉 Congratulations!</h2>
                  <p className="text-gold-400 font-bold tracking-widest uppercase text-xs mb-3">Custom T-Shirt Unlocked</p>
                  <p className="text-gray-400 text-sm">
                    You've had <span className="text-white font-bold">{data.totalItemsOrdered || threshold}+ items delivered</span> from Style Heaven. Claim your exclusive customized T-shirt below — it's on us!
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 bg-dark-900 border border-dashed border-gold-500/50 rounded-xl px-5 py-3 mb-6">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Your Coupon Code</p>
                    <span className="text-xl font-mono font-bold text-gold-400 tracking-widest">{rewardCode}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 text-xs font-semibold text-gold-400 hover:text-gold-300 border border-gold-500/30 hover:border-gold-500 px-3 py-2 rounded-lg bg-gold-500/5 hover:bg-gold-500/10 transition-all"
                  >
                    <HiClipboardCopy className="w-4 h-4" /> Copy Code
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <HiShoppingBag className="w-4 h-4 text-gold-400" /> Your Free Customized T-Shirt
                  </h3>
                  {loadingShirts ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-2 border-dark-600 border-t-gold-500 rounded-full animate-spin" />
                    </div>
                  ) : tshirts.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">No T-shirts found. Browse our collection.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                      {tshirts.map(shirt => (
                        <button
                          key={shirt.id}
                          onClick={() => setSelectedShirt(shirt)}
                          className={`relative rounded-xl border-2 overflow-hidden text-left transition-all duration-200 group ${
                            selectedShirt?.id === shirt.id
                              ? 'border-gold-500 shadow-[0_0_16px_rgba(212,175,55,0.3)]'
                              : 'border-dark-600 hover:border-gold-500/50'
                          }`}
                        >
                          <div className="aspect-square bg-dark-700">
                            <img src={shirt.image_url} alt={shirt.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="p-2 bg-dark-800">
                            <p className="text-xs text-white font-semibold truncate">{shirt.name}</p>
                            <p className="text-[10px] text-gold-400 font-bold line-through">₹{shirt.price?.toLocaleString()}</p>
                          </div>
                          {selectedShirt?.id === shirt.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center shadow-lg">
                              <HiCheckCircle className="w-3.5 h-3.5 text-dark-900" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRedeemShirt}
                    disabled={!selectedShirt}
                    className="flex-1 btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <HiGift className="w-4 h-4" />
                    {selectedShirt ? `Claim "${selectedShirt.name}"` : 'Claim Your Free T-Shirt'}
                    <HiArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="btn-outline py-3.5 px-5 text-sm flex items-center justify-center gap-2"
                  >
                    Close
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-500 mt-4">
                  Apply coupon <span className="text-gold-400 font-mono">{rewardCode}</span> at checkout for 100% off on the Customized T-shirt. Valid 30 days.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
