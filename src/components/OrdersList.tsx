import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Order } from '../db';
import { Search, Filter, Printer, Trash2, Edit, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import BillView from './BillView';
import EditOrderModal from './EditOrderModal';

interface OrdersListProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export default function OrdersList({ notify }: OrdersListProps) {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [viewingBillId, setViewingBillId] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const orders = useLiveQuery(() => {
    let query = db.orders.orderBy('createdAt').reverse();
    return query.toArray();
  }) || [];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.shopName.toLowerCase().includes(search.toLowerCase()) || 
                          order.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateFilter || order.orderDate === dateFilter;
    const matchesStatus = !statusFilter || order.paymentStatus === statusFilter;
    return matchesSearch && matchesDate && matchesStatus;
  });

  const deleteOrder = async (order: Order) => {
    if (!window.confirm('Are you sure you want to delete this order? Stock will be returned.')) return;

    try {
      await db.transaction('rw', db.orders, db.products, async () => {
        // Return stock
        for (const item of order.products) {
          await db.products.where('id').equals(item.productId).modify(p => {
            p.stock += item.quantity;
          });
        }
        await db.orders.delete(order.id!);
      });
      notify('Order deleted and stock returned');
    } catch (err) {
      console.error(err);
      notify('Failed to delete order', 'error');
    }
  };

  if (viewingBillId) {
    const order = orders.find(o => o.id === viewingBillId);
    if (order) return <BillView order={order} onBack={() => setViewingBillId(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by shop name or invoice #..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <select
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-semibold">Invoice #</th>
              <th className="px-6 py-4 font-semibold">Shop</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredOrders.map((order) => (
              <React.Fragment key={order.id}>
                <tr className={cn("hover:bg-slate-50 transition-colors", expandedOrderId === order.id && "bg-slate-50")}>
                  <td className="px-6 py-4 font-medium text-slate-900">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-slate-700">{order.shopName}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(order.orderDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(order.grandTotal)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      order.paymentStatus === 'Cash' ? "bg-green-100 text-green-700" :
                      order.paymentStatus === 'Credit' ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    )}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => setViewingBillId(order.id!)}
                        className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-orange-500 shadow-sm border border-transparent hover:border-slate-200"
                        title="Print Preview"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setEditingOrder(order)}
                        className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-blue-500 shadow-sm border border-transparent hover:border-slate-200"
                        title="Edit Order"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id!)}
                        className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-200"
                      >
                        {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={() => deleteOrder(order)}
                        className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-red-500 shadow-sm border border-transparent hover:border-slate-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr>
                    <td colSpan={6} className="bg-slate-50/50 px-6 py-4">
                      <div className="rounded-lg border bg-white p-4">
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Order Items</h4>
                        <div className="space-y-2">
                          {order.products.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-500">{item.quantity}x</span>
                                <div>
                                  <p className="font-medium text-slate-800">{item.name}</p>
                                  <p className="text-[10px] text-slate-500">{item.weight}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-slate-900">{formatCurrency(item.total)}</p>
                                <p className="text-[10px] text-slate-400">@{formatCurrency(item.rate)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-between border-t pt-3 text-sm">
                          <div className="flex flex-col space-y-1">
                            <span className="text-slate-500">Delivery Date: {new Date(order.deliveryDate).toLocaleDateString('en-IN')}</span>
                            <button 
                              onClick={() => setViewingBillId(order.id!)}
                              className="mt-2 flex w-fit items-center space-x-2 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-100"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Print Preview</span>
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Subtotal: {formatCurrency(order.subtotal)}</p>
                            <p className="text-xs text-slate-500">Discount: {formatCurrency(order.discount)}</p>
                            <p className="font-bold text-slate-900">Grand Total: {formatCurrency(order.grandTotal)}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No orders found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingOrder && (
        <EditOrderModal 
          order={editingOrder} 
          onClose={() => setEditingOrder(null)} 
          notify={notify} 
        />
      )}
    </div>
  );
}
