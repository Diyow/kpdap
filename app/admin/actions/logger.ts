"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function logAdminActivity(actionType: string, description: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn("Attempted to log admin activity without an authenticated user.");
      return;
    }

    const { error } = await supabase.from("admin_logs").insert({
      admin_id: user.id,
      admin_email: user.email,
      action_type: actionType,
      description: description
    });

    if (error) {
      console.error("Failed to insert admin log:", error);
    }
  } catch (error) {
    console.error("Error logging admin activity:", error);
  }
}
