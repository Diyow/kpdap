"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

export default function RealtimeOrderNotification() {
  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to INSERT events on the 'orders' table
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new;
          toast.success(`Pesanan Baru Masuk!\nDari: ${newOrder.customer_name}`, {
            duration: 6000,
            icon: '🛍️',
            style: {
              background: '#E8F5E9',
              color: '#2E7D32',
              fontWeight: 'bold',
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This component doesn't render anything visible
}
