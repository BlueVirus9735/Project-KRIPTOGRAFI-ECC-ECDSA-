"use client";

import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import Link from "next/link";
import { BookOpen, Plus, Hash, FileText, Trash2 } from "lucide-react";

const API = "http://localhost:8000/api";

function RpkhListContent() {
  const { user, token } = useAuth();
  const [rpkhList, setRpkhList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRpkh(); }, []);

  const fetchRpkh = async () => {
    try {
      const res = await fetch(`${API}/rpkh/list.php`);
      const data = await res.json();
      if (data.status === "success") setRpkhList(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus RPKH ini?")) return;
    const res = await fetch(`${API}/rpkh/delete.php`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, rpkh_id: id })
    });
    const data = await res.json();
    if (data.status === "success") fetchRpkh();
    else alert(data.message);
  };

  return (
    <div className="max-w-[1200px] space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.04]">
        <div>
          <h1 className="text-xl font-bold text-white">Data RPKH</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Rencana Pengaturan Kelestarian Hutan — Dokumen Induk</p>
        </div>
        <Link href="/rpkh/create" className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[12px]">
          <Plus size={16} /> Tambah RPKH
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center"><div className="w-8 h-8 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" /></div>
        ) : rpkhList.length === 0 ? (
          <div className="p-16 text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">Belum ada data RPKH</p>
            <p className="text-slate-500 text-sm mt-1">Tambahkan RPKH terlebih dahulu sebagai data master</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-900/40 border-b border-white/[0.04]">
              <tr>
                <th className="p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tahun</th>
                <th className="p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Wilayah</th>
                <th className="p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">KPH</th>
                <th className="p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">BKPH / RPH</th>
                <th className="p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Petak</th>
                <th className="p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">RTT</th>
                <th className="p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hash</th>
                <th className="p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {rpkhList.map((rpkh) => (
                <tr key={rpkh.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-[13px] text-emerald-400 font-mono font-medium">{rpkh.tahun_mulai}–{rpkh.tahun_selesai}</td>
                  <td className="p-4 text-[13px] text-slate-200 font-medium">{rpkh.wilayah}</td>
                  <td className="p-4 text-[13px] text-slate-300">{rpkh.kph}</td>
                  <td className="p-4 text-[13px] text-slate-400">{rpkh.bkph} / {rpkh.rph}</td>
                  <td className="p-4 text-[13px] text-slate-400 text-center">{rpkh.jumlah_petak}</td>
                  <td className="p-4 text-[13px] text-slate-400 text-center">{rpkh.jumlah_rtt}</td>
                  <td className="p-4">
                    {rpkh.hash && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                        <Hash size={10} />{rpkh.hash.substring(0, 12)}...
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/rpkh/${rpkh.id}`} className="btn-secondary text-[11px] px-3 py-1.5">Detail</Link>
                      <button onClick={() => handleDelete(rpkh.id)} className="text-slate-500 hover:text-red-400 p-1.5 transition-colors hover:bg-red-500/10 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function RpkhPage() {
  return <DashboardLayout><RpkhListContent /></DashboardLayout>;
}
