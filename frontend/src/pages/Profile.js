import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiSparkles, HiStar, HiShoppingBag,
  HiSearch, HiChevronRight
} from 'react-icons/hi';
import { FaTrophy } from 'react-icons/fa';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import toast from 'react-hot-toast';

const LEVEL_COLORS = {
  Elite:   { badge: 'bg-gradient-to-r from-purple-600 to-indigo-600', text: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10', emoji: '👑' },
  Diamond: { badge: 'bg-gradient-to-r from-cyan-500 to-blue-600',    text: 'text-cyan-300',   border: 'border-cyan-400/40',   bg: 'bg-cyan-500/10',   emoji: '💎' },
  Gold:    { badge: 'bg-gradient-to-r from-yellow-500 to-amber-600', text: 'text-amber-400',  border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', emoji: '🥇' },
  Silver:  { badge: 'bg-gradient-to-r from-slate-400 to-gray-500',   text: 'text-slate-300',  border: 'border-slate-400/40',  bg: 'bg-slate-400/10',  emoji: '🥈' },
  Bronze:  { badge: 'bg-gradient-to-r from-orange-600 to-amber-700', text: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-500/10', emoji: '🥉' },
};

const getLevelCfg = (name) => LEVEL_COLORS[name] || LEVEL_COLORS.Bronze;

export default function Profile() {
  const { user } = useAuth();
  const [rewardsData, setRewardsData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rewardsRes, leaderboardRes] = await Promise.all([
          authAPI.getRewards().catch(() => ({ data: null })),
          authAPI.getLeaderboard().catch(() => ({ data: null }))
        ]);
        
        if (rewardsRes.data) setRewardsData(rewardsRes.data);
        if (leaderboardRes.data) setLeaderboardData(leaderboardRes.data);
      } catch (err) {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="w-12 h-12 border-4 border-dark-600 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentUserRank = leaderboardData?.currentUserRank;
  const leaderboardList = leaderboardData?.leaderboard || [];
  const top3 = leaderboardList.slice(0, 3);
  const filteredLeaderboard = leaderboardList.filter(u =>
    u.name?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const levelCfg = getLevelCfg(rewardsData?.membershipLevel || 'Bronze');
  const userRankNum = currentUserRank?.rank || 'N/A';

  return (
    <div className="min-h-screen bg-dark-900 text-white pb-24">
      
      {/* ── Background Glow ── */}
      <div className="relative pt-10 pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-gold-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

          {/* ── Profile Header Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 sm:p-8 relative overflow-hidden bg-dark-800/80 backdrop-blur-md border border-dark-600 rounded-2xl mb-10"
          >
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${levelCfg.badge}`} />

            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              
              {/* Left: User Avatar & Main Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <div className="relative">
                  <div className={`absolute -inset-1 rounded-full ${levelCfg.badge} opacity-40 blur-sm`} />
                  <UserAvatar name={user?.name} size={88} ring className="relative z-10 shadow-2xl" />
                  <span className="absolute -bottom-2 -right-1 bg-dark-900 text-gold-400 p-1.5 rounded-full border border-gold-500/40 text-xs shadow-lg">
                    {levelCfg.emoji}
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">{user?.name}</h1>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${levelCfg.badge} text-white shadow-md`}>
                      {rewardsData?.membershipLevel || 'Bronze'} Member
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    {user?.email ? `+91 ${user.email}` : ''}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <Link
                      to="/orders"
                      className="btn-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 rounded-lg text-gray-300 hover:text-white"
                    >
                      <HiShoppingBag className="w-4 h-4 text-gold-400" />
                      My Orders
                    </Link>
                    <Link
                      to="/rewards"
                      className="btn-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 rounded-lg text-gold-400 hover:text-gold-300 border-gold-500/30"
                    >
                      <HiStar className="w-4 h-4 text-gold-400" />
                      My Rewards
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right: Quick Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full md:w-auto text-center border-t md:border-t-0 md:border-l border-dark-600 pt-4 md:pt-0 md:pl-8">
                <div className="bg-dark-900/60 p-3 sm:p-4 rounded-xl border border-dark-600/80">
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Total Spent</p>
                  <p className="text-lg sm:text-xl font-bold text-gold-400">₹{(currentUserRank?.totalSpent || rewardsData?.totalSpent || 0).toLocaleString()}</p>
                </div>

                <div className="bg-dark-900/60 p-3 sm:p-4 rounded-xl border border-dark-600/80">
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Orders</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{currentUserRank?.totalOrders || 0}</p>
                </div>

                <div className="bg-dark-900/60 p-3 sm:p-4 rounded-xl border border-gold-500/30 bg-gold-500/5">
                  <p className="text-[10px] sm:text-xs text-gold-400 uppercase font-semibold tracking-wider mb-1">Global Rank</p>
                  <p className="text-lg sm:text-xl font-bold gold-text">#{userRankNum}</p>
                </div>
              </div>

            </div>
          </motion.div>


          {/* ── Personal Leaderboard Rank Banner ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gold-500/20 via-amber-600/10 to-dark-800 border border-gold-500/40 p-6 mb-12 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-3xl shadow-gold shrink-0">
                  {userRankNum === 1 ? '👑' : userRankNum === 2 ? '🥈' : userRankNum === 3 ? '🥉' : '🏆'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                    Your Leaderboard Standing: <span className="gold-text">Rank #{userRankNum}</span>
                  </h3>
                  <p className="text-sm text-gray-300">
                    {userRankNum === 1 ? (
                      <span className="text-gold-300 font-medium flex items-center gap-1">
                        <HiSparkles className="w-4 h-4 text-gold-400" /> You are #1 Top Buyer on Style Heaven! Keep shining!
                      </span>
                    ) : currentUserRank?.nextRankAmountNeeded > 0 ? (
                      <span>
                        Spend <strong className="text-gold-400">₹{currentUserRank.nextRankAmountNeeded.toLocaleString()}</strong> more to overtake Rank #{userRankNum - 1}!
                      </span>
                    ) : (
                      <span>Shop your favorite outfits to climb up the leaderboard ranks!</span>
                    )}
                  </p>
                </div>
              </div>

              <Link
                to="/products"
                className="btn-primary px-6 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-gold shrink-0"
              >
                Shop Now to Rank Up <HiChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>


          {/* ── Leaderboard Section Header ── */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-3">
              <FaTrophy className="w-4 h-4 text-gold-400" />
              <span className="text-gold-400 text-xs font-bold uppercase tracking-widest">Global Rankings</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
              Style Heaven <span className="gold-text">Leaderboard</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base">
              Real-time rankings of our top spenders across all dress categories. The more you shop, the higher your rank!
            </p>
          </div>


          {/* ── Podium (Top 3 Users) ── */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end max-w-5xl mx-auto">
              
              {/* 2nd Place */}
              {top3[1] ? (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card p-6 text-center relative overflow-hidden bg-dark-800/90 border border-slate-400/40 rounded-2xl md:order-1 order-2"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-gray-500" />
                  <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400/40 text-slate-300 font-bold text-sm mx-auto mb-3 flex items-center justify-center">
                    #2
                  </div>
                  <UserAvatar name={top3[1].name} size={72} ring className="mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white truncate">{top3[1].name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 font-semibold border border-slate-400/30 inline-block mb-3">
                    🥈 {top3[1].membershipLevel}
                  </span>
                  <div className="pt-3 border-t border-dark-600">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total Purchased</p>
                    <p className="text-xl font-bold text-slate-300">₹{top3[1].totalSpent?.toLocaleString()}</p>
                  </div>
                </motion.div>
              ) : <div className="hidden md:block md:order-1" />}

              {/* 1st Place (Center / Champion) */}
              {top3[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card p-8 text-center relative overflow-hidden bg-gradient-to-b from-amber-500/15 via-dark-800 to-dark-800 border-2 border-gold-500/60 rounded-2xl shadow-gold scale-105 z-10 md:order-2 order-1"
                >
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600" />
                  <div className="w-10 h-10 rounded-full bg-gold-500 text-dark-900 font-bold text-base mx-auto mb-3 flex items-center justify-center shadow-lg">
                    👑 #1
                  </div>
                  <div className="relative inline-block mb-3">
                    <UserAvatar name={top3[0].name} size={84} ring className="mx-auto shadow-2xl" />
                    <span className="absolute -bottom-1 -right-1 text-2xl">🏆</span>
                  </div>
                  <h3 className="text-xl font-bold text-white truncate">{top3[0].name}</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 font-bold border border-gold-500/40 inline-block mb-4">
                    🥇 {top3[0].membershipLevel} VIP
                  </span>
                  <div className="pt-4 border-t border-gold-500/30">
                    <p className="text-[11px] text-gold-400 uppercase font-semibold tracking-widest">Top Dress Buyer</p>
                    <p className="text-2xl font-bold gold-text">₹{top3[0].totalSpent?.toLocaleString()}</p>
                  </div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {top3[2] ? (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="card p-6 text-center relative overflow-hidden bg-dark-800/90 border border-orange-500/40 rounded-2xl md:order-3 order-3"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-amber-700" />
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold text-sm mx-auto mb-3 flex items-center justify-center">
                    #3
                  </div>
                  <UserAvatar name={top3[2].name} size={72} ring className="mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white truncate">{top3[2].name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30 inline-block mb-3">
                    🥉 {top3[2].membershipLevel}
                  </span>
                  <div className="pt-3 border-t border-dark-600">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total Purchased</p>
                    <p className="text-xl font-bold text-orange-400">₹{top3[2].totalSpent?.toLocaleString()}</p>
                  </div>
                </motion.div>
              ) : <div className="hidden md:block md:order-3" />}

            </div>
          )}


          {/* ── Leaderboard Table Section ── */}
          <div className="card bg-dark-800/80 backdrop-blur-md border border-dark-600 rounded-2xl p-4 sm:p-6 overflow-hidden">
            
            {/* Table Search & Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  All Spenders Leaderboard <span className="text-xs font-normal text-gray-400">({leaderboardList.length} users)</span>
                </h3>
                <p className="text-xs text-gray-400">Ranked by overall dress purchases</p>
              </div>

              <div className="relative w-full sm:w-64">
                <HiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="input-field pl-9 py-2 text-xs w-full bg-dark-900 border-dark-600 focus:border-gold-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-dark-600 text-xs text-gray-400 uppercase tracking-wider bg-dark-900/50">
                    <th className="py-3 px-4 rounded-l-xl">Rank</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Total Amount Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600/50">
                  {filteredLeaderboard.map((item) => {
                    const itemCfg = getLevelCfg(item.membershipLevel);
                    const isSelf = item.isCurrentUser;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelf
                            ? 'bg-gold-500/10 hover:bg-gold-500/15 border-l-4 border-l-gold-500'
                            : 'hover:bg-dark-750'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-4 font-bold text-gray-300">
                          <div className="flex items-center gap-2">
                            {item.rank === 1 ? (
                              <span className="w-7 h-7 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center text-xs">
                                👑 1
                              </span>
                            ) : item.rank === 2 ? (
                              <span className="w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40 flex items-center justify-center text-xs">
                                🥈 2
                              </span>
                            ) : item.rank === 3 ? (
                              <span className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center text-xs">
                                🥉 3
                              </span>
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-dark-900 text-gray-400 border border-dark-600 flex items-center justify-center text-xs font-mono">
                                #{item.rank}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* User info */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={item.name} size={36} ring={isSelf} />
                            <div>
                              <p className="font-semibold text-white flex items-center gap-2">
                                {item.name}
                                {isSelf && (
                                  <span className="bg-gold-500 text-dark-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    YOU
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Membership Tier */}
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${itemCfg.bg} ${itemCfg.text} border ${itemCfg.border} inline-flex items-center gap-1`}>
                            {itemCfg.emoji} {item.membershipLevel}
                          </span>
                        </td>

                        {/* Total Orders */}
                        <td className="py-4 px-4 text-gray-300 font-mono">
                          {item.totalOrders || 0}
                        </td>

                        {/* Total Spent */}
                        <td className="py-4 px-4 text-right font-bold font-mono text-base">
                          <span className={isSelf ? 'gold-text font-extrabold' : 'text-gray-200'}>
                            ₹{item.totalSpent?.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No users found matching "{searchFilter}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
