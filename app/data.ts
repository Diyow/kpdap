export const contactInfo = {
  phone: "+6281246533592",
  email: "koperasidharmaasastapertiwi@gmail.com",
};

export const navLinks = [
  { label: "Halaman Utama", href: "/" },
  { 
    label: "Tentang Kami", 
    href: "/#about",
    subLinks: [
      { label: "Halaman Tentang Kami", href: "/about" }
    ]
  },
  { 
    label: "Produk Kami", 
    href: "/#products",
    subLinks: [
      { label: "Semua Produk", href: "/products" }
    ]
  },
  { label: "Berita", href: "/#news" },
  { label: "Member Portal", href: "/#portal" },
  { label: "Kontak", href: "/#contact" },
];

export const businessUnits = [
  {
    icon: "Coffee",
    title: "Kopi Sobean",
    description: "Keahlian Honey Process dalam setiap seduhan dari biji kopi robusta pilihan.",
  },
  {
    icon: "MapPin",
    title: "Ekowisata",
    description: "Jelajahi tradisi dan rasakan keaslian pengalaman agrowisata berbasis komunitas.",
  },
  {
    icon: "Sprout",
    title: "Pupuk Organik",
    description: "Mengolah limbah menjadi pupuk berkualitas untuk pertanian berkelanjutan.",
  },
  {
    icon: "Tractor",
    title: "Pembibitan",
    description: "Menanam harapan dengan bibit unggul stek Robusta yang teruji.",
  },
];

export const advantages = [
  {
    number: "01",
    title: "Petik Merah",
    description: "Hanya ceri kopi yang matang sempurna yang kami panen untuk menjamin rasa manis alami.",
  },
  {
    number: "02",
    title: "Honey Process",
    description: "Metode pengolahan khusus yang mempertahankan lapisan mucilage manis.",
  },
  {
    number: "03",
    title: "Tanah Vulkanik",
    description: "Tumbuh di tanah vulkanik Tabanan yang subur, memberikan karakter rasa unik.",
  },
];

export const products = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=800",
    title: "Bali Honey Robusta",
    price: "Rp 75.000",
    badge: "Best Seller",
  },
  {
    id: 2,
    image: "/products/wisata_kebun.webp",
    title: "Paket Wisata Kebun",
    price: "Rp 150.000",
    badge: "Populer",
  },
  {
    id: 3,
    image: "/products/aa.jpg",
    title: "Pupuk Organik Padat",
    price: "Rp 25.000",
    badge: "Pertanian",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?auto=format&fit=crop&q=80&w=800",
    title: "Kopi Bubuk Premium",
    price: "Rp 65.000",
    badge: "Praktis",
  },
];

export const footerLinks = {
  quickLinks: [
    { label: "Tentang Kami", href: "/#about" },
    { label: "Produk Kami", href: "/products" },
    { label: "Transparansi", href: "/#transparency" },
    { label: "Penjelasan Website", href: "/#website" },
    { label: "Kontak", href: "/#contact" },
  ],
};
