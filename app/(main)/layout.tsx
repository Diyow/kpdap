import React from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { contactInfo as defaultContact } from "@/app/data";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
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
