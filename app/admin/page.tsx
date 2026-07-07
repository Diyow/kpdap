import ProductsManager from "./components/ProductsManager";
import BusinessUnitsManager from "./components/BusinessUnitsManager";
import ContactInfoManager from "./components/ContactInfoManager";

export default function AdminDashboard() {
  return (
    <div className="space-y-12 pb-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-brand-text mb-2 tracking-tight">Ringkasan Dasbor</h2>
        <p className="text-gray-500">
          Selamat datang di Panel Admin KPDAP. Di sini Anda dapat mengelola semua konten website Anda di satu tempat.
        </p>
      </div>

      <section id="products-manager">
        <ProductsManager />
      </section>
      
      <section id="business-units-manager">
        <BusinessUnitsManager />
      </section>
      
      <section id="contact-info-manager">
        <ContactInfoManager />
      </section>
    </div>
  );
}
