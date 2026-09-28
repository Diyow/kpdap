"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home, User, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import RealtimeOrderNotification from "./components/RealtimeOrderNotification";
import { logAdminActivity } from "./actions/logger";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
      }
      // Redirects are now handled securely by proxy.ts at the edge!
    };
    fetchUser();
  }, []);

  // If we are on the login page, don't show the admin topbar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logAdminActivity("LOGOUT", "Admin telah keluar (logout) dari sistem");
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-lightbg flex flex-col font-sans">
      <RealtimeOrderNotification />
      {/* Topbar matching main Header.tsx */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm py-4 px-4 md:px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 shrink-0 relative">
              <Image
                src="/logo.webp"
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
            {userEmail && (
              <span className="hidden md:inline text-sm font-medium text-gray-500 mr-2 border-r border-gray-200 pr-4">
                {userEmail}
              </span>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-green hover:bg-brand-lightbg rounded-lg transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Kembali ke Beranda</span>
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:opacity-50"
            >
              {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              <span className="hidden sm:inline">{isLoggingOut ? "Keluar..." : "Keluar"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 md:sticky md:top-[72px] z-40 md:-mt-6 lg:-mt-8 md:pt-6 lg:pt-8 pointer-events-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pointer-events-auto">
            <h1 className="text-3xl font-extrabold text-brand-text tracking-tight">
              Dasbor Admin
            </h1>
            {userEmail && (
              <div className="md:hidden inline-flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-100 rounded-lg py-2 px-3 shadow-sm w-fit">
                <User size={16} className="text-brand-green" />
                <span className="truncate max-w-[200px]">{userEmail}</span>
              </div>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
