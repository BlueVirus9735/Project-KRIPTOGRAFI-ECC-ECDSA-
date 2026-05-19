"use client";

import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import { CheckCircle, XCircle, Clock, Shield, Hash, Link2, FileText } from "lucide-react";

const API = "http://localhost:8000/api";

function ValidationContent() {
  const { token } = useAuth();
  const [rttList, setRttList] = useState<any[]>([]);
  const [selectedRtt, setSelectedRtt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/rtt/list.php`).then(r => r.json()).then(d => { if (d.status === "success") setRttList(d.data || []); });
  }, []);

  const handleValidate = async () => {
    if (!selectedRtt) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/validation/validate.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtt_id: selectedRtt, token }),
      });
      const data = await res.json();
      if (data.status === "success") setResult(data.validasi);
      else alert(data.message);
    } catch (e) { alert("Gagal melakukan validasi"); }
    finally { setLoading(false); }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'valid') return <CheckCircle size={28} className="text-emerald-400 mx-auto" />;
    if (status === 'invalid') return <XCircle size={28} className="text-red-400 mx-auto" />;
    return <Clock size={28} className="text-amber-400 mx-auto" />;
  };

  const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
    valid: { text: "VALID", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15" },
    invalid: { text: "INVALID", color: "text-red-400", bg: "bg-red-500/10 border-red-500/15" },
    pending: { text: "PENDING", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/15" },
  };

  return (
    <div className="max-w-[900px] mx-auto space-y-6 animate-fade-in">
      <div className="pb-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold text-white">Validasi Dokumen RTT</h1>
        <p className="text-slate-500 text-[13px] mt-1 font-medium">Validasi integritas, keaslian, dan kesesuaian data RTT terhadap RPKH</p>
      </div>

      {/* Select RTT */}
      <div className="glass-card p-7">
        <label className="block text-[11px] font-semibold text-slate-400 mb-2">Pilih Dokumen RTT</label>
        <div className="flex gap-3">
          <select value={selectedRtt} onChange={e => setSelectedRtt(e.target.value)} className="glass-input flex-1 px-4 py-3 text-[13px]">
            <option value="">-- Pilih RTT --</option>
            {rttList.map(r => <option key={r.id} value={r.id}>{r.nomor_dokumen} — {r.kph} ({r.status})</option>)}
          </select>
          <button onClick={handleValidate} disabled={!selectedRtt || loading} className="btn-primary px-6 py-3 text-[13px] font-semibold disabled:opacity-50">
            {loading ? "Memvalidasi..." : "Jalankan Validasi"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-white font-semibold text-[15px]">Hasil Validasi</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            {/* Hash Validation */}
            <div className={`glass-card p-6 border ${statusLabel[result.hash.status].bg} text-center`}>
              <StatusIcon status={result.hash.status} />
              <h4 className="text-white font-bold mt-3 mb-1 text-[14px]">Integritas Hash</h4>
              <p className={`text-[13px] font-bold ${statusLabel[result.hash.status].color}`}>{statusLabel[result.hash.status].text}</p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Hash size={12} className="text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium">SHA-256</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">{result.hash.detail}</p>
            </div>

            {/* Signature Validation */}
            <div className={`glass-card p-6 border ${statusLabel[result.signature.status].bg} text-center`}>
              <StatusIcon status={result.signature.status} />
              <h4 className="text-white font-bold mt-3 mb-1 text-[14px]">Tanda Tangan Digital</h4>
              <p className={`text-[13px] font-bold ${statusLabel[result.signature.status].color}`}>{statusLabel[result.signature.status].text}</p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Shield size={12} className="text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium">ECDSA (SECP256K1)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">{typeof result.signature.detail === 'string' ? result.signature.detail : ''}</p>
            </div>

            {/* Relasi RPKH Validation */}
            <div className={`glass-card p-6 border ${statusLabel[result.relasi.status].bg} text-center`}>
              <StatusIcon status={result.relasi.status} />
              <h4 className="text-white font-bold mt-3 mb-1 text-[14px]">Relasi RTT ↔ RPKH</h4>
              <p className={`text-[13px] font-bold ${statusLabel[result.relasi.status].color}`}>{statusLabel[result.relasi.status].text}</p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Link2 size={12} className="text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium">Validasi Petak</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">{result.relasi.detail?.message || ''}</p>
            </div>
          </div>

          {/* Invalid petak details */}
          {result.relasi.status === 'invalid' && result.relasi.detail?.petak_tidak_cocok && (
            <div className="glass-card p-5 border border-red-500/15 bg-red-500/5">
              <p className="text-red-400 text-[12px] font-bold uppercase tracking-wider mb-3">Petak Tidak Cocok dengan RPKH:</p>
              <div className="flex flex-wrap gap-2">
                {result.relasi.detail.petak_tidak_cocok.map((p: string) => (
                  <span key={p} className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg text-[12px] font-mono border border-red-500/15">{p}</span>
                ))}
              </div>
            </div>
          )}
          {/* Action Buttons for PHW */}
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/[0.04]">
            <button 
              onClick={async () => {
                if (!confirm("Setujui dokumen ini dan teruskan ke Divisi untuk Pengesahan Final?")) return;
                try {
                  const res = await fetch(`${API}/rtt/review.php`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rtt_id: selectedRtt, token, action: 'approve' })
                  });
                  const d = await res.json();
                  if (d.status === 'success') {
                    alert(d.message);
                    setResult(null);
                    setSelectedRtt("");
                    // refresh list
                    const listRes = await fetch(`${API}/rtt/list.php`);
                    const listData = await listRes.json();
                    setRttList(listData.data || []);
                  } else alert(d.message);
                } catch(e) { alert("Error"); }
              }}
              className="btn-primary flex-1 py-3 text-[13px] font-bold"
            >
              Setujui Dokumen (Teruskan ke Finalisasi)
            </button>
            <button 
              onClick={async () => {
                const catatan = prompt("Masukkan catatan revisi untuk KPH:");
                if (!catatan) return;
                try {
                  const res = await fetch(`${API}/rtt/review.php`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rtt_id: selectedRtt, token, action: 'reject', catatan })
                  });
                  const d = await res.json();
                  if (d.status === 'success') {
                    alert(d.message);
                    setResult(null);
                    setSelectedRtt("");
                    // refresh list
                    const listRes = await fetch(`${API}/rtt/list.php`);
                    const listData = await listRes.json();
                    setRttList(listData.data || []);
                  } else alert(d.message);
                } catch(e) { alert("Error"); }
              }}
              className="btn-secondary flex-1 py-3 text-[13px] font-bold border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              Tolak & Kembalikan (Revisi)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ValidationPage() {
  return <DashboardLayout><ValidationContent /></DashboardLayout>;
}
