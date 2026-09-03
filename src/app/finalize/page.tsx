"use client";
import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import EncryptedDocumentViewer from "@/components/EncryptedDocumentViewer";
import PrivateKeyModal from "@/components/PrivateKeyModal";
import {
  CheckCircle, ShieldCheck, ShieldX, Shield, FileText, Key, Lock
} from "lucide-react";

const API = "http://localhost:8000/api";

function FinalizeContent() {
  const { user, token } = useAuth();
  const [rttList, setRttList] = useState<any[]>([]);
  const [selectedRtt, setSelectedRtt] = useState("");
  const [encContent, setEncContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [decryptedDocData, setDecryptedDocData] = useState<any>(null);

  // Modal untuk sign final
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetch(`${API}/rtt/list.php?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === "success") {
          const filtered = (d.data || []).filter((r: any) => r.status === "menunggu_pengesahan");
          setRttList(filtered);
        }
      });
  }, []);

  const fetchEncryptedContent = async (rttId: string) => {
    const res = await fetch(`${API}/rtt/get_encrypted_content.php?token=${token}&rtt_id=${rttId}`);
    const d = await res.json();
    if (d.status === "success") setEncContent(d.rtt);
  };

  const handleSelectRtt = (rttId: string) => {
    setSelectedRtt(rttId);
    setDecryptedDocData(null);
    setEncContent(null);
    setSuccessData(null);
    if (rttId) fetchEncryptedContent(rttId);
  };

  const handleSign = async (privateKey: string) => {
    setSigning(true);
    setShowSignModal(false);
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
        setRttList(rttList.filter(r => r.id != selectedRtt));
        setSelectedRtt("");
        setEncContent(null);
        setDecryptedDocData(null);
      } else {
        alert("Gagal mengesahkan: " + data.message + (data.detail ? "\n\nDetail: " + data.detail : ""));
      }

    } catch (e: any) {
      alert("Terjadi kesalahan jaringan: " + e.message);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto space-y-6 animate-fade-in">
      <div className="pb-6 border-b border-slate-200 dark:border-white/[0.04]">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="text-emerald-600 dark:text-emerald-400" /> Pengesahan Final RTT — Kepala Divisi
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-[13px] mt-1">
          Buka dokumen, verifikasi tanda tangan PHW dan KPH, lalu sahkan dengan private key Kepala Divisi
        </p>
      </div>

      {!successData ? (
        <div className="space-y-5">
          {/* RTT Selection */}
          <div className="glass-card p-7">
            <h3 className="text-slate-900 dark:text-white font-bold text-[15px] mb-4 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" /> 1. Pilih Dokumen Menunggu Pengesahan
            </h3>
            <select
              value={selectedRtt}
              onChange={e => handleSelectRtt(e.target.value)}
              className="glass-input w-full px-4 py-3 text-[13px]"
            >
              <option value="">-- Pilih RTT Menunggu Pengesahan --</option>
              {rttList.map(r => (
                <option key={r.id} value={r.id}>{r.nomor_dokumen} — {r.kph}</option>
              ))}
            </select>
            {rttList.length === 0 && (
              <p className="text-amber-700 dark:text-amber-400 text-[11px] mt-2 font-medium">
                ⚠️ Tidak ada dokumen RTT yang siap disahkan saat ini.
              </p>
            )}
          </div>

          {/* Encrypted Document Viewer — Divisi mode */}
          {selectedRtt && encContent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 dark:text-white font-bold text-[15px] flex items-center gap-2">
                  <Lock size={16} className="text-amber-500" /> 2. Buka dan Periksa Isi Dokumen
                </h3>
                {encContent.has_kph_signature && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                    <Shield size={11} className="text-emerald-700 dark:text-emerald-400" />
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold">SIGNED KPH + PHW</span>
                  </div>
                )}
              </div>
              <EncryptedDocumentViewer
                rttId={selectedRtt}
                token={token || ""}
                encContent={encContent}
                ciphertextPreview={encContent.ciphertext_preview}
                ciphertextLength={encContent.ciphertext_length}
                kphHash={encContent.kph_hash}
                hasKphSignature={encContent.has_kph_signature}
                hasPhwSignature={encContent.has_phw_signature}
                encryptedFor={encContent.encrypted_for}
                onDecrypted={setDecryptedDocData}
                mode="divisi"
              />

            </div>
          )}

          {/* Sign section — tampil setelah dokumen terdekripsi */}
          {decryptedDocData && selectedRtt && (
            <div className="glass-card p-7 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/5 animate-slide-up">
              <h3 className="text-slate-900 dark:text-white font-bold text-[15px] mb-3 flex items-center gap-2">
                <Key size={16} className="text-amber-500" /> 3. Sahkan dengan Tanda Tangan Digital
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[12px] mb-4">
                Setelah memeriksa isi dokumen di atas, klik tombol di bawah untuk membubuhkan
                tanda tangan digital ECDSA Kepala Divisi dan mengesahkan dokumen RTT ini secara resmi.
              </p>

              {/* Signature chain info */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 mb-5 space-y-2">
                <p className="text-[11px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">Rantai Tanda Tangan:</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${encContent?.has_kph_signature ? "bg-emerald-500" : "bg-slate-400"}`} />
                  <span className="text-[12px] text-slate-800 dark:text-slate-300">ECDSA KPH: {encContent?.has_kph_signature ? "✅ Tersedia" : "⏳ Belum ada"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${encContent?.has_phw_signature ? "bg-emerald-500" : "bg-slate-400"}`} />
                  <span className="text-[12px] text-slate-800 dark:text-slate-300">ECDSA PHW: {encContent?.has_phw_signature ? "✅ Tersedia" : "⏳ Belum ada"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[12px] text-amber-800 dark:text-amber-300 font-medium">ECDSA Kepala Divisi: ⏳ Menunggu pengesahan</span>
                </div>
              </div>

              <button
                onClick={() => setShowSignModal(true)}
                disabled={signing}
                className="w-full btn-primary py-4 text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {signing ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses Kriptografi ECDSA...</>
                ) : (
                  <><ShieldCheck size={18} /> Sahkan &amp; Tanda Tangani Dokumen (Kepala Divisi)</>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        // Success state
        <div className="glass-card p-8 text-center animate-slide-up border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/5">
          <CheckCircle className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Dokumen Berhasil Disahkan!</h2>
          <p className="text-emerald-700 dark:text-emerald-400 font-medium text-[13px] mb-8">{successData.message}</p>

          <div className="bg-white dark:bg-slate-900/50 rounded-xl p-5 text-left space-y-4 border border-slate-200 dark:border-white/[0.05]">
            <div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-1">Hash SHA-256 Final</p>
              <p className="font-mono text-emerald-800 dark:text-emerald-300 text-[12px] break-all">{successData.hash}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-1">Signature ECDSA Kepala Divisi</p>
              <p className="font-mono text-blue-800 dark:text-blue-300 text-[12px] break-all">{successData.signature}</p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">Sig. KPH</p>
                <p className="text-[12px] font-bold text-emerald-800 dark:text-emerald-400">{successData.kph_sig_status === "valid" ? "✅ VALID" : successData.kph_sig_status}</p>
              </div>
              <div className="flex-1 bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">Sig. PHW</p>
                <p className="text-[12px] font-bold text-blue-800 dark:text-blue-400">{successData.phw_sig_status === "valid" ? "✅ VALID" : successData.phw_sig_status}</p>
              </div>
            </div>
          </div>

          <button onClick={() => setSuccessData(null)} className="btn-secondary mt-8 px-6 py-2.5 text-[13px]">
            Sahkan Dokumen Lainnya
          </button>
        </div>
      )}

      {/* Sign Modal */}
      <PrivateKeyModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        onConfirm={handleSign}
        title="Pengesahan Final — Kepala Divisi"
        description="Masukkan private key Kepala Divisi untuk membubuhkan tanda tangan digital ECDSA final. Dokumen akan berstatus DISAHKAN setelah proses ini selesai."
        actionLabel="Sahkan Dokumen"
        loading={signing}
      />
    </div>
  );
}

export default function FinalizePage() {
  return <DashboardLayout><FinalizeContent /></DashboardLayout>;
}
