/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, INITIAL_PRODUCTS, type Product, type Shop, type Order } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ListOrdered, 
  Warehouse, 
  Settings, 
  BarChart3,
  Menu,
  X,
  Plus,
  Search,
  Trash2,
  Edit,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency } from './lib/utils';

// Components
import Dashboard from './components/Dashboard';
import OrderTaking from './components/OrderTaking';
import OrdersList from './components/OrdersList';
import MasterList from './components/MasterList';
import AdminPanel from './components/AdminPanel';
import Reports from './components/Reports';

import { ErrorBoundary } from './components/ErrorBoundary';

type Tab = 'dashboard' | 'order-taking' | 'orders-list' | 'master-list' | 'admin' | 'reports';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<{id: number, message: string, type: 'success' | 'error'}[]>([]);

  // Initial Data Loading
  useEffect(() => {
    const init = async () => {
      try {
        const productCount = await db.products.count();
        if (productCount === 0) {
          await db.products.bulkAdd(INITIAL_PRODUCTS.map(p => ({ ...p, createdAt: Date.now() })));
        } else {
          // Migration: Ensure all products have English names if they were added before the field existed
          const allProducts = await db.products.toArray();
          const updates = allProducts
            .filter(p => !p.nameEnglish)
            .map(p => {
              const initial = INITIAL_PRODUCTS.find(ip => ip.nameGujarati === p.nameGujarati);
              if (initial) {
                return db.products.update(p.id!, { nameEnglish: initial.nameEnglish });
              }
              return null;
            })
            .filter(Boolean);
          
          if (updates.length > 0) {
            await Promise.all(updates);
            console.log(`Migrated ${updates.length} products with English names`);
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
        addNotification('Failed to initialize database', 'error');
      }
    };
    init();
  }, []);

  const addNotification = (message: any, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    const msgString = typeof message === 'string' ? message : (message?.message || String(message));
    setNotifications(prev => [...prev, { id, message: msgString, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'order-taking', label: 'Order Taking', icon: ShoppingCart },
    { id: 'orders-list', label: 'Orders List', icon: ListOrdered },
    { id: 'master-list', label: 'Master List', icon: Warehouse },
    { id: 'admin', label: 'Admin Panel', icon: Settings },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              મસાલા <span className="text-orange-500">વ્યાપાર</span>
            </h1>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={cn(
                  "group flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id 
                    ? "bg-orange-500 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <tab.icon className={cn(
                  "mr-3 h-5 w-5 shrink-0",
                  activeTab === tab.id ? "text-white" : "text-slate-400 group-hover:text-white"
                )} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-slate-800 p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white">
                MV
              </div>
              <div>
                <p className="text-sm font-medium text-white">Gujarati Masala</p>
                <p className="text-xs text-slate-400">Wholesale Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6 lg:px-8">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold capitalize text-slate-800">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500">{new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</span>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <ErrorBoundary>
            {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'order-taking' && <OrderTaking notify={addNotification} />}
            {activeTab === 'orders-list' && <OrdersList notify={addNotification} />}
            {activeTab === 'master-list' && <MasterList />}
            {activeTab === 'admin' && <AdminPanel notify={addNotification} />}
            {activeTab === 'reports' && <Reports />}
          </ErrorBoundary>
        </div>
      </main>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={cn(
              "flex items-center space-x-3 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-right-full",
              n.type === 'success' ? "bg-green-600 text-white" : "bg-red-600 text-white"
            )}
          >
            {n.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="text-sm font-medium">{n.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
