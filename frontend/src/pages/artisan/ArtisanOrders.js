import React, { useEffect, useState } from 'react';
import { artisanAPI } from '../../services/api';
export default function ArtisanOrders() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { artisanAPI.getMyStats().then(({ data }) => { setData(data); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const STATUS_COLOR = { pending: 'bg-yellow-500/20 text-yellow-400', processing: 'bg-blue-500/20 text-blue-400', shipped: 'bg-purple-500/20 text-purple-400', delivered: 'bg-green-500/20 text-green-400', cancelled: 'bg-red-500/20 text-red-400' };
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-serif font-bold text-white">My Orders</h1><p className="text-gray-400 text-sm mt-1">Orders containing your products</p></div>
      <div className="card p-6">
        {loading ? <div className="h-40 shimmer rounded-lg" /> : data?.recentOrders?.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-gray-400 border-b border-dark-500 text-left">{['Product','Qty','Amount','Status','Date'].map(h => <th key={h} className="pb-3 pr-4">{h}</th>)}</tr></thead>
            <tbody>{data.recentOrders.map((item, i) => (
              <tr key={i} className="border-b border-dark-600/50 hover:bg-dark-700/30">
                <td className="py-3 pr-4 text-gray-300 font-medium">{item.products?.name || 'Product'}</td>
                <td className="py-3 pr-4 text-gray-400">{item.quantity}</td>
                <td className="py-3 pr-4 text-gold-400 font-semibold">Rs.{(item.price_at_time * item.quantity).toLocaleString()}</td>
                <td className="py-3 pr-4"><span className={'badge ' + (STATUS_COLOR[item.orders?.status] || 'bg-gray-500/20 text-gray-400')}>{item.orders?.status || 'pending'}</span></td>
                <td className="py-3 text-gray-500 text-xs">{item.orders?.created_at ? new Date(item.orders.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="text-center py-10 text-gray-500"><div className="text-4xl mb-3">📦</div><p>No orders yet. Publish products to start receiving orders!</p></div>}
      </div>
    </div>
  );
}
