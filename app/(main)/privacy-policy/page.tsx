import React from "react";
import BackLink from "@/app/components/BackLink";

export const metadata = {
  title: "Kebijakan Privasi | KPDAP",
  description: "Kebijakan Privasi Koperasi Produsen Dharma Asastha Partiwi",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <BackLink href="/" text="Kembali ke Beranda" className="mb-8" />
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-brand prose-lg max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">Kebijakan Privasi</h1>
          <p className="text-gray-500 text-sm mb-8">Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>
            Selamat datang di situs web <strong>Koperasi Produsen Dharma Asastha Partiwi (KPDAP)</strong>. 
            Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi yang Anda berikan kepada kami. 
            Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda saat Anda menggunakan layanan kami.
          </p>

          <h2>1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami dapat mengumpulkan informasi berikut saat Anda berinteraksi dengan situs web kami (misalnya, saat melakukan pemesanan):</p>
          <ul>
            <li><strong>Informasi Identifikasi Pribadi:</strong> Nama lengkap, alamat email, dan nomor telepon (WhatsApp).</li>
            <li><strong>Informasi Pengiriman:</strong> Alamat lengkap untuk keperluan pengiriman produk (jika berlaku).</li>
            <li><strong>Informasi Transaksi:</strong> Rincian pesanan dan status pembayaran (namun, kami <strong>tidak</strong> menyimpan informasi kartu kredit/debit atau kredensial perbankan Anda di server kami, semua diproses secara aman melalui gerbang pembayaran Midtrans).</li>
          </ul>

          <h2>2. Penggunaan Informasi</h2>
          <p>Informasi yang kami kumpulkan digunakan untuk tujuan berikut:</p>
          <ul>
            <li>Memproses dan mengelola pesanan Anda.</li>
            <li>Menghubungi Anda terkait status pesanan, konfirmasi, atau pertanyaan dukungan pelanggan.</li>
            <li>Meningkatkan layanan, produk, dan pengalaman pengguna di situs web kami.</li>
          </ul>

          <h2>3. Berbagi Informasi dengan Pihak Ketiga</h2>
          <p>
            Kami tidak akan menjual, menyewakan, atau menukar informasi pribadi Anda kepada pihak ketiga untuk tujuan pemasaran. 
            Informasi Anda hanya akan dibagikan kepada pihak ketiga yang terpercaya dalam situasi berikut:
          </p>
          <ul>
            <li><strong>Layanan Pembayaran:</strong> Informasi transaksi dibagikan dengan <em>payment gateway</em> (seperti Midtrans) untuk memproses pembayaran dengan aman.</li>
            <li><strong>Jasa Ekspedisi:</strong> Nama, nomor telepon, dan alamat Anda dibagikan kepada penyedia layanan logistik untuk keperluan pengiriman barang.</li>
            <li><strong>Kepatuhan Hukum:</strong> Jika diwajibkan oleh hukum atau permintaan resmi dari otoritas pemerintah.</li>
          </ul>

          <h2>4. Keamanan Data</h2>
          <p>
            Kami mengambil langkah-langika keamanan fisik, elektronik, dan manajerial yang wajar untuk melindungi informasi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran.
          </p>

          <h2>5. Perubahan pada Kebijakan Privasi</h2>
          <p>
            KPDAP berhak untuk memperbarui atau mengubah Kebijakan Privasi ini kapan saja. 
            Setiap perubahan akan dipublikasikan di halaman ini dengan memperbarui tanggal "Terakhir Diperbarui" di bagian atas.
          </p>

          <h2>6. Hubungi Kami</h2>
          <p>
            Jika Anda memiliki pertanyaan atau kekhawatiran tentang Kebijakan Privasi ini atau pengelolaan data Anda, silakan hubungi kami melalui informasi kontak yang tertera di situs web kami.
          </p>
        </div>
      </div>
    </div>
  );
}
