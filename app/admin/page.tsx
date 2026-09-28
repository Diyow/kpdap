"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';

const DashboardSummary = dynamic(() => import("./components/DashboardSummary"), { ssr: false });
import ProductsManager from "./components/ProductsManager";
import ContactInfoManager from "./components/ContactInfoManager";
import AdminsManager from "./components/AdminsManager";
import CustomersManager from "./components/CustomersManager";
import OrdersManager from "./components/OrdersManager";
import AdminLogsManager from "./components/AdminLogsManager";
import ArticlesManager from "./components/ArticlesManager";
import { Package, Briefcase, Contact, LayoutDashboard, Users, ShoppingCart, ShieldAlert, History, ChevronLeft, ChevronRight, Shield, Newspaper } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedTab = localStorage.getItem("kpdap_admin_tab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
    setIsMounted(true);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem("kpdap_admin_tab", tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardSummary onNavigate={handleTabChange} />;
      case "products":
        return <ProductsManager />;
      case "orders":
        return <OrdersManager />;
      case "contact":
        return <ContactInfoManager />;
      case "customers":
        return <CustomersManager />;
      case "articles":
        return <ArticlesManager />;
      case "admins":
        return <AdminsManager />;
      case "logs":
        return <AdminLogsManager />;
      default:
        return null;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Ringkasan", icon: LayoutDashboard },
    { id: "orders", label: "Pesanan", icon: ShoppingCart },
    { id: "customers", label: "Pelanggan", icon: Users },
    { id: "products", label: "Produk", icon: Package },
    { id: "articles", label: "Artikel", icon: Newspaper },
    { id: "contact", label: "Info Kontak", icon: Contact },
    { id: "admins", label: "Manajemen Admin", icon: Shield },
    { id: "logs", label: "Log Aktivitas", icon: History },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-56 shrink-0 md:sticky md:top-[180px] lg:top-[188px] h-max z-10 -mx-4 md:mx-0 border-b border-gray-100 md:border-0 mb-4 md:mb-0">
        <div className="flex items-center w-full px-4 md:px-0 pt-2 pb-3 md:py-0">
          <nav
            className="flex-1 min-w-0 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-hide snap-x snap-mandatory relative z-10 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] md:[mask-image:none]"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-full md:rounded-lg text-sm transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] text-left whitespace-nowrap snap-center shrink-0 md:shrink ${isActive
                      ? "bg-brand-green/[0.08] text-brand-green font-semibold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
                    }`}
                >
                  <Icon size={18} className={`transition-colors duration-200 ${isActive ? "text-brand-green" : "text-gray-400 group-hover:text-gray-600"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 relative">
        <div className="hidden md:block absolute top-0 bottom-0 -left-4 w-px bg-gray-200/70"></div>
        {!isMounted ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[400px] flex items-center justify-center relative z-10">
            <div className="w-8 h-8 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}
