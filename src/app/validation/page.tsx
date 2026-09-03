"use client";
import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import EncryptedDocumentViewer from "@/components/EncryptedDocumentViewer";
import PrivateKeyModal from "@/components/PrivateKeyModal";
import {
  CheckCircle, XCircle, Clock, Shield, Hash, Link2, ShieldCheck, ShieldX, Lock
} from "lucide-react";

const API = "http://localhost:8000/api";

function ValidationContent() {
  const { user, token } = useAuth();
  const [rttList, setRttList] = useState<any[]>([]);
  const [selectedRtt, setSelectedRtt] = useState<any | null>(null);
  const [encContent, setEncContent] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [decryptedDocData, setDecryptedDocData] = useState<any>(null);

  // Modal states
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetch(`${API}/rtt/list.php?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.status === "success") setRttList(d.data || []); });
  }, []);

  const fetchEncryptedContent = async (rttId: string) => {
    const res = await fetch(`${API}/rtt/get_encrypted_content.php?token=${token}&rtt_id=${rttId}`);
    const d = await res.json();
    if (d.status === "success") setEncContent(d.rtt);
  };

  const handleSelectRtt = (rttId: string) => {
    const rtt = rttList.find(r => r.id == rttId);
    setSelectedRtt(rtt || null);
    setResult(null);
    setDecryptedDocData(null);
    setEncContent(null);
    if (rttId) fetchEncryptedContent(rttId);
  };

  const handleValidate = async (privateKey: string) => {
    if (!selectedRtt) return;
    setLoading(true);
    setResult(null);
    setShowValidateModal(false);
    try {
      const res = await fetch(`${API}/validation/validate.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtt_id: selectedRtt.id, token, private_key: privateKey, action: "validate" }),
      });
      const data = await res.json();
      if (data.status === "success") setResult(data.validasi);
      else alert("Validasi gagal: " + data.message);
    } catch (e: any) { alert("Error: " + e.message); }
    finally { setLoading(false); }
  };

  const handleApprove = async (privateKey: string) => {
    setApproving(true);
    setShowApproveModal(false);
    try {
      const res = await fetch(`${API}/validation/validate.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtt_id: selectedRtt.id, token, private_key: privateKey, action: "approve" }),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("✅ " + data.message);
        setResult(null); setSelectedRtt(null); setEncContent(null); setDecryptedDocData(null);
        const listRes = await fetch(`${API}/rtt/list.php?token=${token}`);
        const listData = await listRes.json();
        setRttList(listData.data || []);
      } else alert("Gagal approve: " + data.message);
    } catch (e: any) { alert("Error: " + e.message); }
    finally { setApproving(false); }
  };

  const handleReject = async () => {
    const catatan = prompt("Masukkan catatan revisi untuk KPH:");
    if (!catatan) return;
    try {
      const res = await fetch(`${API}/validation/validate.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtt_id: selectedRtt.id, token, private_key: "reject_no_key_needed", action: "reject", catatan }),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert(data.message);
        setResult(null); setSelectedRtt(null); setEncContent(null); setDecryptedDocData(null);
        const listRes = await fetch(`${API}/rtt/list.php?token=${token}`);
        const listData = await listRes.json();
        setRttList(listData.data || []);
      } else alert(data.message);
    } catch (e: any) { alert("Error"); }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "valid") return <CheckCircle size={28} className="text-emerald-400 mx-auto" />;
    if (status === "invalid") return <XCircle size={28} className="text-red-400 mx-auto" />;
    return <Clock size={28} className="text-amber-400 mx-auto" />;
  };

  const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
    valid:   { text: "VALID",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15" },
    invalid: { text: "INVALID", color: "text-red-400",     bg: "bg-red-500/10 border-red-500/15" },
    pending: { text: "PENDING", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/15" },
  };

  return (
    <div className="max-w-[960px] mx-auto space-y-6 animate-fade-in">
      <div className="pb-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold text-white">Validasi Dokumen RTT</h1>
        <p className="text-slate-500 text-[13px] mt-1 font-medium">
          Verifikasi integritas, keaslian (ECDSA), dan kesesuaian data RTT terhadap RPKH
        </p>
      </div>

      {/* Select RTT */}
      <div className="glass-card p-7">
        <label className="block text-[11px] font-semibold text-slate-400 mb-2">Pilih Dokumen RTT</label>
        <select
          value={selectedRtt?.id || ""}
          onChange={e => handleSelectRtt(e.target.value)}
          className="glass-input w-full px-4 py-3 text-[13px]"
        >
          <option value="">-- Pilih RTT --</option>
          {rttList.map(r => (
            <option key={r.id} value={r.id}>{r.nomor_dokumen} — {r.kph} ({r.status})</option>
          ))}
        </select>
      </div>

      {/* Encrypted Document Viewer */}
      {selectedRtt && encContent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-[15px]">Isi Dokumen</h3>
            <button
              onClick={() => setShowValidateModal(true)}
              disabled={loading}
              className="btn-primary px-5 py-2 text-[12px] font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <Lock size={14} /> {loading ? "Memvalidasi..." : "Validasi dengan Private Key PHW"}
            </button>
          </div>

          <EncryptedDocumentViewer
            rttId={String(selectedRtt.id)}
            token={token || ""}
            encContent={encContent}
            ciphertextPreview={encContent.ciphertext_preview}
            ciphertextLength={encContent.ciphertext_length}
            kphHash={encContent.kph_hash}
            hasKphSignature={encContent.has_kph_signature}
            hasPhwSignature={encContent.has_phw_signature}
            encryptedFor={encContent.encrypted_for}
            onDecrypted={setDecryptedDocData}
            mode="phw"
          />

        </div>
      )}

      {/* Hasil Validasi ECDSA + Hash + Relasi */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-white font-semibold text-[15px]">Hasil Verifikasi Kriptografi</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            {/* Hash */}
            <div className={`glass-card p-6 border ${statusLabel[result.hash.status].bg} text-center`}>
              <StatusIcon status={result.hash.status} />
              <h4 className="text-white font-bold mt-3 mb-1 text-[14px]">Integritas Hash</h4>
              <p className={`text-[13px] font-bold ${statusLabel[result.hash.status].color}`}>
                {statusLabel[result.hash.status].text}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Hash size={12} className="text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium">SHA-256</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">{result.hash.detail}</p>
            </div>

            {/* Signature KPH */}
            <div className={`glass-card p-6 border ${statusLabel[result.signature.status].bg} text-center`}>
              <StatusIcon status={result.signature.status} />
              <h4 className="text-white font-bold mt-3 mb-1 text-[14px]">Tanda Tangan KPH</h4>
              <p className={`text-[13px] font-bold ${statusLabel[result.signature.status].color}`}>
                {statusLabel[result.signature.status].text}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Shield size={12} className="text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium">ECDSA (P-256)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {typeof result.signature.detail === "string" ? result.signature.detail : ""}
              </p>
            </div>

            {/* Relasi RPKH */}
            <div className={`glass-card p-6 border ${statusLabel[result.relasi.status].bg} text-center`}>
              <StatusIcon status={result.relasi.status} />
              <h4 className="text-white font-bold mt-3 mb-1 text-[14px]">Relasi RTT ↔ RPKH</h4>
              <p className={`text-[13px] font-bold ${statusLabel[result.relasi.status].color}`}>
                {statusLabel[result.relasi.status].text}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Link2 size={12} className="text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium">Validasi Petak</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {result.relasi.detail?.message || ""}
              </p>
            </div>
          </div>

          {result.relasi.status === "invalid" && result.relasi.detail?.petak_tidak_cocok && (
            <div className="glass-card p-5 border border-red-500/15 bg-red-500/5">
              <p className="text-red-400 text-[12px] font-bold uppercase tracking-wider mb-3">Petak Tidak Cocok dengan RPKH:</p>
              <div className="flex flex-wrap gap-2">
                {result.relasi.detail.petak_tidak_cocok.map((p: string) => (
                  <span key={p} className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg text-[12px] font-mono border border-red-500/15">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/[0.04]">
            <button
              onClick={() => setShowApproveModal(true)}
              disabled={approving}
              className="btn-primary flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {approving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                : <><ShieldCheck size={16} /> Setujui & Sign dengan Private Key PHW</>
              }
            </button>
            <button onClick={handleReject}
              className="btn-secondary flex-1 py-3 text-[13px] font-bold border-red-500/20 text-red-400 hover:bg-red-500/10">
              Tolak &amp; Kembalikan (Revisi)
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <PrivateKeyModal
        isOpen={showValidateModal}
        onClose={() => setShowValidateModal(false)}
        onConfirm={handleValidate}
        title="Validasi Dokumen RTT"
        description="Masukkan private key PHW untuk mendekripsi dan memverifikasi tanda tangan ECDSA dari KPH. Hasil verifikasi akan ditampilkan setelah proses selesai."
        actionLabel="Validasi Sekarang"
        loading={loading}
      />
      <PrivateKeyModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApprove}
        title="Setujui & Tanda Tangani (PHW)"
        description="Dengan menyetujui dokumen ini, kamu akan membubuhkan tanda tangan digital ECDSA PHW dan mengenkripsi ulang dokumen untuk Kepala Divisi. Masukkan private key PHW kamu."
        actionLabel="Setujui & Sign"
        loading={approving}
      />
    </div>
  );
}

export default function ValidationPage() {
  return <DashboardLayout><ValidationContent /></DashboardLayout>;
}
