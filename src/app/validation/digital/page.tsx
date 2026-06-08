"use client";

import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Hash,
  Key,
  FileText,
  Fingerprint,
  Lock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

const API = "http://localhost:8000/api";

function DigitalValidationContent() {
  const { token } = useAuth();
  const [rttList, setRttList] = useState<any[]>([]);
  const [selectedRtt, setSelectedRtt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [rttDetail, setRttDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    fetch(`${API}/rtt/list.php`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") {
          const signed = (d.data || []).filter(
            (r: any) => r.status === "disahkan",
          );
          setRttList(signed);
        }
      });
  }, []);

  const handleValidate = async () => {
    if (!selectedRtt) return;
    setLoading(true);
    setResult(null);
    setRttDetail(null);
    try {
      // 1. Fetch RTT detail for crypto info display
      const detailRes = await fetch(`${API}/rtt/detail.php?id=${selectedRtt}`);
      const detailData = await detailRes.json();
      if (detailData.status === "success") setRttDetail(detailData.rtt);

      // 2. Run server-side validation (hash + signature + relasi)
      const res = await fetch(`${API}/validation/validate.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtt_id: selectedRtt, token }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setResult(data.validasi);
        setTimestamp(
          new Date().toLocaleString("id-ID", {
            dateStyle: "full",
            timeStyle: "long",
          }),
        );
      } else alert(data.message);
    } catch (e: any) {
      alert("Gagal melakukan validasi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const StatusCard = ({ icon, title, status, protocol, detail }: any) => {
    const cfg: Record<
      string,
      { text: string; color: string; bg: string; border: string; icon: any }
    > = {
      valid: {
        text: "VERIFIED",
        color: "text-emerald-400",
        bg: "bg-emerald-500/[0.06]",
        border: "border-emerald-500/20",
        icon: <CheckCircle size={32} className="text-emerald-400" />,
      },
      invalid: {
        text: "FAILED",
        color: "text-red-400",
        bg: "bg-red-500/[0.06]",
        border: "border-red-500/20",
        icon: <XCircle size={32} className="text-red-400" />,
      },
      pending: {
        text: "PENDING",
        color: "text-amber-400",
        bg: "bg-amber-500/[0.06]",
        border: "border-amber-500/20",
        icon: <Clock size={32} className="text-amber-400" />,
      },
    };
    const c = cfg[status] || cfg.pending;
    return (
      <div
        className={`glass-card p-6 border ${c.border} ${c.bg} text-center space-y-3 transition-all hover:scale-[1.02]`}
      >
        <div className="flex justify-center">{c.icon}</div>
        <div className="flex items-center justify-center gap-2 text-slate-500">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {protocol}
          </span>
        </div>
        <h4 className="text-white font-bold text-[14px]">{title}</h4>
        <p className={`text-[13px] font-extrabold tracking-wider ${c.color}`}>
          {c.text}
        </p>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          {typeof detail === "string" ? detail : detail?.message || ""}
        </p>
      </div>
    );
  };

  const allValid =
    result &&
    result.hash.status === "valid" &&
    result.signature.status === "valid" &&
    result.relasi.status === "valid";

  return (
    <div className="max-w-[950px] mx-auto space-y-6 animate-fade-in">
      <div className="pb-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Fingerprint className="text-emerald-400" /> Validasi Digital
          Kriptografi
        </h1>
        <p className="text-slate-500 text-[13px] mt-1 font-medium">
          Audit integritas dan autentikasi dokumen RTT yang telah disahkan
          secara otomatis dari database
        </p>
      </div>

      {/* Select RTT */}
      <div className="glass-card p-7">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={14} className="text-emerald-400" />
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pilih Dokumen RTT yang Telah Disahkan
          </label>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedRtt}
            onChange={(e) => {
              setSelectedRtt(e.target.value);
              setResult(null);
            }}
            className="glass-input flex-1 px-4 py-3 text-[13px]"
          >
            <option value="">-- Pilih RTT Berstatus SAH --</option>
            {rttList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nomor_dokumen} — {r.kph}
              </option>
            ))}
          </select>
          <button
            onClick={handleValidate}
            disabled={!selectedRtt || loading}
            className="btn-primary px-6 py-3 text-[13px] font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <Shield size={14} /> Audit Kriptografi
              </>
            )}
          </button>
        </div>
        {rttList.length === 0 && (
          <p className="text-amber-400 text-[11px] mt-2 font-medium">
            ⚠️ Belum ada dokumen RTT yang berstatus SAH. Lakukan Finalisasi
            terlebih dahulu.
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-slide-up">
          {/* Overall Verdict */}
          <div
            className={`glass-card p-8 text-center border ${allValid ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-red-500/30 bg-red-500/[0.04]"}`}
          >
            <div className="flex justify-center mb-4">
              {allValid ? (
                <ShieldCheck size={56} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={56} className="text-red-400" />
              )}
            </div>
            <h2
              className={`text-2xl font-extrabold mb-1 ${allValid ? "text-emerald-400" : "text-red-400"}`}
            >
              {allValid ? "DOKUMEN TERVERIFIKASI" : "VERIFIKASI GAGAL"}
            </h2>
            <p className="text-slate-500 text-[13px] font-medium">
              {allValid
                ? "Seluruh parameter kriptografi valid — Data asli, autentik, dan tidak dimodifikasi."
                : "Satu atau lebih parameter kriptografi gagal diverifikasi."}
            </p>
            <p className="text-slate-600 text-[10px] mt-3 font-medium">
              Diaudit pada: {timestamp}
            </p>
          </div>

          {/* 3 Validation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            <StatusCard
              icon={<Hash size={12} />}
              title="Integritas Data"
              status={result.hash.status}
              protocol="SHA-256"
              detail={result.hash.detail}
            />
            <StatusCard
              icon={<Key size={12} />}
              title="Tanda Tangan Digital"
              status={result.signature.status}
              protocol="ECDSA • SECP256K1"
              detail={result.signature.detail}
            />
            <StatusCard
              icon={<FileText size={12} />}
              title="Relasi RTT ↔ RPKH"
              status={result.relasi.status}
              protocol="Cross-Reference"
              detail={result.relasi.detail}
            />
          </div>

          {/* Crypto Details */}
          {rttDetail && (
            <div className="glass-card p-6 space-y-5">
              <h3 className="text-white font-bold text-[14px] flex items-center gap-2">
                <Fingerprint size={16} className="text-emerald-400" /> Detail
                Kriptografi
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Hash */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Document Hash (SHA-256)
                  </p>
                  <p className="font-mono text-emerald-300 text-[12px] break-all leading-relaxed">
                    {rttDetail.hash || "N/A"}
                  </p>
                </div>

                {/* Signature */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Digital Signature (ECDSA)
                  </p>
                  <p className="font-mono text-blue-300 text-[11px] break-all leading-relaxed">
                    {rttDetail.signature || "N/A"}
                  </p>
                </div>

                {/* Public Key */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Public Key (PEM)
                  </p>
                  <pre className="font-mono text-amber-300 text-[10px] break-all leading-relaxed whitespace-pre-wrap">
                    {rttDetail.public_key || "N/A"}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Invalid Petak Detail */}
          {result.relasi.status === "invalid" &&
            result.relasi.detail?.petak_tidak_cocok && (
              <div className="glass-card p-5 border border-red-500/15 bg-red-500/5">
                <p className="text-red-400 text-[12px] font-bold uppercase tracking-wider mb-3">
                  Petak Tidak Cocok dengan RPKH:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.relasi.detail.petak_tidak_cocok.map((p: string) => (
                    <span
                      key={p}
                      className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg text-[12px] font-mono border border-red-500/15"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Info */}
          <div className="glass-card p-6">
            <h3 className="text-white font-bold text-[14px] mb-3">
              Bagaimana Validasi Digital Bekerja?
            </h3>
            <div className="space-y-2.5 text-[12px] text-slate-500 font-medium">
              <p>
                • <span className="text-slate-300">Integritas (Hash)</span> —
                Sistem merekonstruksi payload kanonik dari database, menghitung
                SHA-256, lalu mencocokkannya dengan hash yang tersimpan.
              </p>
              <p>
                •{" "}
                <span className="text-slate-300">Autentikasi (Signature)</span>{" "}
                — Script Python memverifikasi bahwa Signature ECDSA cocok dengan
                Public Key dan Hash dokumen menggunakan kurva{" "}
                <span className="text-emerald-400">SECP256K1</span>.
              </p>
              <p>
                • <span className="text-slate-300">Konsistensi (Relasi)</span> —
                Setiap Petak/Anak Petak di RTT di-cross-check terhadap data
                induk RPKH untuk mencegah data fiktif.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DigitalValidationPage() {
  return (
    <DashboardLayout>
      <DigitalValidationContent />
    </DashboardLayout>
  );
}
