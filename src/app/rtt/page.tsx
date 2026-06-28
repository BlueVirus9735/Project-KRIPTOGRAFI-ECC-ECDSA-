"use client";

import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import Link from "next/link";
import { FileText, Plus, ChevronRight, Activity, ShieldCheck, MapPin, Search, Filter } from "lucide-react";

const API = "http://localhost:8000/api";

const statusConfig: Record<string, { label: string; color: string; dotColor: string; bg: string }> = {
  draft: { label: "Draft", color: "text-slate-400", dotColor: "bg-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
  menunggu_review_kph: { label: "Menunggu Review KPH", color: "text-amber-400", dotColor: "bg-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  revisi_kph: { label: "Revisi KPH", color: "text-rose-400", dotColor: "bg-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  menunggu_verifikasi_phw: { label: "Menunggu Verifikasi PHW", color: "text-indigo-400", dotColor: "bg-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  revisi_phw: { label: "Revisi PHW", color: "text-rose-400", dotColor: "bg-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  menunggu_pengesahan: { label: "Menunggu Pengesahan", color: "text-blue-400", dotColor: "bg-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  disahkan: { label: "SAH • SIGNED", color: "text-emerald-400", dotColor: "bg-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  ditolak: { label: "Ditolak", color: "text-red-400", dotColor: "bg-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

function RttListContent() {
  const { user } = useAuth();
  const [rttList, setRttList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRtt(); }, []);

  const fetchRtt = async () => {
    try {
      const res = await fetch(`${API}/rtt/list.php`);
      const data = await res.json();
      if (data.status === "success") setRttList(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.04]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Daftar Dokumen RTT</h2>
          <p className="text-[13px] text-slate-500 mt-1 font-medium">Arsip Rencana Teknik Tahunan per Wilayah KPH</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
            <input type="text" placeholder="Cari nomor berkas..." className="glass-input py-2.5 pl-10 pr-4 text-[12px] w-64" />
          </div>
          {user?.role === 'ADMIN' && (
            <Link href="/rtt/create" className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[12px]">
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
          {rttList.map(rtt => {
            const st = statusConfig[rtt.status] || statusConfig.draft;
            return (
              <div key={rtt.id} className="glass-card glass-card-hover p-6 flex flex-col justify-between min-h-[220px] group transition-all duration-300">
                
                <div className="flex justify-between items-start mb-5">
                  <div className={`status-badge border ${st.bg} ${st.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
                    {st.label}
                  </div>
                  <div className="text-slate-600 group-hover:text-slate-400 transition-colors">
                    <FileText size={20} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-[16px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {rtt.nomor_dokumen || "Dokumen Tanpa Nomor"}
                    </h3>
                    <p className="text-[12px] text-slate-400 font-medium">{rtt.kph || 'KPH Tidak Diketahui'} • Divre Jabar & Banten</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                     <span className="flex items-center gap-1.5"><MapPin size={12} /> Area Konsesi Hutan</span>
                     <span className="flex items-center gap-1.5"><Activity size={12} /> Tahun Rencana {rtt.rpkh_tahun || '2026'}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Diunggah: <span className="text-slate-300">Admin {rtt.kph || 'KPH'}</span>
                  </div>
                  <Link href={`/rtt/${rtt.id}`} className="bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all">
                    Buka Berkas <ChevronRight size={14} />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RttPage() { return <DashboardLayout><RttListContent /></DashboardLayout>; }
