"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PrivateKeyModal from "@/components/PrivateKeyModal";
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
  Printer,
  Key,
} from "lucide-react";

const API = "http://localhost:8000/api";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State untuk Otorisasi Private Key Cetak PDF
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    fetch(`${API}/rtt/reports.php?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") setData(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  const handleInitiatePrint = (doc: any) => {
    setSelectedDoc(doc);
    setShowKeyModal(true);
  };

  const handleAuthorizePrint = async (privateKey: string) => {
    if (!selectedDoc) return;
    setAuthorizing(true);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API}/rtt/auth_pdf.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rtt_id: selectedDoc.id,
          private_key: privateKey,
        }),
      });

      const result = await res.json();

      if (result.status === "success" && result.url) {
        setShowKeyModal(false);
        // Buka tab baru dokumen yang sudah diotorisasi
        window.open(result.url, "_blank");
      } else {
        alert(
          result.message ||
            "Gagal mengotorisasi Private Key. Pastikan kunci yang digunakan benar.",
        );
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat memverifikasi kunci: " + (err.message || err));
    } finally {
      setAuthorizing(false);
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-700 dark:text-white gap-3 animate-fade-in">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold">Memuat Data Laporan...</p>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-[1150px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.04]">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Activity className="text-emerald-600 dark:text-emerald-400" /> Dashboard Laporan
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-[13px] mt-1 font-medium">
              Rekapitulasi performa Rencana Teknik Tahunan (RTT) Perum Perhutani
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="btn-primary px-5 py-2.5 text-[12px] font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all"
          >
            <FileSpreadsheet size={16} /> Export ke Excel
          </button>
        </div>

        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
          {/* Card 1 */}
          <div className="glass-card p-6 border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent relative overflow-hidden shadow-xs">
            <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10 text-emerald-600 dark:text-emerald-400 pointer-events-none">
              <ShieldCheck size={120} />
            </div>
            <p className="text-[11px] font-bold text-emerald-800 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" /> Total RTT Disahkan
            </p>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">
              {data?.overview?.total_disahkan || 0}{" "}
              <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                dokumen
              </span>
            </h2>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Terverifikasi Kriptografi (ECC)
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 border-blue-200 dark:border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent relative overflow-hidden shadow-xs">
            <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10 text-blue-600 dark:text-blue-400 pointer-events-none">
              <Map size={120} />
            </div>
            <p className="text-[11px] font-bold text-blue-800 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Map size={15} className="text-blue-600 dark:text-blue-400" /> Total Luas Tebangan Sah
            </p>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">
              {data?.production?.total_luas || 0}{" "}
              <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                Hektar (Ha)
              </span>
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-2">
              Dari {data?.production?.total_pohon || 0} estimasi pohon
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 border-amber-200 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden shadow-xs">
            <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10 text-amber-600 dark:text-amber-400 pointer-events-none">
              <TrendingUp size={120} />
            </div>
            <p className="text-[11px] font-bold text-amber-800 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers size={15} className="text-amber-600 dark:text-amber-400" /> Dokumen Dalam Proses
            </p>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">
              {data?.overview?.total_pending || 0}{" "}
              <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                dokumen
              </span>
            </h2>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-2">
              Menunggu Validasi PHW / Divisi
            </p>
          </div>
        </div>

        {/* Visual KPH Performance */}
        <div className="glass-card p-6 border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <Trees size={16} className="text-emerald-600 dark:text-emerald-400" /> Performa Penyelesaian RTT per KPH
          </h3>
          <div className="space-y-4">
            {data?.kph_performance?.map((k: any, i: number) => {
              const max = Math.max(
                ...data.kph_performance.map((x: any) => x.total),
                1,
              );
              const widthTotal = (k.total / max) * 100;
              const widthSah = k.total > 0 ? (k.disahkan / k.total) * 100 : 0;

              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-[140px] text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {k.kph}
                  </div>
                  <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden relative border border-slate-200 dark:border-slate-800">
                    <div
                      className="absolute top-0 left-0 h-full bg-slate-300 dark:bg-slate-700 rounded-full"
                      style={{ width: `${widthTotal}%` }}
                    />
                    <div
                      className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ width: `${(widthSah * widthTotal) / 100}%` }}
                    />
                  </div>
                  <div className="w-[70px] text-right text-[11px] font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">{k.disahkan}</span>{" "}
                    <span className="text-slate-500 dark:text-slate-500">/ {k.total}</span>
                  </div>
                </div>
              );
            })}
            {!data?.kph_performance?.length && (
              <p className="text-[12px] text-slate-500 py-3">Belum ada data KPH yang tercatat</p>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-card p-6 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-emerald-600 dark:text-emerald-400" /> Log Dokumen Tersertifikasi
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Dokumen resmi yang telah disahkan secara kriptografis oleh Kepala Divisi
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Key size={13} className="text-amber-500" />
              <span>Cetak Terproteksi Private Key ECC</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-slate-900/40">
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    No. Dokumen
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    KPH
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    Luas (Ha)
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    Pohon
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider text-right">
                    Status & Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02]">
                {data?.documents?.map((doc: any) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 text-[13px] font-bold text-slate-900 dark:text-white font-mono">
                      {doc.nomor_dokumen}
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-slate-700 dark:text-slate-300 font-medium">
                      {doc.kph}
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-slate-600 dark:text-slate-400 font-medium">
                      {doc.tanggal}
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                      {doc.luas || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-slate-700 dark:text-slate-300 font-medium">
                      {doc.jumlah_pohon || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end items-center gap-2.5">
                        {doc.crypto_status === "corrupt" ? (
                          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 border border-rose-200 dark:border-red-500/20 animate-pulse">
                            ⚠️ Data Dimanipulasi
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            Sah (ECC)
                          </span>
                        )}
                        <button
                          onClick={() => handleInitiatePrint(doc)}
                          className="btn-secondary px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all"
                          title="Otorisasi Private Key untuk Cetak PDF Resmi"
                        >
                          <Printer size={13} className="text-emerald-600 dark:text-emerald-400" /> Cetak PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!data?.documents?.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-slate-500 text-[13px] font-medium"
                    >
                      Belum ada dokumen yang disahkan untuk dicetak
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Otorisasi Kunci Privat (Private Key) Cetak Dokumen */}
      <PrivateKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onConfirm={handleAuthorizePrint}
        loading={authorizing}
        title="Otorisasi Private Key Cetak PDF"
        description={`Dokumen resmi RTT (${selectedDoc?.nomor_dokumen || "RTT"}) dilindungi enkripsi kriptografi tingkat tinggi ECC (SECP256K1 & ECIES). Silakan unggah file Private Key (.pem / .key) atau tempelkan kuncinya untuk mengotorisasi pencetakan dokumen resmi.`}
        actionLabel={authorizing ? "Memverifikasi Kunci..." : "Verifikasi & Buka PDF"}
      />
    </DashboardLayout>
  );
}
