import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Order, type OrderItem, type Product } from '../db';
import { X, Search, Plus, Trash2, Calendar, ShoppingCart } from 'lucide-react';
import { cn, formatCurrency, formatProductName } from '../lib/utils';

interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export default function EditOrderModal({ order, onClose, notify }: EditOrderModalProps) {
  const [cart, setCart] = useState<OrderItem[]>(order.products);
  const [discount, setDiscount] = useState(0); // This will be the extra discount beyond item-level discounts
  const [orderDate, setOrderDate] = useState(order.orderDate);
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [productSearch, setProductSearch] = useState('');

  // Calculate the extra discount that was applied to the original order
  useEffect(() => {
    const itemDiscounts = order.products.reduce((sum, item) => sum + (item.discount || 0), 0);
    const extraDiscount = order.discount - itemDiscounts;
    setDiscount(extraDiscount > 0 ? extraDiscount : 0);
  }, [order]);

  const products = useLiveQuery(() => db.products.toArray()) || [];

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    const search = productSearch.toLowerCase();
    return products.filter(p => 
      p.nameGujarati.toLowerCase().includes(search) ||
      (p.nameEnglish || '').toLowerCase().includes(search) ||
      p.weight.toLowerCase().includes(search)
    ).slice(0, 8);
  }, [products, productSearch]);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      notify('Product already in cart', 'error');
      return;
    }

    const newItem: OrderItem = {
      productId: product.id!,
      name: formatProductName(product.nameGujarati, product.nameEnglish),
      weight: product.weight,
      quantity: 1,
      rate: product.price,
      discount: 0,
      total: product.price
    };

    setCart([...cart, newItem]);
    setProductSearch('');
  };

  const updateCartItem = (index: number, updates: Partial<OrderItem>) => {
    const newCart = [...cart];
    const item = { ...newCart[index], ...updates };
    item.total = (item.quantity * item.rate) - (item.discount || 0);
    newCart[index] = item;
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalItemDiscounts = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalDiscount = totalItemDiscounts + discount;
  const grandTotal = subtotal - totalDiscount;

  const handleUpdateOrder = async () => {
    if (cart.length === 0) {
      notify('Cart cannot be empty', 'error');
      return;
    }

    try {
      await db.transaction('rw', db.orders, db.products, async () => {
        // 1. Revert old stock
        for (const item of order.products) {
          await db.products.where('id').equals(item.productId).modify(p => {
            p.stock += item.quantity;
          });
        }

        // 2. Deduct new stock
        for (const item of cart) {
          await db.products.where('id').equals(item.productId).modify(p => {
            p.stock -= item.quantity;
          });
        }

        // 3. Update order
        await db.orders.update(order.id!, {
          orderDate,
          deliveryDate,
          products: cart,
          subtotal,
          discount: totalDiscount,
          grandTotal,
          paymentStatus
        });
      });

      notify('Order updated successfully');
      onClose();
    } catch (err: any) {
      console.error(err);
      notify(err.message || 'Failed to update order', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Edit Order: {order.orderNumber}</h2>
            <p className="text-sm text-slate-500">{order.shopName}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Product Selection & Cart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Search */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Gujarati, English or Weight..."
                    className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                {filteredProducts.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white py-1 shadow-lg max-h-48 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-slate-50"
                        onClick={() => addToCart(product)}
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{formatProductName(product.nameGujarati, product.nameEnglish)}</p>
                          <p className="text-xs text-slate-500">{product.weight} • {formatCurrency(product.price)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={cn("text-xs font-bold", product.stock < 10 ? "text-red-500" : "text-green-500")}>
                            Stock: {product.stock}
                          </span>
                          <Plus className="h-4 w-4 text-orange-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Table */}
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Rate</th>
                      <th className="px-4 py-3 font-semibold">Disc</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cart.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{item.weight}</p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            className="w-14 rounded border border-slate-200 px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            className="w-20 rounded border border-slate-200 px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                            value={item.rate}
                            onChange={(e) => updateCartItem(idx, { rate: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            className="w-16 rounded border border-slate-200 px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                            value={item.discount || 0}
                            onChange={(e) => updateCartItem(idx, { discount: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeFromCart(idx)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Order Details */}
            <div className="space-y-6">
              <div className="rounded-xl border bg-slate-50 p-4 space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Order Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:outline-none"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Delivery Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:outline-none"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Payment Status</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['Cash', 'Credit', 'Pending'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setPaymentStatus(status as any)}
                        className={cn(
                          "rounded-lg border py-2 text-[10px] font-bold transition-colors",
                          paymentStatus === status 
                            ? "border-orange-500 bg-orange-50 text-orange-700" 
                            : "border-slate-200 bg-white text-slate-600"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Extra Discount</span>
                  <input
                    type="number"
                    className="w-20 rounded border border-slate-200 px-2 py-0.5 text-right text-sm focus:outline-none"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-orange-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end space-x-3 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateOrder}
            className="rounded-xl bg-orange-500 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-600"
          >
            Update Order
          </button>
        </div>
      </div>
    </div>
  );
}
