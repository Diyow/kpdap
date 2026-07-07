"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Icon as LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

type BusinessUnit = {
  id: number;
  icon: string;
  title: string;
  description: string;
};

export default function BusinessUnitsManager() {
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<BusinessUnit | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("business_units").select("*").order("id");
    if (!error && data) {
      setUnits(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus unit bisnis ini?")) return;
    await supabase.from("business_units").delete().eq("id", id);
    fetchUnits();
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const unitData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
    };

    if (isEditing) {
      await supabase.from("business_units").update(unitData).eq("id", isEditing.id);
    } else {
      await supabase.from("business_units").insert([unitData]);
    }
    
    setIsEditing(null);
    setIsCreating(false);
    fetchUnits();
  };

  const renderIcon = (iconName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={24} className="text-brand-green" />;
    }
    return <span className="text-xs text-gray-500">?</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-green" size={32} />
      </div>
    );
  }

  if (isEditing || isCreating) {
    const unit = isEditing || { title: "", description: "", icon: "Briefcase" };
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-brand-text mb-6">
          {isEditing ? "Edit Unit Bisnis" : "Tambah Unit Bisnis Baru"}
        </h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Judul</label>
            <input name="title" defaultValue={unit.title} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Deskripsi</label>
            <textarea name="description" defaultValue={unit.description} required rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Nama Ikon Lucide (Cth. Coffee, MapPin, Sprout)</label>
            <input name="icon" defaultValue={unit.icon} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
            <p className="text-xs text-gray-500 mt-1.5">Cek <a href="https://lucide.dev/icons" target="_blank" className="text-brand-green hover:underline font-medium">lucide.dev</a> untuk daftar nama ikon.</p>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" className="bg-brand-green text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-darkgreen transition-all shadow-sm hover:shadow-md">
              Simpan Unit Bisnis
            </button>
            <button type="button" onClick={() => { setIsEditing(null); setIsCreating(false); }} className="bg-gray-100 text-brand-text px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Batal
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-text mb-1">Unit Bisnis</h2>
          <p className="text-gray-500 text-sm">Kelola divisi KPDAP Anda</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-brand-green text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-darkgreen transition-all shadow-sm hover:shadow-md text-sm">
          <Plus size={18} />
          Tambah Unit
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-lightbg border-b border-gray-100">
              <th className="py-4 px-5 font-semibold text-brand-text text-sm w-16">Ikon</th>
              <th className="py-4 px-5 font-semibold text-brand-text text-sm">Judul</th>
              <th className="py-4 px-5 font-semibold text-brand-text text-sm">Deskripsi</th>
              <th className="py-4 px-5 font-semibold text-brand-text text-sm text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-5">
                  <div className="w-12 h-12 bg-white rounded-xl flex justify-center items-center shadow-sm border border-gray-100">
                    {renderIcon(unit.icon)}
                  </div>
                </td>
                <td className="py-4 px-5 font-bold text-brand-text">{unit.title}</td>
                <td className="py-4 px-5 text-gray-500 text-sm max-w-md leading-relaxed">{unit.description}</td>
                <td className="py-4 px-5">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditing(unit)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(unit.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-500">
                  Tidak ada unit bisnis yang ditemukan. Tambahkan unit bisnis untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
