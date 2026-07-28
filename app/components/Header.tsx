"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { contactInfo as defaultContact, navLinks } from "../data";
import { Phone, Mail, User, MessageCircle, Menu, X, ShoppingBag, CreditCard } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useCartStore } from "@/store/useCartStore";
import CartDrawer from "./CartDrawer";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);

  const [contact, setContact] = useState({ phone: defaultContact.phone, email: defaultContact.email });
  const [mounted, setMounted] = useState(false);
  
  const { items, setIsCartOpen, pendingOrderId } = useCartStore();

  useEffect(() => {
    setMounted(true);
    const fetchContact = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("contact_info").select("*").eq("id", 1).single();
      if (data) {
        setContact({ phone: data.phone, email: data.email });
      }
    };
    fetchContact();
  }, []);

  const toggleMobileSubmenu = (label: string) => {
    setExpandedMobileMenu(prev => prev === label ? null : label);
  };

  const whatsappUrl = `https://wa.me/${contact.phone.replace("+", "")}`;

  return (
    <header className="w-full relative z-50">
      {/* Top Bar */}
      <div className="bg-[#5a4634] text-white text-xs py-2 px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex flex-wrap justify-center gap-4">
          <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:underline">
            <Phone size={12} />
            <span>{contact.phone}</span>
          </a>
          <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:underline">
            <Mail size={12} />
            <span className="hidden sm:inline">{contact.email}</span>
            <span className="sm:hidden">Email Us</span>
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-1 hover:underline">
            <User size={12} />
            <span>Portal Anggota</span>
          </Link>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-sm py-4 px-4 md:px-8 sticky top-0">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 shrink-0 relative">
              <Image
                src="/logo.webp"
                alt="KPDAP Logo"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-sm text-brand-text leading-tight">KPDAP</h1>
              <p className="text-[10px] text-green-700 uppercase tracking-wider leading-tight hidden sm:block">Koperasi Produsen Dharma Asastha Partiwi</p>
            </div>
          </Link>

          <ul className="hidden lg:flex gap-6 text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <li key={link.label} className="relative group">
                <Link href={link.href} className="flex items-center gap-1 hover:text-brand-green transition-colors py-2">
                  {link.label}
                  {link.subLinks && (
                    <svg className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Link>
                {link.subLinks && (
                  <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-100 shadow-lg rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden transform origin-top group-hover:scale-100 scale-95">
                    <div className="py-2 flex flex-col">
                      {link.subLinks.map((subLink) => (
                        <Link
                          key={subLink.label}
                          href={subLink.href}
                          className="px-4 py-2.5 text-gray-600 hover:bg-brand-lightbg hover:text-brand-green transition-colors"
                        >
                          {subLink.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-4">
            {mounted && pendingOrderId && (
              <Link 
                href={`/checkout/success?order_id=${pendingOrderId}`}
                className="relative p-2 text-gray-600 hover:text-brand-green transition-colors"
                title="Pesanan Tertunda"
              >
                <CreditCard size={22} />
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1 -translate-y-1">
                  !
                </span>
              </Link>
            )}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-brand-green transition-colors"
            >
              <ShoppingBag size={22} />
              {mounted && items.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1 -translate-y-1">
                  {items.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2 rounded-md text-sm font-medium items-center gap-2 transition-colors"
            >
              <MessageCircle size={16} />
              Chat
            </a>
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-brand-green"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 py-4 px-4 flex flex-col gap-4">
            <ul className="flex flex-col gap-4 text-sm font-medium text-gray-700">
              {navLinks.map((link) => (
                <li key={link.label} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <Link
                      href={link.href}
                      className="block py-2 hover:text-brand-green transition-colors font-semibold flex-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                    {link.subLinks && (
                      <button
                        onClick={() => toggleMobileSubmenu(link.label)}
                        className="p-2 -mr-2 text-gray-500 hover:text-brand-green focus:outline-none"
                      >
                        <svg className={`w-4 h-4 transition-transform duration-200 ${expandedMobileMenu === link.label ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {link.subLinks && expandedMobileMenu === link.label && (
                    <ul className="pl-4 mt-1 mb-2 flex flex-col gap-2 border-l-2 border-brand-green/20">
                      {link.subLinks.map((subLink) => (
                        <li key={subLink.label}>
                          <Link
                            href={subLink.href}
                            className="block py-1.5 text-gray-500 hover:text-brand-green transition-colors text-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {subLink.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full"
            >
              <MessageCircle size={16} />
              Chat
            </a>
          </div>
        )}
      </nav>
      <CartDrawer />
    </header>
  );
}
