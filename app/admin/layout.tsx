"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // If we are on the login page, don't show the admin topbar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-brand-lightbg flex flex-col font-sans">
      {/* Topbar matching main Header.tsx */}
      <header className="bg-white shadow-sm py-4 px-4 md:px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 shrink-0 relative">
              <Image
                src="/KPDAP Logo.webp"
                alt="KPDAP Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-sm text-brand-text leading-tight">KPDAP</h1>
              <p className="text-[10px] text-green-700 uppercase tracking-wider leading-tight hidden sm:block">Koperasi Produsen Dharma Asastha Partiwi</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-green hover:bg-brand-lightbg rounded-lg transition-colors"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Kembali ke Beranda</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-brand-text tracking-tight">
            Dasbor Admin
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
}
