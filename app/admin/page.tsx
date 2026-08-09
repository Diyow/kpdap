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

  // Navigation scroll state
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const savedTab = localStorage.getItem("kpdap_admin_tab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
    setIsMounted(true);
  }, []);

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }
  };

  useEffect(() => {
    if (isMounted) {
      checkScroll();
      window.addEventListener("resize", checkScroll);
      return () => window.removeEventListener("resize", checkScroll);
    }
  }, [isMounted]);

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
      <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24 h-max z-10 bg-brand-lightbg md:bg-transparent -mx-4 md:mx-0">
        <div className="flex items-center w-full">
          {/* Left Arrow Indicator */}
          <div className={`w-8 shrink-0 flex justify-center text-gray-400 transition-opacity duration-300 md:hidden ${showLeftArrow ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
            <ChevronLeft size={20} />
          </div>

          <nav
            ref={navRef}
            onScroll={checkScroll}
            className="flex-1 min-w-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide snap-x relative z-10"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left whitespace-nowrap snap-center shrink-0 md:shrink ${isActive
                      ? "bg-brand-green text-white shadow-md"
                      : "text-gray-600 hover:bg-white hover:text-brand-green"
                    }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Arrow Indicator */}
          <div className={`w-8 shrink-0 flex justify-center text-gray-400 transition-opacity duration-300 md:hidden ${showRightArrow ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
            <ChevronRight size={20} />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {!isMounted ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[400px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}
