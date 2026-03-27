import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  TrendingUp, 
  Package, 
  Store, 
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  setActiveTab: (tab: any) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const todayOrders = useLiveQuery(() => 
    db.orders.where('orderDate').equals(today).toArray()
  ) || [];

  const allOrders = useLiveQuery(() => db.orders.toArray()) || [];
  const allShops = useLiveQuery(() => db.shops.toArray()) || [];
  const lowStockProducts = useLiveQuery(() => 
    db.products.where('stock').below(10).toArray()
  ) || [];

  const totalTodayValue = todayOrders.reduce((sum, order) => sum + order.grandTotal, 0);
  const pendingDeliveries = allOrders.filter(o => o.paymentStatus === 'Pending').length;

  // Chart Data (Last 7 days)
  const chartData = React.useMemo(() => {
    const data: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => data[date] = 0);
    allOrders.forEach(order => {
      if (data[order.orderDate] !== undefined) {
        data[order.orderDate] += order.grandTotal;
      }
    });

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      amount: data[date]
    }));
  }, [allOrders]);

  const stats = [
    { label: "Today's Orders", value: todayOrders.length, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Today's Sales", value: formatCurrency(totalTodayValue), icon: Clock, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Shops", value: allShops.length, icon: Store, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Low Stock Items", value: lowStockProducts.length, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={cn("rounded-lg p-3", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Sales Chart */}
        <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Sales Overview (Last 7 Days)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setActiveTab('order-taking')}
                className="flex w-full items-center justify-between rounded-lg bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                Create New Order
                <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setActiveTab('master-list')}
                className="flex w-full items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Generate Master List
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {lowStockProducts.length > 0 && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 shadow-sm">
              <div className="mb-4 flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-semibold">Stock Alerts</h3>
              </div>
              <div className="space-y-3">
                {lowStockProducts.slice(0, 3).map(product => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{product.nameGujarati}</span>
                    <span className="font-bold text-red-600">{product.stock} left</span>
                  </div>
                ))}
                {lowStockProducts.length > 3 && (
                  <button 
                    onClick={() => setActiveTab('admin')}
                    className="text-xs font-medium text-red-700 underline"
                  >
                    View all {lowStockProducts.length} alerts
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
