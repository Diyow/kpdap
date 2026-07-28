"use client";

import { Share2, Link2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

export default function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const handleCopyLink = () => {
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => toast.success("Tautan berhasil disalin!"))
      .catch(() => toast.error("Gagal menyalin tautan"));
  };

  const handleNativeShare = async () => {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - KPDAP`,
          url: url
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback if Web Share API is not supported
      handleCopyLink();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-gray-700 mr-2">Bagikan:</span>
      <button 
        onClick={handleCopyLink}
        className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-brand-green hover:border-brand-green transition-colors" 
        title="Salin Tautan"
      >
        <Link2 size={18} />
      </button>
      <button 
        onClick={handleNativeShare}
        className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-brand-green hover:border-brand-green transition-colors" 
        title="Bagikan"
      >
        <Share2 size={18} />
      </button>
    </div>
  );
}
