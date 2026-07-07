"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Phone, Mail } from "lucide-react";

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
      setMessage({ type: 'success', text: 'Info kontak berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-green" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-text mb-1">Info Kontak</h2>
        <p className="text-gray-500 text-sm">
          Perbarui email dan nomor telepon yang ditampilkan di seluruh website
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        <div className="bg-brand-lightbg p-6 rounded-xl border border-gray-100 space-y-6">
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
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none"
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
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-green text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-darkgreen transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
