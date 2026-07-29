"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { logAdminActivity } from "./logger";

// Create a Supabase client with the service role key for Admin API operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or Service Role Key");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to get the current authenticated user and check if they are a superadmin
async function requireSuperadmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: adminRole } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminRole || adminRole.role !== "superadmin") {
    throw new Error("Forbidden: Superadmin access required");
  }

  return user;
}

export async function createAdmin(formData: FormData) {
  try {
    await requireSuperadmin();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = "admin"; // Force new users to be regular admins

    if (!email || !password) {
      return { error: "Semua kolom harus diisi" };
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Create the user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) return { error: authError.message };

    const newUserId = authData.user.id;

    // 2. Insert into admin_roles
    const { error: roleError } = await supabaseAdmin
      .from("admin_roles")
      .insert({ id: newUserId, email, role });

    if (roleError) {
      // Rollback user creation if role insertion fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return { error: roleError.message };
    }

    await logAdminActivity("CREATE_ADMIN", `Menambahkan admin baru: ${email}`);

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteAdmin(userId: string, userEmail?: string) {
  try {
    const currentUser = await requireSuperadmin();
    
    if (currentUser.id === userId) {
      return { error: "Anda tidak dapat menghapus akun Anda sendiri" };
    }

    const supabaseAdmin = getSupabaseAdmin();

    // auth.admin.deleteUser will also trigger ON DELETE CASCADE for admin_roles
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) return { error: error.message };

    const identifier = userEmail || userId;
    await logAdminActivity("DELETE_ADMIN", `Menghapus admin: ${identifier}`);

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateMyPassword(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const newPassword = formData.get("newPassword") as string;

    if (!newPassword || newPassword.length < 8) {
      return { error: "Password minimal 8 karakter" };
    }

    // A user can update their own password using the normal client
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) return { error: error.message };

    await logAdminActivity("UPDATE_PASSWORD", `Memperbarui password akun sendiri`);

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
