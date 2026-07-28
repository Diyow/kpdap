import React from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import EmptyState from "@/app/components/EmptyState";
import { FileQuestion } from "lucide-react";

export default function GlobalNotFound() {
  return (
    <>
      <Header />
      <EmptyState
        icon={FileQuestion}
        title="Halaman Tidak Ditemukan"
        description="Maaf, halaman yang Anda cari mungkin telah dihapus, diubah namanya, atau memang tidak pernah ada."
        actionText="Kembali ke Beranda"
        actionHref="/"
      />
      <Footer />
    </>
  );
}
