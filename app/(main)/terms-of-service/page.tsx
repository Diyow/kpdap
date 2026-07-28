import React from "react";
import BackLink from "@/app/components/BackLink";

export const metadata = {
  title: "Syarat & Ketentuan | KPDAP",
  description: "Syarat dan Ketentuan Koperasi Produsen Dharma Asastha Partiwi",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <BackLink href="/" text="Kembali ke Beranda" className="mb-8" />
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-brand prose-lg max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">Syarat & Ketentuan</h1>
          <p className="text-gray-500 text-sm mb-8">Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>
            Syarat dan Ketentuan berikut mengatur penggunaan situs web dan layanan yang disediakan oleh <strong>Koperasi Produsen Dharma Asastha Partiwi (KPDAP)</strong>. 
            Dengan mengakses atau menggunakan situs ini, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan kami.
          </p>

          <h2>1. Layanan Kami</h2>
          <p>
            KPDAP menyediakan platform untuk menjual produk hasil bumi (terutama Kopi Robusta) dan layanan agrowisata secara online.
            Semua deskripsi produk, gambar, dan harga dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.
          </p>

          <h2>2. Proses Pemesanan & Pembayaran</h2>
          <ul>
            <li>Semua pesanan yang ditempatkan melalui situs web kami tunduk pada ketersediaan stok atau jadwal (untuk paket wisata).</li>
            <li>Harga yang tercantum adalah dalam Rupiah (IDR).</li>
            <li>Pembayaran dilakukan secara aman melalui pihak ketiga (Midtrans). Pesanan Anda hanya akan diproses setelah pembayaran berhasil dikonfirmasi.</li>
          </ul>

          <h2>3. Pengiriman Barang</h2>
          <ul>
            <li>Kami akan berusaha mengirimkan pesanan Anda secepat mungkin setelah pembayaran dikonfirmasi.</li>
            <li>Waktu pengiriman bergantung pada layanan kurir yang dipilih dan lokasi tujuan pengiriman.</li>
            <li>Risiko kerusakan atau kehilangan barang berpindah kepada Anda setelah barang diserahkan kepada pihak ekspedisi. Namun, kami akan membantu memfasilitasi komplain jika terjadi masalah pengiriman.</li>
          </ul>

          <h2>4. Kebijakan Pembatalan & Pengembalian</h2>
          <ul>
            <li><strong>Produk Fisik (Kopi, dll):</strong> Pengembalian dana atau penukaran barang hanya berlaku jika barang yang diterima rusak, cacat, atau tidak sesuai pesanan, yang harus dilaporkan maksimal 1x24 jam setelah barang diterima beserta bukti unboxing.</li>
            <li><strong>Paket Wisata:</strong> Pembatalan paket wisata harus dilakukan paling lambat 3 hari sebelum jadwal untuk mendapatkan pengembalian dana penuh.</li>
          </ul>

          <h2>5. Tanggung Jawab Pengguna</h2>
          <p>
            Anda setuju untuk memberikan informasi yang akurat dan lengkap saat melakukan pemesanan. Anda juga setuju untuk tidak menggunakan situs ini untuk tujuan ilegal atau melanggar hak kekayaan intelektual KPDAP.
          </p>

          <h2>6. Batasan Tanggung Jawab</h2>
          <p>
            KPDAP tidak bertanggung jawab atas kerugian langsung, tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan kami, di luar nilai transaksi yang Anda lakukan dengan kami.
          </p>

          <h2>7. Perubahan Syarat & Ketentuan</h2>
          <p>
            Kami berhak untuk mengubah, memodifikasi, atau memperbarui Syarat & Ketentuan ini kapan saja. Perubahan akan berlaku segera setelah dipublikasikan di halaman ini.
          </p>
        </div>
      </div>
    </div>
  );
}
