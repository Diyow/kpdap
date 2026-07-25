# KPDAP Design System & UI Guidelines

Dokumen ini berisi panduan desain antarmuka (UI) dan pengalaman pengguna (UX) untuk proyek KPDAP. Tujuannya adalah untuk menjaga konsistensi visual di seluruh aplikasi, terutama pada bagian Dashboard Admin.

## 1. Aturan Warna (Color Semantics)

Sistem KPDAP menggunakan palet warna yang simpel, profesional, dan fokus pada aksi. Hindari penggunaan warna "pelangi" (seperti biru terang, nila, atau kuning mencolok) kecuali mutlak diperlukan.

| Warna Kategori | Tailwind Classes | Penggunaan (Use Case) |
| :--- | :--- | :--- |
| **Brand Green** (Utama) | `bg-brand-green`, `text-brand-green`, `hover:bg-brand-darkgreen`, `bg-brand-green/10` | Tindakan utama (Tombol *Edit*, *Proses Pesanan*). Status tertinggi (*Superadmin*, *Shipped*). |
| **Emerald Green** (Sukses) | `bg-emerald-50 text-emerald-700 border-emerald-200` | Menandakan status keberhasilan atau aktif (Produk *Aktif*, Pesanan *Selesai*). |
| **Orange / Amber** (Perhatian) | `bg-orange-50 text-orange-700 border-orange-200` | Sinyal peringatan atau butuh tindakan pengguna (Pesanan *Pending*, Log Aktivitas *UPDATE*). Lebih elegan dari warna kuning. |
| **Gray** (Netral) | `bg-gray-100 text-gray-700 border-gray-200` | Elemen pasif atau informasi tambahan (Produk *Draft*, *Admin* biasa). |
| **Red** (Destruktif) | `bg-red-50 text-red-700 border-red-200` | Tindakan berbahaya atau kegagalan (Hapus data, Pesanan *Batal/Gagal*, Log *DELETE*). |

## 2. Praktik Terbaik UI/UX (Best Practices)

- **Notifikasi**: Jangan gunakan `alert()` bawaan browser. Selalu gunakan `react-hot-toast` untuk feedback pengguna (misal: sukses simpan data, gagal, dsb).
- **Loading State**: Sebisa mungkin gunakan **Skeleton Loading** (kerangka abu-abu berdenyut) daripada *spinner* kosong saat memuat data di halaman (*dashboard*, tabel produk, pesanan) untuk memberikan impresi aplikasi yang lebih premium.
- **Micro-interactions**: Berikan efek *hover* yang lembut pada tombol dan baris tabel tabel (`hover:bg-gray-50`, `transition-colors`, dsb) agar aplikasi terasa responsif dan "hidup".
- **Ikon**: Gunakan pustaka ikon `lucide-react` secara konsisten untuk aksi, navigasi, dan indikator status.

## 3. Komponen Inti

- **Font Utama**: Inter (atau sans-serif bawaan browser)
- **Visualisasi Data**: Gunakan pustaka `recharts` untuk membuat grafik yang interaktif dan modern.
- **Layout Admin**: Sidebar disarankan *sticky* di desktop dan *horizontal scroll* (tanpa scrollbar) di mobile untuk pengalaman menyerupai aplikasi *mobile native*.

---
*Catatan: Dokumen ini diperbarui terakhir kali saat standarisasi UI Admin untuk membuat tampilan lebih simpel, kohesif, dan fokus pada brand.*
