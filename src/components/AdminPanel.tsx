import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Product, type Shop } from '../db';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Store, 
  Package, 
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { cn, formatCurrency, formatProductName } from '../lib/utils';

interface AdminPanelProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminPanel({ notify }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'shops'>('products');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAddingShop, setIsAddingShop] = useState(false);

  // Form states
  const [shopForm, setShopForm] = useState<Partial<Shop>>({
    name: '', code: '', owner: '', contact: '', area: '', address: '', creditLimit: 5000
  });

  const products = useLiveQuery(() => db.products.toArray()) || [];
  const shops = useLiveQuery(() => db.shops.toArray()) || [];

  const filteredProducts = products.filter(p => 
    p.nameGujarati.toLowerCase().includes(search.toLowerCase()) ||
    (p.nameEnglish || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredShops = shops.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdateStock = async (id: number, newStock: number) => {
    try {
      await db.products.update(id, { stock: newStock });
      notify('Stock updated');
    } catch (err) {
      console.error(err);
      notify('Failed to update stock', 'error');
    }
  };

  const handleUpdatePrice = async (id: number, newPrice: number) => {
    try {
      await db.products.update(id, { price: newPrice });
      notify('Price updated');
    } catch (err) {
      console.error(err);
      notify('Failed to update price', 'error');
    }
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.shops.add({
        ...shopForm as Shop,
        createdAt: Date.now()
      });
      notify('Shop added successfully');
      setIsAddingShop(false);
      setShopForm({ name: '', code: '', owner: '', contact: '', area: '', address: '', creditLimit: 5000 });
    } catch (err) {
      notify('Failed to add shop', 'error');
    }
  };

  const handleDeleteShop = async (id: number) => {
    if (!window.confirm('Delete this shop?')) return;
    await db.shops.delete(id);
    notify('Shop deleted');
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => {setActiveSubTab('products'); setSearch('');}}
          className={cn(
            "flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeSubTab === 'products' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Package className="h-4 w-4" />
          <span>Product Management</span>
        </button>
        <button
          onClick={() => {setActiveSubTab('shops'); setSearch('');}}
          className={cn(
            "flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeSubTab === 'shops' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Store className="h-4 w-4" />
          <span>Shop Management</span>
        </button>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeSubTab}...`}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {activeSubTab === 'shops' && !isAddingShop && (
          <button 
            onClick={() => setIsAddingShop(true)}
            className="flex items-center space-x-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Shop</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      {activeSubTab === 'products' ? (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Weight</th>
                <th className="px-6 py-4">Price (₹)</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{formatProductName(product.nameGujarati, product.nameEnglish)}</td>
                  <td className="px-6 py-4 text-slate-500">{product.weight}</td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      className="w-20 rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={product.price}
                      onChange={(e) => handleUpdatePrice(product.id!, parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      className="w-20 rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={product.stock}
                      onChange={(e) => handleUpdateStock(product.id!, parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {product.stock < 10 ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>Low Stock</span>
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-green-500">In Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {isAddingShop && (
            <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-6 shadow-sm animate-in slide-in-from-top-4">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Add New Shop</h3>
                <button onClick={() => setIsAddingShop(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddShop} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Shop Name</label>
                  <input required className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Shop Code</label>
                  <input required className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" value={shopForm.code} onChange={e => setShopForm({...shopForm, code: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Owner Name</label>
                  <input required className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" value={shopForm.owner} onChange={e => setShopForm({...shopForm, owner: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Contact</label>
                  <input required className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" value={shopForm.contact} onChange={e => setShopForm({...shopForm, contact: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Area</label>
                  <input required className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" value={shopForm.area} onChange={e => setShopForm({...shopForm, area: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Credit Limit</label>
                  <input type="number" required className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" value={shopForm.creditLimit} onChange={e => setShopForm({...shopForm, creditLimit: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Address</label>
                  <textarea required rows={2} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" value={shopForm.address} onChange={e => setShopForm({...shopForm, address: e.target.value})} />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" className="flex items-center space-x-2 rounded-lg bg-orange-500 px-6 py-2 font-bold text-white hover:bg-orange-600 transition-colors">
                    <Save className="h-4 w-4" />
                    <span>Save Shop</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredShops.map(shop => (
              <div key={shop.id} className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Store className="h-6 w-6" />
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleDeleteShop(shop.id!)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-lg font-bold text-slate-900">{shop.name}</h4>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{shop.code} • {shop.area}</p>
                </div>
                <div className="mt-6 space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Owner</span>
                    <span className="font-medium text-slate-900">{shop.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact</span>
                    <span className="font-medium text-slate-900">{shop.contact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Credit Limit</span>
                    <span className="font-bold text-orange-600">{formatCurrency(shop.creditLimit)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
