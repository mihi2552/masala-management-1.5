import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Package, 
  Store, 
  CreditCard 
} from 'lucide-react';
import { cn, formatCurrency, formatProductName } from '../lib/utils';

export default function Reports() {
  const [reportType, setReportType] = useState<'daily' | 'shop' | 'product' | 'stock'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const shops = useLiveQuery(() => db.shops.toArray()) || [];

  const dailyReport = useMemo(() => {
    const filtered = orders.filter(o => o.orderDate === selectedDate);
    const totalSales = filtered.reduce((sum, o) => sum + o.grandTotal, 0);
    const cashSales = filtered.filter(o => o.paymentStatus === 'Cash').reduce((sum, o) => sum + o.grandTotal, 0);
    const creditSales = filtered.filter(o => o.paymentStatus === 'Credit').reduce((sum, o) => sum + o.grandTotal, 0);
    
    return {
      orders: filtered,
      totalSales,
      cashSales,
      creditSales,
      count: filtered.length
    };
  }, [orders, selectedDate]);

  const shopReport = useMemo(() => {
    const report: Record<number, { name: string, total: number, orderCount: number }> = {};
    orders.forEach(o => {
      if (!report[o.shopId]) {
        report[o.shopId] = { name: o.shopName, total: 0, orderCount: 0 };
      }
      report[o.shopId].total += o.grandTotal;
      report[o.shopId].orderCount += 1;
    });
    return Object.values(report).sort((a, b) => b.total - a.total);
  }, [orders]);

  const productReport = useMemo(() => {
    const report: Record<number, { name: string, qty: number, total: number }> = {};
    orders.forEach(o => {
      o.products.forEach(p => {
        if (!report[p.productId]) {
          const product = products.find(prod => prod.id === p.productId);
          report[p.productId] = { 
            name: product ? formatProductName(product.nameGujarati, product.nameEnglish) : p.name, 
            qty: 0, 
            total: 0 
          };
        }
        report[p.productId].qty += p.quantity;
        report[p.productId].total += p.total;
      });
    });
    return Object.values(report).sort((a, b) => b.qty - a.qty);
  }, [orders, products]);

  const handleExport = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `report_${reportType}_${Date.now()}.csv`;

    if (reportType === 'daily') {
      headers = ['Order #', 'Shop', 'Total', 'Status'];
      rows = dailyReport.orders.map(o => [o.orderNumber, o.shopName, o.grandTotal, o.paymentStatus]);
    } else if (reportType === 'shop') {
      headers = ['Shop Name', 'Total Orders', 'Total Purchase'];
      rows = shopReport.map(s => [s.name, s.orderCount, s.total]);
    } else if (reportType === 'product') {
      headers = ['Product Name', 'Total Qty Sold', 'Total Revenue'];
      rows = productReport.map(p => [p.name, p.qty, p.total]);
    } else if (reportType === 'stock') {
      headers = ['Product Name', 'Current Stock', 'Weight'];
      rows = products.map(p => [p.nameGujarati, p.stock, p.weight]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Report Selector */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:items-center justify-between">
        <div className="flex space-x-1 rounded-lg bg-slate-100 p-1">
          {[
            { id: 'daily', label: 'Daily Sales', icon: Calendar },
            { id: 'shop', label: 'Shop-wise', icon: Store },
            { id: 'product', label: 'Product-wise', icon: Package },
            { id: 'stock', label: 'Stock Report', icon: BarChart3 },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id as any)}
              className={cn(
                "flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                reportType === type.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <type.icon className="h-4 w-4" />
              <span>{type.label}</span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-3">
          {reportType === 'daily' && (
            <input
              type="date"
              className="rounded-lg border border-slate-200 py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'daily' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Total Sales</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(dailyReport.totalSales)}</p>
              <p className="mt-1 text-xs text-slate-400">{dailyReport.count} Orders</p>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Cash Collection</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(dailyReport.cashSales)}</p>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Credit Sales</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(dailyReport.creditSales)}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Shop Name</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dailyReport.orders.map(o => (
                  <tr key={o.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">{o.orderNumber}</td>
                    <td className="px-6 py-4 text-slate-700">{o.shopName}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(o.grandTotal)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        o.paymentStatus === 'Cash' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      )}>{o.paymentStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'shop' && (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Shop Name</th>
                <th className="px-6 py-4 text-center">Total Orders</th>
                <th className="px-6 py-4 text-right">Total Purchase Value</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shopReport.map((s, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{s.orderCount}</td>
                  <td className="px-6 py-4 text-right font-bold text-orange-600">{formatCurrency(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'product' && (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4 text-center">Qty Sold</th>
                <th className="px-6 py-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {productReport.map((p, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{p.qty}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'stock' && (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Weight</th>
                <th className="px-6 py-4 text-right">Current Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">{formatProductName(p.nameGujarati, p.nameEnglish)}</td>
                  <td className="px-6 py-4 text-slate-500">{p.weight}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "font-bold",
                      p.stock < 10 ? "text-red-500" : "text-green-600"
                    )}>{p.stock}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
