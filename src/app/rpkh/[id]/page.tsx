"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { ArrowLeft, Hash, FileText, BookOpen } from "lucide-react";

const API = "http://localhost:8000/api";

function RpkhDetailContent() {
  const params = useParams();
  const id = params.id;
  const [rpkh, setRpkh] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [rttList, setRttList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/rpkh/detail.php?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === "success") {
          setRpkh(data.data);
          setDetails(data.details || []);
          setRttList(data.rtt_list || []);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" /></div>;
  if (!rpkh) return <div className="text-center text-slate-500 py-20 font-medium">RPKH tidak ditemukan</div>;

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 pb-6 border-b border-white/[0.04]">
        <Link href="/rpkh" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-slate-500 hover:text-white transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Detail RPKH</h1>
          <p className="text-slate-500 text-[13px] font-medium">{rpkh.wilayah} ({rpkh.tahun_mulai}–{rpkh.tahun_selesai})</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <div className="glass-card p-5">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">KPH</p>
          <p className="text-white font-semibold text-[14px]">{rpkh.kph}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">BKPH / RPH</p>
          <p className="text-white font-semibold text-[14px]">{rpkh.bkph} / {rpkh.rph}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">SHA-256 Hash</p>
          <p className="text-emerald-400 font-mono text-[12px] break-all">{rpkh.hash || 'N/A'}</p>
        </div>
      </div>

      {/* Detail Petak Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.04]">
          <h3 className="text-white font-semibold flex items-center gap-2"><BookOpen size={16} className="text-blue-400" /> Data Petak ({details.length} records)</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-900/40">
            <tr>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">#</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Petak</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Anak Petak</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Luas (Ha)</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Jenis Tanaman</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {details.map((d, i) => (
              <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3.5 text-[12px] text-slate-500">{i + 1}</td>
                <td className="p-3.5 text-[13px] text-slate-200 font-medium">{d.petak}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{d.anak_petak}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{Number(d.luas).toFixed(2)}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{d.jenis_tanaman}</td>
                <td className="p-3.5 text-[13px] text-slate-500">{d.keterangan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Related RTT */}
      {rttList.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h3 className="text-white font-semibold flex items-center gap-2"><FileText size={16} className="text-emerald-400" /> RTT Terkait ({rttList.length})</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {rttList.map(rtt => (
              <Link key={rtt.id} href={`/rtt/${rtt.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors group">
                <div>
                  <span className="text-[13px] text-slate-200 font-medium group-hover:text-emerald-400 transition-colors">{rtt.nomor_dokumen}</span>
                  <span className="text-[12px] text-slate-500 ml-3">{rtt.tanggal}</span>
                </div>
                <span className="status-badge text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{rtt.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RpkhDetailPage() {
  return <DashboardLayout><RpkhDetailContent /></DashboardLayout>;
}
