"use client";

import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import {
  ShieldCheck, ShieldAlert, Key, CheckCircle, XCircle, RefreshCw,
  Eye, Clock, AlertCircle, Ban, Search, Copy
} from "lucide-react";

const API = "http://localhost:8000/api";

interface UserKeyData {
  id: number;
  nama: string;
  username: string;
  role: string;
  wilayah_kph?: string;
  wilayah_phw?: string;
  key_status: "none" | "pending" | "approved" | "rejected";
  public_key: string | null;
  pending_public_key: string | null;
  key_requested_at: string | null;
  key_approved_at: string | null;
  approver_username?: string | null;
}

function AdminKeysContent() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<UserKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserKeyData | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/keys.php?token=${token}`);
      const data = await res.json();
      if (data.status === "success") {
        setUsers(data.data || []);
      } else {
        alert(data.message || "Gagal memuat data kunci");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchKeys();
  }, [token]);

  const handleAction = async (userId: number, action: "approve" | "reject" | "revoke") => {
    let confirmMsg = "";
    if (action === "approve") confirmMsg = "Setujui public key user ini? Kunci akan aktif dan dapat digunakan untuk enkripsi/tanda tangan dokumen.";
    if (action === "reject") confirmMsg = "Tolak pengajuan public key user ini?";
    if (action === "revoke") confirmMsg = "Cabut (Revoke) kunci aktif user ini? Dokumen baru tidak akan bisa dienkripsi sampai user mengajukan kunci baru.";

    if (!confirm(confirmMsg)) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`${API}/admin/keys.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, user_id: userId, action }),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("✅ " + data.message);
        setSelectedUser(null);
        fetchKeys();
      } else {
        alert("Gagal: " + data.message);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter(u =>
    u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = users.filter(u => u.key_status === "pending").length;
  const approvedCount = users.filter(u => u.key_status === "approved").length;

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.04]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={24} />
            Otoritas Kunci (Certificate Authority - CA)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-[13px] mt-1 font-medium">
            Verifikasi identitas dan persetujuan penerbitan Public Key kriptografi pengguna
          </p>
        </div>

        <button
          onClick={fetchKeys}
          disabled={loading}
          className="btn-secondary px-4 py-2.5 text-[12px] font-semibold flex items-center gap-2 self-start"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Menunggu Verifikasi</p>
            <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{pendingCount} Pengajuan</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 flex items-center justify-center">
            <Clock size={20} className="text-amber-700 dark:text-amber-400" />
          </div>
        </div>

        <div className="glass-card p-5 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kunci Aktif (Approved)</p>
            <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{approvedCount} Pengguna</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center">
            <CheckCircle size={20} className="text-emerald-700 dark:text-emerald-400" />
          </div>
        </div>

        <div className="glass-card p-5 border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Terdaftar</p>
            <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{users.length} Akun</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20 flex items-center justify-center">
            <Key size={20} className="text-blue-700 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, username, atau role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-9 pr-4 py-2.5 text-[12px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-slate-900/40">
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Pengguna</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Peran (Role)</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Status Kunci</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Waktu Pengajuan</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider text-right">Aksi Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.03] text-[12px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                    Memuat data otoritas kunci...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 font-medium">
                    Tidak ada data pengguna yang sesuai
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPending = u.key_status === "pending";
                  const isApproved = u.key_status === "approved";
                  const isRejected = u.key_status === "rejected";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{u.nama}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">@{u.username}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] uppercase font-bold text-slate-800 dark:text-slate-300">
                          {u.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Approval
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                            <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-400" />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 text-red-800 dark:text-red-300 font-bold text-[11px]">
                            <XCircle size={12} className="text-red-600 dark:text-red-400" />
                            Rejected
                          </span>
                        )}
                        {!isPending && !isApproved && !isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px]">
                            Belum Ada Kunci
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {u.key_requested_at || u.key_approved_at || "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(u.pending_public_key || u.public_key) && (
                            <button
                              onClick={() => setSelectedUser(u)}
                              title="Lihat Public Key"
                              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Eye size={14} />
                            </button>
                          )}

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleAction(u.id, "approve")}
                                disabled={actionLoading === u.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCircle size={12} /> Setujui
                              </button>
                              <button
                                onClick={() => handleAction(u.id, "reject")}
                                disabled={actionLoading === u.id}
                                className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-[11px] transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <XCircle size={12} /> Tolak
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleAction(u.id, "revoke")}
                              disabled={actionLoading === u.id}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-[11px] font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <Ban size={12} /> Cabut
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/[0.04] pb-4">
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-[15px]">Detail Public Key Pengguna</h3>
                <p className="text-slate-600 dark:text-slate-400 text-[12px]">{selectedUser.nama} (@{selectedUser.username}) • {selectedUser.role.toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">✕</button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                  {selectedUser.key_status === "pending" ? "Public Key yang Diajukan (Pending):" : "Public Key Aktif:"}
                </span>
                <button
                  onClick={() => handleCopy(selectedUser.pending_public_key || selectedUser.public_key || "")}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Copy size={12} /> {copied ? "Tersalin!" : "Salin Key"}
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-black/50 p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.05]">
                <pre className="font-mono text-[10px] text-emerald-800 dark:text-emerald-400/80 break-all whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                  {selectedUser.pending_public_key || selectedUser.public_key}
                </pre>
              </div>
            </div>

            {selectedUser.key_status === "pending" && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAction(selectedUser.id, "reject")}
                  disabled={actionLoading === selectedUser.id}
                  className="flex-1 py-2.5 rounded-xl border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-[12px]"
                >
                  Tolak Pengajuan
                </button>
                <button
                  onClick={() => handleAction(selectedUser.id, "approve")}
                  disabled={actionLoading === selectedUser.id}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[12px]"
                >
                  Setujui (Approve Key)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminKeysPage() {
  return (
    <DashboardLayout>
      <AdminKeysContent />
    </DashboardLayout>
  );
}
