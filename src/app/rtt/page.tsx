"use client";

import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import Link from "next/link";
import {
  FileText,
  Plus,
  ChevronRight,
  Activity,
  ShieldCheck,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";

const API = "http://localhost:8000/api";

const statusConfig: Record<
  string,
  { label: string; color: string; dotColor: string; bg: string }
> = {
  draft: {
    label: "Draft",
    color: "text-slate-400",
    dotColor: "bg-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
  menunggu_review_kph: {
    label: "Menunggu Review KPH",
    color: "text-amber-400",
    dotColor: "bg-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  revisi_kph: {
    label: "Revisi KPH",
    color: "text-rose-400",
    dotColor: "bg-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  menunggu_verifikasi_phw: {
    label: "Menunggu Verifikasi PHW",
    color: "text-indigo-400",
    dotColor: "bg-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  revisi_phw: {
    label: "Revisi PHW",
    color: "text-rose-400",
    dotColor: "bg-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  menunggu_pengesahan: {
    label: "Menunggu Pengesahan",
    color: "text-blue-400",
    dotColor: "bg-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  disahkan: {
    label: "SAH • SIGNED",
    color: "text-emerald-400",
    dotColor: "bg-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  ditolak: {
    label: "Ditolak",
    color: "text-red-400",
    dotColor: "bg-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
};

function RttListContent() {
  const { user } = useAuth();
  const [rttList, setRttList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRtt();
  }, []);

  const fetchRtt = async () => {
    try {
      const res = await fetch(`${API}/rtt/list.php?token=${user?.token || (typeof window !== "undefined" ? localStorage.getItem("token") : "")}`);
      const data = await res.json();
      if (data.status === "success") setRttList(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch(`${API}/rtt/delete.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rtt_id: confirmDelete.id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setRttList((prev) => prev.filter((r) => r.id !== confirmDelete.id));
        setConfirmDelete(null);
      } else {
        alert(data.message);
      }
    } catch {
      alert("Gagal terhubung ke server");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.04]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Daftar Dokumen RTT
          </h2>
          <p className="text-[13px] text-slate-500 mt-1 font-medium">
            Arsip Rencana Teknik Tahunan per Wilayah KPH
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400"
            />
            <input
              type="text"
              placeholder="Cari nomor berkas..."
              className="glass-input py-2.5 pl-10 pr-4 text-[12px] w-64"
            />
          </div>
          {user?.role === "ADMIN" && (
            <Link
              href="/rtt/create"
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[12px]"
            >
              <Plus size={16} /> Susun RTT
            </Link>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5 stagger-children">
          {rttList.map((rtt) => {
            const st = statusConfig[rtt.status] || statusConfig.draft;
            const isSigned = rtt.status === "disahkan";
            return (
              <div
                key={rtt.id}
                className="glass-card glass-card-hover p-6 flex flex-col justify-between min-h-[220px] group transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className={`status-badge border ${st.bg} ${st.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
                    {st.label}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Tombol hapus — hanya sysadmin */}
                    {user?.role === "sysadmin" && (
                      <button
                        onClick={() => setConfirmDelete(rtt)}
                        title={isSigned ? "Dokumen yang sudah disahkan tidak dapat dihapus" : "Hapus dokumen"}
                        className={`p-1.5 rounded-lg transition-all ${
                          isSigned
                            ? "text-slate-700 cursor-not-allowed"
                            : "text-slate-600 hover:text-rose-400 hover:bg-rose-500/10"
                        }`}
                        disabled={isSigned}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <div className="text-slate-600 group-hover:text-slate-400 transition-colors">
                      <FileText size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-[16px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {rtt.nomor_dokumen || "Dokumen Tanpa Nomor"}
                    </h3>
                    <p className="text-[12px] text-slate-400 font-medium">
                      {rtt.kph || "KPH Tidak Diketahui"} • Divisi Jawa Barat &
                      Banten
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} /> Area Konsesi Hutan
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Activity size={12} /> Tahun Rencana{" "}
                      {rtt.rpkh_tahun || "2026"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Diunggah:{" "}
                    <span className="text-slate-300">
                      Admin {rtt.kph || "KPH"}
                    </span>
                  </div>
                  <Link
                    href={`/rtt/${rtt.id}`}
                    className="bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                  >
                    Buka Berkas <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-7 w-full max-w-md shadow-2xl shadow-black/60 animate-fade-in">
            {/* Icon warning */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 mx-auto mb-5">
              <Trash2 size={24} className="text-rose-400" />
            </div>

            <h3 className="text-white font-bold text-center text-[16px] mb-2">
              Hapus Dokumen RTT?
            </h3>
            <p className="text-slate-400 text-[13px] text-center mb-1">
              Dokumen berikut akan dihapus permanen:
            </p>
            <p className="text-white font-semibold text-[13px] text-center mb-5">
              &quot;{confirmDelete.nomor_dokumen || "Dokumen Tanpa Nomor"}&quot;
            </p>

            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3 mb-6">
              <p className="text-rose-300 text-[12px] text-center">
                ⚠️ Tindakan ini tidak dapat dibatalkan. Semua data terkait RTT ini akan ikut terhapus.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-[13px] font-semibold transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[13px] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menghapus...</>
                ) : (
                  <><Trash2 size={14} /> Ya, Hapus</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RttPage() {
  return (
    <DashboardLayout>
      <RttListContent />
    </DashboardLayout>
  );
}
