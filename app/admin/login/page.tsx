"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BackLink from "@/app/components/BackLink";
import { logAdminActivity } from "../actions/logger";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      await logAdminActivity("LOGIN", "Admin telah masuk (login) ke sistem");
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-lightbg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Back Button Just Above The Card */}
        <BackLink href="/" text="Kembali ke Beranda" className="mb-4" />

        <div className="space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 shrink-0 relative mb-4">
            <Image
              src="/logo.webp"
              alt="KPDAP Logo"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-brand-text">
            Portal Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Koperasi Produsen Dharma Asastha Partiwi
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-brand-text mb-1">
                Alamat Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors sm:text-sm"
                placeholder="anda@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-text mb-1">
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center border border-red-100">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-brand-green hover:bg-brand-darkgreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Dasbor"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
