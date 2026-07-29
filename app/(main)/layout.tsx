import React from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { createClient } from "@supabase/supabase-js";
import { contactInfo as defaultContact } from "@/app/data";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  
  let contact = { phone: defaultContact.phone, email: defaultContact.email };
  try {
    const { data } = await supabase.from("contact_info").select("phone, email").eq("id", 1).single();
    if (data) {
      contact = { phone: data.phone, email: data.email };
    }
  } catch (error) {
    console.error("Failed to fetch contact info:", error);
  }

  return (
    <>
      <Header initialContact={contact} />
      {children}
      <Footer />
    </>
  );
}
