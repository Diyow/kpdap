"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { createAdmin, deleteAdmin, updateMyPassword } from "../actions/adminManagement";
import toast from "react-hot-toast";
import { User, Shield, Key, Plus, Trash2, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { Tooltip } from "@/app/components/ui/Tooltip";

type AdminUser = {
  id: string;
  email: string;
  role: string;
};

type MessageState = { type: "success" | "error"; text: string } | null;

export default function AdminsManager() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 6;

  // Modal States
  const [updatePasswordModalOpen, setUpdatePasswordModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states - Profile
  const [myNewPassword, setMyNewPassword] = useState("");
  const [myNewPasswordConfirm, setMyNewPasswordConfirm] = useState("");
  const [showMyPassword, setShowMyPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<MessageState>(null);

  // Form states - Create Admin
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState<MessageState>(null);

  // Delete Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdmins = async () => {
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);

      // Get current user's role
      const { data: roleData } = await supabase
        .from("admin_roles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (roleData) setCurrentUserRole(roleData.role);
    }

    // Get all admins with pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: allAdmins, count } = await supabase
      .from("admin_roles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: true })
      .range(from, to);

    if (allAdmins) {
      setAdmins(allAdmins);
      if (count !== null) setTotalCount(count);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, [currentPage]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (myNewPassword !== myNewPasswordConfirm) {
      setProfileMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }

    setIsUpdatingPassword(true);

    const formData = new FormData();
    formData.append("newPassword", myNewPassword);

    const result = await updateMyPassword(formData);

    if (result.error) {
      setProfileMessage({ type: "error", text: result.error });
    } else {
      setProfileMessage({ type: "success", text: "Password berhasil diubah!" });
      setMyNewPassword("");
      setMyNewPasswordConfirm("");
      setTimeout(() => {
        setUpdatePasswordModalOpen(false);
        setProfileMessage(null);
      }, 1500);
    }
    setIsUpdatingPassword(false);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMessage(null);

    if (newPassword !== newPasswordConfirm) {
      setAdminMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }

    setIsCreatingAdmin(true);

    const formData = new FormData();
    formData.append("email", newEmail);
    formData.append("password", newPassword);

    const result = await createAdmin(formData);

    if (result.error) {
      setAdminMessage({ type: "error", text: result.error });
    } else {
      setAdminMessage({ type: "success", text: "Admin berhasil ditambahkan!" });
      setNewEmail("");
      setNewPassword("");
      setNewPasswordConfirm("");
      fetchAdmins();
      setTimeout(() => {
        setCreateModalOpen(false);
        setAdminMessage(null);
      }, 1500);
    }
    setIsCreatingAdmin(false);
  };

  const confirmDelete = (admin: AdminUser) => {
    setAdminToDelete(admin);
    setDeleteModalOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    setIsDeleting(true);
    setAdminMessage(null);

    const result = await deleteAdmin(adminToDelete.id, adminToDelete.email);

    // Using adminMessage inside delete modal is okay if we use it, 
    // but the delete modal has no message display. 
    // Usually it just closes on success and fetches again.
    if (!result.error) {
      toast.success("Admin berhasil dihapus");
      fetchAdmins();
    } else {
      toast.error(result.error);
    }

    setIsDeleting(false);
    setDeleteModalOpen(false);
    setAdminToDelete(null);
  };

  if (isLoading && admins.length === 0) {
    return (
      <div className="space-y-8 relative">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div>
                <Skeleton className="h-6 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-36 rounded-lg shrink-0" />
          </div>
          <div className="p-6">
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4"><Skeleton className="h-4 w-32" /></th>
                    <th className="px-5 py-4"><Skeleton className="h-4 w-20" /></th>
                    <th className="px-5 py-4"><Skeleton className="h-4 w-16 ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {[1, 2, 3].map(i => (
                    <tr key={i} className="h-[72px]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </td>
                      <td className="px-5 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-5 py-4 flex justify-end">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">

      {/* Superadmin Only: Manajemen Admin (MOVED TO TOP) */}
      {currentUserRole === "superadmin" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative flex flex-col min-h-[700px] pb-24">
          <div className="border-b border-gray-100 bg-gray-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-lightbg rounded-lg flex items-center justify-center text-brand-green shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-text">Manajemen Admin</h2>
                <p className="text-sm text-gray-500">Kelola akses admin website (Khusus Superadmin)</p>
              </div>
            </div>
            <button
              onClick={() => {
                setAdminMessage(null);
                setCreateModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-green hover:bg-brand-darkgreen text-white font-medium rounded-lg transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] shadow-sm shrink-0"
            >
              <Plus size={18} />
              Tambah Admin
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <div className={`border border-gray-200 rounded-xl overflow-x-auto shadow-sm ${isLoading ? 'opacity-50 pointer-events-none' : 'transition-opacity duration-200'}`}>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Pengguna</th>
                    <th className="px-5 py-3.5 font-medium">Peran</th>
                    <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="h-[72px] hover:bg-gray-50 transition-colors duration-200 group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-lightbg flex items-center justify-center text-brand-green shrink-0">
                            <User size={14} />
                          </div>
                          <span className="font-medium text-gray-900">{admin.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ring-1 ring-inset
                          ${admin.role === 'superadmin'
                            ? 'bg-brand-green/5 text-brand-green ring-brand-green/20'
                            : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                          }`}>
                          {admin.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {admin.id !== currentUserId && (
                          <Tooltip content="Hapus Admin">
                            <button
                              onClick={() => confirmDelete(admin)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 active:scale-[0.95] ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            >
                              <Trash2 size={18} />
                            </button>
                          </Tooltip>
                        )}
                        {admin.id === currentUserId && (
                          <span className="text-xs text-gray-400 italic px-2">Anda</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Users size={32} className="text-gray-300" />
                          <p>Tidak ada admin ditemukan.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {Math.ceil(totalCount / ITEMS_PER_PAGE) > 1 && (
            <div className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
              <span className="text-sm text-gray-500">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} dari {totalCount} admin
              </span>
              <div className="flex gap-2">
                <Tooltip content="Halaman Sebelumnya">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </Tooltip>
                <div className="flex items-center px-4 font-medium text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                  {currentPage} / {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                </div>
                <Tooltip content="Halaman Selanjutnya">
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))}
                    disabled={currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE) || isLoading}
                    className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <ChevronRight size={20} />
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profil Saya - Edit Password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-lightbg rounded-lg flex items-center justify-center text-brand-green shrink-0">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-text">Profil Saya</h2>
              <p className="text-sm text-gray-500">Kelola keamanan akun Anda</p>
            </div>
          </div>
          <button
            onClick={() => {
              setProfileMessage(null);
              setUpdatePasswordModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-green hover:bg-brand-darkgreen text-white font-medium rounded-lg transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] shadow-sm shrink-0"
          >
            Ubah Password
          </button>
        </div>
      </div>

      {/* Create Admin Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Tambah Admin Baru</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {adminMessage && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${adminMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                  {adminMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {adminMessage.text}
                </div>
              )}

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                    placeholder="admin@email.com"
                    required
                    disabled={isCreatingAdmin || adminMessage?.type === 'success'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                      disabled={isCreatingAdmin || adminMessage?.type === 'success'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                    placeholder="Ulangi password"
                    required
                    minLength={6}
                    disabled={isCreatingAdmin || adminMessage?.type === 'success'}
                  />
                </div>
                <div className="flex gap-3 mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingAdmin || adminMessage?.type === 'success'}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-green hover:bg-brand-darkgreen text-white font-medium rounded-lg transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCreatingAdmin ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Tambah Admin"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {updatePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Ubah Password</h3>
              <button
                onClick={() => setUpdatePasswordModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {profileMessage && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${profileMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                  {profileMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showMyPassword ? "text" : "password"}
                      value={myNewPassword}
                      onChange={(e) => setMyNewPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                      disabled={isUpdatingPassword || profileMessage?.type === 'success'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowMyPassword(!showMyPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showMyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                  <input
                    type={showMyPassword ? "text" : "password"}
                    value={myNewPasswordConfirm}
                    onChange={(e) => setMyNewPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                    placeholder="Ulangi password baru"
                    required
                    minLength={6}
                    disabled={isUpdatingPassword || profileMessage?.type === 'success'}
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setUpdatePasswordModalOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || profileMessage?.type === 'success'}
                    className="flex-1 py-2.5 px-4 bg-brand-green hover:bg-brand-darkgreen text-white font-medium rounded-lg transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle size={24} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Hapus Akses Admin</h3>
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus admin <span className="font-semibold text-gray-700">{adminToDelete?.email}</span>?
                  Tindakan ini tidak dapat dibatalkan dan mereka akan kehilangan akses ke dashboard.
                </p>
              </div>

              <div className="flex w-full gap-3 mt-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
