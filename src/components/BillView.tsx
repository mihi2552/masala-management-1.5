import React from 'react';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { type Order } from '../db';

interface BillViewProps {
  order: Order;
  onBack: () => void;
}

export default function BillView({ order, onBack }: BillViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to List</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <h2 className="text-lg font-bold text-slate-800">Print Preview</h2>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>Confirm & Print Bill</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-orange-50 p-4 text-center text-xs font-medium text-orange-700 print:hidden">
        This is a preview of how the bill will look when printed. Please check the details before confirming.
      </div>

      {/* Bill Content */}
      <div className="mx-auto max-w-3xl rounded-xl border bg-white p-8 shadow-sm print:border-none print:p-0 print:shadow-none">
        <div className="flex justify-between border-b pb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">મસાલા વ્યાપાર</h1>
            <p className="mt-1 text-slate-500">Wholesale Masala Business</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase text-slate-400">Invoice</p>
            <p className="text-lg font-bold text-slate-900">{order.orderNumber}</p>
            <p className="text-sm text-slate-500">{new Date(order.orderDate).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bill To:</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{order.shopName}</p>
            <p className="text-sm text-slate-600">Payment Status: <span className="font-semibold">{order.paymentStatus}</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Date:</p>
            <p className="mt-2 text-slate-900">{new Date(order.deliveryDate).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <table className="mt-12 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
              <th className="pb-4">Item Description</th>
              <th className="pb-4 text-center">Weight</th>
              <th className="pb-4 text-center">Qty</th>
              <th className="pb-4 text-right">Rate</th>
              <th className="pb-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.products.map((item, i) => (
              <tr key={i}>
                <td className="py-4 font-medium text-slate-900">{item.name}</td>
                <td className="py-4 text-center text-slate-500">{item.weight}</td>
                <td className="py-4 text-center text-slate-900">{item.quantity}</td>
                <td className="py-4 text-right text-slate-500">{formatCurrency(item.rate)}</td>
                <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end border-t pt-8">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Discount</span>
              <span>- {formatCurrency(order.discount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-900 pt-3 text-xl font-bold text-slate-900">
              <span>Grand Total</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t pt-8 text-center">
          <p className="text-lg font-bold text-slate-800">આભાર</p>
          <p className="text-xs text-slate-400 mt-1">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
