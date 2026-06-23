import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import {
  HiCurrencyRupee, HiShoppingBag, HiCollection, HiTrendingUp,
  HiTrendingDown, HiXCircle
} from 'react-icons/hi';
import { StatCardSkeleton } from '../../components/Skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#D4AF37', '#60A5FA', '#34D399', '#A78BFA', '#F472B6', '#FBBF24'];
const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  shipped: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  delivered: 'text-green-400 bg-green-400/10 border-green-400/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardAPI.getStats();
        setStats(data);
      } catch (err) {
        console.error("Dashboard API error:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold text-white mb-8">Dashboard Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({length:4}).map((_,i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <HiXCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  const kpiCards = [
    { 
      title: 'Total Revenue', 
      value: `₹${stats.totalRevenue?.toLocaleString()}`, 
      sub: stats.revenueChange >= 0 ? `+${stats.revenueChange}% from last 30d` : `${stats.revenueChange}% from last 30d`,
      icon: HiCurrencyRupee, 
      color: 'text-green-400', 
      bg: 'bg-green-400/10',
      trend: stats.revenueChange >= 0 ? 'up' : 'down'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders, 
      sub: `${stats.todayOrders} today`,
      icon: HiShoppingBag, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10',
      trend: 'up'
    },
    { 
      title: 'Conversion Rate', 
      value: `${stats.conversionRate}%`, 
      sub: `Avg. Order: ₹${stats.avgOrderValue?.toLocaleString()}`,
      icon: HiTrendingUp, 
      color: 'text-gold-400', 
      bg: 'bg-gold-400/10',
      trend: 'up'
    },
    { 
      title: 'Active Products', 
      value: stats.totalProducts, 
      sub: stats.pendingReviews > 0 ? `${stats.pendingReviews} pending reviews` : 'All reviews approved',
      icon: HiCollection, 
      color: 'text-purple-400', 
      bg: 'bg-purple-400/10',
      trend: 'neutral'
    },
  ];

  const pieData = Object.entries(stats.orderStatusCounts || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-gray-400">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-300">Live Data Sync</span>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((c, i) => (
          <div key={i} className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6 hover:border-gold-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.bg} group-hover:scale-110 transition-transform`}>
                <c.icon className={`w-6 h-6 ${c.color}`} />
              </div>
              {c.trend === 'up' && <HiTrendingUp className="w-5 h-5 text-green-400" />}
              {c.trend === 'down' && <HiTrendingDown className="w-5 h-5 text-red-400" />}
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">{c.title}</p>
              <h3 className="text-2xl font-bold text-white mb-2">{c.value}</h3>
              <p className="text-xs text-gray-500">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Revenue Overview (Last 7 Days)</h3>
            <span className="text-xs font-medium bg-dark-700 px-2.5 py-1 rounded-md text-gray-300">Daily</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#D4AF37' }}
                  labelStyle={{ color: '#ccc', marginBottom: '4px' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{r: 6, strokeWidth: 0, fill: '#D4AF37'}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Order Status</h3>
          {pieData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 w-full">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-gray-400">{entry.name}</span>
                    <span className="text-white font-medium ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-gray-500">No order data available</div>
          )}
        </div>
      </div>

      {/* Secondary Charts & Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales by Category Bar Chart */}
        <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Units Sold by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesData} layout="vertical" margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#666" tick={{fill: '#ccc', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#2a2a2a'}}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#D4AF37' }}
                />
                <Bar dataKey="count" name="Units Sold" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products List */}
        <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Top Performing Products</h3>
            <Link to="/admin/products" className="text-sm text-gold-400 hover:text-gold-300">View All</Link>
          </div>
          <div className="space-y-4">
            {stats.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors">
                  <div className="w-8 h-8 rounded-md bg-dark-600 flex items-center justify-center text-gold-400 font-bold text-xs shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.qty} units sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">₹{p.revenue?.toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-6">No product sales yet</div>
            )}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-gold-400 hover:text-gold-300">View All</Link>
          </div>
          <div className="space-y-4">
            {stats.recentOrders && stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((o) => {
                const statusStyle = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                return (
                  <div key={o.id} className="flex flex-col gap-2 p-3 rounded-lg bg-dark-700/50 border border-dark-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-white">{o.customerName}</p>
                        <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-bold text-white">₹{o.total?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500 font-mono">#{o.shortId}</p>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${statusStyle}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-gray-500 py-6">No recent orders</div>
            )}
          </div>
        </div>
        
      </div>

      {/* Inventory Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              Low Stock Alerts
            </h3>
            <span className="text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded">Action Required</span>
          </div>
          <div className="space-y-4">
            {stats.lowStock && stats.lowStock.length > 0 ? (
              stats.lowStock.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-dark-700/50 border border-dark-600">
                  <p className="text-sm font-medium text-white truncate flex-1 pr-4">{p.name}</p>
                  <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                    Only {p.stock} left
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-6">All products are sufficiently stocked</div>
            )}
          </div>
        </div>

        {/* Out of Stock Products */}
        <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Out of Stock
            </h3>
            <span className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded">Critical</span>
          </div>
          <div className="space-y-4">
            {stats.outOfStock && stats.outOfStock.length > 0 ? (
              stats.outOfStock.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-dark-700/50 border border-dark-600">
                  <p className="text-sm font-medium text-white truncate flex-1 pr-4">{p.name}</p>
                  <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                    Sold Out
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-6">No products are out of stock</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
