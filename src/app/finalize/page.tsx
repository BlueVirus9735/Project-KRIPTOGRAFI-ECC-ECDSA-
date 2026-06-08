"use client";

import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import {
  CheckCircle,
  AlertCircle,
  Key,
  Lock,
  ShieldCheck,
  FileText,
} from "lucide-react";

const API = "http://localhost:8000/api";

function FinalizeContent() {
  const { token, user } = useAuth();
  const [rttList, setRttList] = useState<any[]>([]);
  const [selectedRtt, setSelectedRtt] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    // Ambil daftar RTT
    fetch(`${API}/rtt/list.php`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") {
          // Filter hanya yang menunggu_pengesahan
          const filtered = (d.data || []).filter(
            (r: any) => r.status === "menunggu_pengesahan",
          );
          setRttList(filtered);
        }
      });
  }, []);

  const handleSign = async () => {
    if (!selectedRtt) return alert("Pilih dokumen RTT terlebih dahulu!");
    if (!privateKey.trim()) return alert("Private Key tidak boleh kosong!");

    setLoading(true);
    setSuccessData(null);
    try {
      const res = await fetch(`${API}/rtt/sign.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rtt_id: selectedRtt,
          private_key: privateKey,
          token,
          user_id: user?.id,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setSuccessData(data);
        // Hapus dari list
        setRttList(rttList.filter((r) => r.id != selectedRtt));
        setSelectedRtt("");
        setPrivateKey("");
      } else {
        alert("Gagal mengesahkan: " + data.message);
      }
    } catch (e: any) {
      alert("Terjadi kesalahan jaringan: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-6 animate-fade-in">
      <div className="pb-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" /> Pengesahan Final RTT
        </h1>
        <p className="text-slate-500 text-[13px] mt-1 font-medium">
          Langkah terakhir membubuhkan tanda tangan digital ECDSA untuk
          melegalkan dokumen.
        </p>
      </div>

      {!successData ? (
        <div className="space-y-5">
          {/* RTT Selection */}
          <div className="glass-card p-7">
            <h3 className="text-white font-bold text-[15px] mb-4 flex items-center gap-2">
              <FileText size={16} className="text-blue-400" /> 1. Pilih Dokumen
            </h3>
            <select
              value={selectedRtt}
              onChange={(e) => setSelectedRtt(e.target.value)}
              className="glass-input w-full px-4 py-3 text-[13px]"
            >
              <option value="">-- Pilih RTT Menunggu Pengesahan --</option>
              {rttList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nomor_dokumen} — {r.kph}
                </option>
              ))}
            </select>
            {rttList.length === 0 && (
              <p className="text-amber-400 text-[11px] mt-2 font-medium">
                ⚠️ Tidak ada dokumen RTT yang siap disahkan saat ini. (Pastikan
                RTT sudah diapprove)
              </p>
            )}
          </div>

          {/* Key Input */}
          <div
            className={`glass-card p-7 transition-all ${!selectedRtt ? "opacity-50 pointer-events-none" : ""}`}
          >
            <h3 className="text-white font-bold text-[15px] mb-4 flex items-center gap-2">
              <Key size={16} className="text-amber-400" /> 2. Masukkan Private
              Key
            </h3>
            <textarea
              className="glass-input w-full px-4 py-3 text-[11px] font-mono h-[200px] resize-none"
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
          </div>

          {/* Action */}
          <button
            onClick={handleSign}
            disabled={!selectedRtt || !privateKey || loading}
            className="w-full btn-primary py-4 text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              "Memproses Kriptografi ECDSA..."
            ) : (
              <>
                <Lock size={18} /> Sahkan & Tanda Tangani Dokumen
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="glass-card p-8 text-center animate-slide-up border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Dokumen Berhasil Disahkan!
          </h2>
          <p className="text-emerald-400 font-medium text-[13px] mb-8">
            {successData.message}
          </p>

          <div className="bg-slate-900/50 rounded-xl p-5 text-left space-y-4 border border-white/[0.05]">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Hash SHA-256 (Integritas)
              </p>
              <p className="font-mono text-emerald-300 text-[12px] break-all">
                {successData.hash}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Signature ECDSA (Autentikasi)
              </p>
              <p className="font-mono text-blue-300 text-[12px] break-all">
                {successData.signature}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSuccessData(null)}
            className="btn-secondary mt-8 px-6 py-2.5 text-[13px]"
          >
            Sahkan Dokumen Lainnya
          </button>
        </div>
      )}
    </div>
  );
}

export default function FinalizePage() {
  return (
    <DashboardLayout>
      <FinalizeContent />
    </DashboardLayout>
  );
}
