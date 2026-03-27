import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Warehouse, Printer, Download, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn, formatProductName } from '../lib/utils';

export default function MasterList() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const orders = useLiveQuery(() => 
    db.orders.where('orderDate').equals(selectedDate).toArray()
  ) || [];

  const products = useLiveQuery(() => db.products.toArray()) || [];

  const masterList = useMemo(() => {
    const aggregation: Record<number, { 
      name: string, 
      weight: string, 
      totalOrdered: number, 
      currentStock: number 
    }> = {};

    orders.forEach(order => {
      order.products.forEach(item => {
        if (!aggregation[item.productId]) {
          const product = products.find(p => p.id === item.productId);
          aggregation[item.productId] = {
            name: product ? formatProductName(product.nameGujarati, product.nameEnglish) : item.name,
            weight: item.weight,
            totalOrdered: 0,
            currentStock: product?.stock || 0
          };
        }
        aggregation[item.productId].totalOrdered += item.quantity;
      });
    });

    return Object.entries(aggregation).map(([id, data]) => ({
      id: parseInt(id),
      ...data,
      toTake: Math.max(0, data.totalOrdered - data.currentStock)
    }));
  }, [orders, products]);

  const totalToTake = masterList.reduce((sum, item) => sum + item.toTake, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Product Name', 'Weight', 'Ordered Qty', 'Current Stock', 'To Take from Godown'];
    const rows = masterList.map(item => [
      item.name,
      item.weight,
      item.totalOrdered,
      item.currentStock,
      item.toTake
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `master_list_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <div className="rounded-lg bg-orange-50 p-2">
            <Warehouse className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Master List Generation</h3>
            <p className="text-sm text-slate-500">Calculate items needed from godown</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              className="rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 print:hidden">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Products Needed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{masterList.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Qty to Take</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{totalToTake}</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Selected Date</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
        </div>
      </div>

      {/* Master List Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm print:border-none print:shadow-none">
        <div className="hidden print:block mb-8 text-center">
          <h1 className="text-2xl font-bold">મસાલા વ્યાપાર - Master List</h1>
          <p className="text-slate-500">Date: {new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs print:bg-transparent">
            <tr>
              <th className="px-6 py-4 font-semibold">Product Name</th>
              <th className="px-6 py-4 font-semibold">Weight</th>
              <th className="px-6 py-4 font-semibold text-center">Ordered</th>
              <th className="px-6 py-4 font-semibold text-center">Home Stock</th>
              <th className="px-6 py-4 font-semibold text-right text-orange-600">To Take from Godown</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {masterList.map((item) => (
              <tr key={item.id} className={cn(
                "hover:bg-slate-50 transition-colors",
                item.toTake > 0 ? "bg-orange-50/30" : ""
              )}>
                <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                <td className="px-6 py-4 text-slate-500">{item.weight}</td>
                <td className="px-6 py-4 text-center font-medium">{item.totalOrdered}</td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "font-medium",
                    item.currentStock < item.totalOrdered ? "text-red-500" : "text-slate-600"
                  )}>
                    {item.currentStock}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={cn(
                    "inline-flex rounded-lg px-3 py-1 text-sm font-bold",
                    item.toTake > 0 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-400"
                  )}>
                    {item.toTake}
                  </span>
                </td>
              </tr>
            ))}
            {masterList.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No orders found for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="hidden print:block mt-8 border-t pt-4 text-right">
          <p className="text-lg font-bold">Total Items to Take: {totalToTake}</p>
        </div>
      </div>

      {/* Warnings */}
      {masterList.some(item => item.currentStock < item.totalOrdered) && (
        <div className="flex items-center space-x-3 rounded-lg border border-red-100 bg-red-50 p-4 text-red-700 print:hidden">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">Warning: Some products have insufficient home stock to fulfill orders.</p>
        </div>
      )}
    </div>
  );
}
