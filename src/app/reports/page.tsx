"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FileText,
  TrendingUp,
  Trees,
  Map,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Activity,
  Layers,
} from "lucide-react";

const API = "http://localhost:8000/api";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/rtt/reports.php`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") setData(d.data);
        setLoading(false);
      });
  }, []);

  const handleExportCSV = () => {
    if (!data?.documents) return;
    const headers = [
      "ID",
      "Nomor RTT",
      "Tanggal",
      "KPH",
      "Status",
      "Luas (Ha)",
      "Jumlah Pohon",
    ];
    const rows = data.documents.map((r: any) => [
      r.id,
      r.nomor_dokumen,
      r.tanggal,
      r.kph,
      r.status,
      r.luas || 0,
      r.jumlah_pohon || 0,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_RTT_Perhutani_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-center p-10 text-white animate-pulse">
          Memuat Data Laporan...
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end pb-6 border-b border-white/[0.04]">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-emerald-400" /> Dashboard Laporan
            </h1>
            <p className="text-slate-500 text-[13px] mt-1 font-medium">
              Rekapitulasi performa Rencana Teknik Tahunan (RTT) Perum Perhutani
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="btn-primary px-5 py-2.5 text-[12px] font-bold flex items-center gap-2"
          >
            <FileSpreadsheet size={16} /> Export ke Excel
          </button>
        </div>

        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
          <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <ShieldCheck size={120} />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" /> Total RTT
              Disahkan
            </p>
            <h2 className="text-4xl font-black text-white">
              {data?.overview?.total_disahkan || 0}{" "}
              <span className="text-sm text-slate-500 font-medium">
                dokumen
              </span>
            </h2>
            <p className="text-[11px] text-emerald-400 font-medium mt-2">
              100% Terverifikasi Kriptografi (ECC)
            </p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <Map size={120} />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Map size={14} className="text-blue-400" /> Total Luas Tebangan
              Sah
            </p>
            <h2 className="text-4xl font-black text-white">
              {data?.production?.total_luas || 0}{" "}
              <span className="text-sm text-slate-500 font-medium">
                Hektar (Ha)
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-2">
              Dari {data?.production?.total_pohon || 0} estimasi pohon
            </p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <TrendingUp size={120} />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers size={14} className="text-amber-400" /> Dokumen Dalam
              Proses
            </p>
            <h2 className="text-4xl font-black text-white">
              {data?.overview?.total_pending || 0}{" "}
              <span className="text-sm text-slate-500 font-medium">
                dokumen
              </span>
            </h2>
            <p className="text-[11px] text-amber-400 font-medium mt-2">
              Menunggu Validasi PHW / Divisi
            </p>
          </div>
        </div>

        {/* Visual KPH Performance */}
        <div className="glass-card p-6">
          <h3 className="text-[13px] font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <Trees size={16} className="text-emerald-400" /> Performa
            Penyelesaian RTT per KPH
          </h3>
          <div className="space-y-4">
            {data?.kph_performance?.map((k: any, i: number) => {
              const max = Math.max(
                ...data.kph_performance.map((x: any) => x.total),
              );
              const widthTotal = (k.total / max) * 100;
              const widthSah = (k.disahkan / k.total) * 100;

              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-[120px] text-[12px] font-bold text-slate-300 truncate">
                    {k.kph}
                  </div>
                  <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-slate-700 rounded-full"
                      style={{ width: `${widthTotal}%` }}
                    ></div>
                    <div
                      className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ width: `${(widthSah * widthTotal) / 100}%` }}
                    ></div>
                  </div>
                  <div className="w-[60px] text-right text-[11px] font-bold">
                    <span className="text-emerald-400">{k.disahkan}</span>{" "}
                    <span className="text-slate-600">/ {k.total}</span>
                  </div>
                </div>
              );
            })}
            {!data?.kph_performance?.length && (
              <p className="text-[12px] text-slate-500">Belum ada data KPH</p>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-card p-6">
          <h3 className="text-[13px] font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" /> Log Dokumen
            Tersertifikasi
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    No. Dokumen
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    KPH
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Luas (Ha)
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Pohon
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {data?.documents?.map((doc: any) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4 text-[13px] font-medium text-white">
                      {doc.nomor_dokumen}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-slate-300">
                      {doc.kph}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-slate-400">
                      {doc.tanggal}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-emerald-400 font-medium">
                      {doc.luas || "-"}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-slate-300">
                      {doc.jumlah_pohon || "-"}
                    </td>
                    <td className="py-3 px-4 text-right flex justify-end items-center gap-3">
                      {doc.crypto_status === "corrupt" ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                          ⚠️ Data Dimanipulasi
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Sah (ECC)
                        </span>
                      )}
                      <a
                        href={`http://localhost:8000/api/rtt/generate_pdf.php?id=${doc.id}`}
                        target="_blank"
                        className="btn-secondary px-3 py-1.5 text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-800"
                      >
                        <Download size={12} /> Cetak PDF
                      </a>
                    </td>
                  </tr>
                ))}
                {!data?.documents?.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-slate-500 text-[12px]"
                    >
                      Belum ada dokumen yang disahkan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
