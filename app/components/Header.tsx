"use client";
import React, { useState } from "react";
import { contactInfo, navLinks } from "../data";
import { Phone, Mail, User, MessageCircle, Menu, X } from "lucide-react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full relative z-50">
      {/* Top Bar */}
      <div className="bg-[#5a4634] text-white text-xs py-2 px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-1">
            <Phone size={12} />
            <span>{contactInfo.phone}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail size={12} />
            <span className="hidden sm:inline">{contactInfo.email}</span>
            <span className="sm:hidden">Email Us</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="#portal" className="flex items-center gap-1 hover:underline">
            <User size={12} />
            <span>Portal Anggota</span>
          </a>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-sm py-4 px-4 md:px-8 sticky top-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Logo Placeholder */}
            <div className="w-10 h-10 bg-green-100 rounded-full flex shrink-0 items-center justify-center text-brand-green font-bold text-xl">
              K
            </div>
            <div>
              <h1 className="font-bold text-sm text-brand-text leading-tight">KPDAP</h1>
              <p className="text-[10px] text-green-700 uppercase tracking-wider leading-tight hidden sm:block">Koperasi Produsen Dharma Asastha Partiwi</p>
            </div>
          </div>

          <ul className="hidden lg:flex gap-6 text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-brand-green transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button className="hidden sm:flex bg-brand-green hover:bg-brand-darkgreen text-white px-4 py-2 rounded-md text-sm font-medium items-center gap-2 transition-colors">
              <MessageCircle size={16} />
              Chat
            </button>
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-brand-green"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 py-4 px-4 flex flex-col gap-4">
            <ul className="flex flex-col gap-4 text-sm font-medium text-gray-700">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="block py-2 hover:text-brand-green transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <button className="bg-brand-green hover:bg-brand-darkgreen text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full">
              <MessageCircle size={16} />
              Chat
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
