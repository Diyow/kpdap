"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Phone, Mail, Contact } from "lucide-react";
import { logAdminActivity } from "../actions/logger";

import { Skeleton } from "@/app/components/ui/Skeleton";

export default function ContactInfoManager() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contact_info").select("*").eq("id", 1).single();
    if (!error && data) {
      setPhone(data.phone || "");
      setEmail(data.email || "");
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("contact_info")
      .upsert({ id: 1, phone, email });

    setSaving(false);
    
      if (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui info kontak. ' + error.message });
    } else {
      logAdminActivity("UPDATE_CONTACT", "Memperbarui info kontak").catch(console.error);
      setMessage({ type: 'success', text: 'Info kontak berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-6 max-w-xl">
          <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-6">
            <div>
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="pt-2">
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-lightbg rounded-xl flex items-center justify-center text-brand-green shrink-0 shadow-sm border border-brand-green/10">
            <Contact size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-text mb-1">Info Kontak</h2>
            <p className="text-gray-500 text-sm">
              Perbarui email dan nomor telepon yang ditampilkan di seluruh website
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-brand-text mb-2">
              <Phone size={16} className="text-brand-green" />
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+62..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-200 outline-none"
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-brand-text mb-2">
              <Mail size={16} className="text-brand-green" />
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-200 outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-green text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-darkgreen transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
