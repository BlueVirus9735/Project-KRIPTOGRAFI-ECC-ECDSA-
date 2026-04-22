"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Plus, Edit2, Trash2, UserCog, RefreshCw, 
  CheckCircle, XCircle, Search, Shield
} from "lucide-react";
import { getRoleDisplayName, getRoleDescription, type UserRole } from "@/lib/auth";

const API = "http://localhost:8000/api";

interface User {
  id: number;
  nama: string;
  username: string;
  email: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  last_login: string | null;
}

const ROLE_OPTIONS: UserRole[] = ['sysadmin', 'admin', 'kph', 'phw', 'divisi', 'gis', 'lapangan'];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    email: "",
    password: "",
    role: "lapangan" as UserRole,
    is_active: true,
  });

  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || "") : "";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Send token via query string for GET request
      const res = await fetch(`${API}/auth/users.php?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.status === "success") {
        setUsers(data.data);
      } else {
        setError(data.message || "Gagal memuat data user");
      }
    } catch (err) {
      setError("Kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/auth/users.php`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.status === "success") {
        setShowModal(false);
        resetForm();
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Gagal membuat user");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: any = { id: editingUser.id };
      if (formData.nama !== editingUser.nama) updateData.nama = formData.nama;
      if (formData.email !== editingUser.email) updateData.email = formData.email;
      if (formData.role !== editingUser.role) updateData.role = formData.role;
      if (formData.is_active !== !!editingUser.is_active) updateData.is_active = formData.is_active;
      if (formData.password) updateData.password = formData.password;

      const res = await fetch(`${API}/auth/users.php`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.status === "success") {
        setShowModal(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Gagal mengupdate user");
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Yakin ingin menghapus user ${user.nama}?`)) return;

    try {
      const res = await fetch(`${API}/auth/users.php`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Gagal menghapus user");
    }
  };

  const resetForm = () => {
    setFormData({
      nama: "",
      username: "",
      email: "",
      password: "",
      role: "lapangan",
      is_active: true,
    });
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      username: user.username,
      email: user.email || "",
      password: "",
      role: user.role,
      is_active: !!user.is_active,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const filteredUsers = users.filter(u => 
    u.nama?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      sysadmin: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      kph: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      phw: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      divisi: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      gis: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      lapangan: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };
    return colors[role] || colors.lapangan;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCog className="text-emerald-400" />
              Manajemen User
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola user dan hak akses sistem
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            Tambah User
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Cari user..."
              className="glass-input w-full pl-10 pr-4 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              Memuat data...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Tidak ada user ditemukan
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Terdaftar</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Login Terakhir</th>
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                          {user.nama?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.nama}</p>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                          {user.email && (
                            <p className="text-xs text-slate-600">{user.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        <Shield size={12} />
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                          <CheckCircle size={14} />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                          <XCircle size={14} />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleString('id-ID')
                        : "-"
                      }
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Role Legend */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Keterangan Role</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLE_OPTIONS.map((role) => (
              <div key={role} className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(role)}`}>
                  {getRoleDisplayName(role)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-xs text-slate-500">
            {ROLE_OPTIONS.map((role) => (
              <p key={role}>
                <span className="font-medium text-slate-400">{getRoleDisplayName(role)}:</span>{" "}
                {getRoleDescription(role)}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </h2>
              <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    className="glass-input w-full px-3 py-2 text-sm"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    className="glass-input w-full px-3 py-2 text-sm disabled:opacity-50"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                  {editingUser && (
                    <p className="text-xs text-slate-500 mt-1">Username tidak dapat diubah</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    className="glass-input w-full px-3 py-2 text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Role *
                  </label>
                  <select
                    required
                    className="glass-input w-full px-3 py-2 text-sm"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {getRoleDescription(formData.role)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Password {editingUser && "(kosongkan jika tidak ingin mengubah)"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    className="glass-input w-full px-3 py-2 text-sm"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "••••••••" : ""}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-300">
                    User Aktif
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary px-4 py-2 text-sm"
                  >
                    {editingUser ? "Simpan Perubahan" : "Buat User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
