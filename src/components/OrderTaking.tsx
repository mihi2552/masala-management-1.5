import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Product, type Shop, type OrderItem } from '../db';
import { Search, Plus, Trash2, ShoppingCart, User, Calendar, CreditCard } from 'lucide-react';
import { cn, formatCurrency, generateInvoiceNumber, formatProductName } from '../lib/utils';

interface OrderTakingProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export default function OrderTaking({ notify }: OrderTakingProps) {
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'Cash' | 'Credit' | 'Pending'>('Cash');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const shops = useLiveQuery(() => db.shops.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];

  const filteredShops = useMemo(() => {
    if (!shopSearch) return [];
    return shops.filter(s => 
      s.name.toLowerCase().includes(shopSearch.toLowerCase()) || 
      s.code.toLowerCase().includes(shopSearch.toLowerCase()) ||
      s.area.toLowerCase().includes(shopSearch.toLowerCase())
    ).slice(0, 5);
  }, [shops, shopSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    const search = productSearch.toLowerCase();
    return products.filter(p => 
      p.nameGujarati.toLowerCase().includes(search) ||
      (p.nameEnglish || '').toLowerCase().includes(search) ||
      p.weight.toLowerCase().includes(search)
    ).slice(0, 8);
  }, [products, productSearch]);

  const selectedShop = useMemo(() => 
    shops.find(s => s.id === selectedShopId), 
  [shops, selectedShopId]);

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
    item.total = (item.quantity * item.rate) - item.discount;
    newCart[index] = item;
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0) + discount;
  const grandTotal = subtotal - totalDiscount;

  const saveOrder = async () => {
    if (!selectedShopId) {
      notify('Please select a shop', 'error');
      return;
    }
    if (cart.length === 0) {
      notify('Cart is empty', 'error');
      return;
    }

    try {
      const orderNumber = generateInvoiceNumber();
      const order: any = {
        orderNumber,
        shopId: selectedShopId,
        shopName: selectedShop?.name || '',
        orderDate,
        deliveryDate,
        products: cart,
        subtotal,
        discount: totalDiscount,
        grandTotal,
        paymentStatus,
        createdAt: Date.now()
      };

      await db.transaction('rw', db.orders, db.products, async () => {
        await db.orders.add(order);
        // Deduct stock
        for (const item of cart) {
          await db.products.where('id').equals(item.productId).modify(p => {
            p.stock -= item.quantity;
          });
        }
      });

      notify('Order saved successfully!');
      setCart([]);
      setSelectedShopId(null);
      setShopSearch('');
      setDiscount(0);
    } catch (err) {
      console.error(err);
      notify('Failed to save order', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column: Shop & Product Selection */}
      <div className="lg:col-span-2 space-y-6">
        {/* Shop Selection */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center space-x-2 text-slate-800">
            <User className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Select Shop</h3>
          </div>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search shop by name, code or area..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                value={shopSearch}
                onChange={(e) => {
                  setShopSearch(e.target.value);
                  if (selectedShopId) setSelectedShopId(null);
                }}
              />
            </div>
            {filteredShops.length > 0 && !selectedShopId && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white py-1 shadow-lg">
                {filteredShops.map(shop => (
                  <button
                    key={shop.id}
                    className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      setSelectedShopId(shop.id!);
                      setShopSearch(shop.name);
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{shop.name}</p>
                      <p className="text-xs text-slate-500">{shop.area} • {shop.code}</p>
                    </div>
                    <Plus className="h-4 w-4 text-orange-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedShop && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900">{selectedShop.name}</p>
                  <p className="text-sm text-slate-600">{selectedShop.address}</p>
                  <p className="text-xs text-slate-500 mt-1">Credit Limit: {formatCurrency(selectedShop.creditLimit)}</p>
                </div>
                <button onClick={() => {setSelectedShopId(null); setShopSearch('');}} className="text-xs text-red-500 hover:underline">Change</button>
              </div>
            </div>
          )}
        </div>

        {/* Product Selection */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center space-x-2 text-slate-800">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Add Products</h3>
          </div>
          <div className="relative mb-6">
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
              <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white py-1 shadow-lg max-h-60 overflow-y-auto">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500 uppercase text-xs">
                  <th className="pb-3 font-semibold">Item</th>
                  <th className="pb-3 font-semibold">Qty</th>
                  <th className="pb-3 font-semibold">Rate</th>
                  <th className="pb-3 font-semibold">Disc</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cart.map((item, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-4">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.weight}</p>
                    </td>
                    <td className="py-4">
                      <input
                        type="number"
                        min="1"
                        className="w-16 rounded border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={item.quantity}
                        onChange={(e) => updateCartItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                      />
                    </td>
                    <td className="py-4">
                      <input
                        type="number"
                        className="w-20 rounded border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={item.rate}
                        onChange={(e) => updateCartItem(idx, { rate: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="py-4">
                      <input
                        type="number"
                        className="w-16 rounded border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={item.discount}
                        onChange={(e) => updateCartItem(idx, { discount: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="py-4 font-semibold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="py-4 text-right">
                      <button onClick={() => removeFromCart(idx)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No products added to cart
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div className="space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-slate-800">Order Summary</h3>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase">Order Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase">Delivery Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase">Payment Status</label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Credit', 'Pending'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setPaymentStatus(status as any)}
                    className={cn(
                      "rounded-lg border py-2 text-xs font-medium transition-colors",
                      paymentStatus === status 
                        ? "border-orange-500 bg-orange-50 text-orange-700" 
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3 border-t pt-6">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Discount</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Extra:</span>
                <input
                  type="number"
                  className="w-16 rounded border border-slate-200 px-2 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-bold text-slate-900">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={saveOrder}
            disabled={cart.length === 0 || !selectedShopId}
            className="mt-8 w-full rounded-xl bg-orange-500 py-4 font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
          >
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
}
