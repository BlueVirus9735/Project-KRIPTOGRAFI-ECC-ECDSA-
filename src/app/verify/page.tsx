"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Shield, CheckCircle, XCircle, Upload, FileKey } from "lucide-react";

const API = "http://localhost:8000/api";

function VerifyContent() {
  const [docFile, setDocFile] = useState<File | null>(null);
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !sigFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("document", docFile);
    formData.append("signature", sigFile);

    try {
      const response = await fetch(`${API}/verify.php`, { method: "POST", body: formData });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("Gagal terhubung ke backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-6 animate-fade-in">
      <div className="pb-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold text-white">Verifikasi Tanda Tangan Digital</h1>
        <p className="text-slate-500 text-[13px] mt-1 font-medium">Verifikasi keaslian dokumen menggunakan ECDSA (Elliptic Curve Digital Signature Algorithm)</p>
      </div>

      <div className="glass-card p-7">
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-2">1. Dokumen / Data</label>
              <div className={`relative border rounded-xl p-8 text-center transition-all cursor-pointer ${docFile ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.08] bg-slate-900/30 hover:border-emerald-500/20 hover:bg-slate-900/50'}`}>
                <input type="file" id="doc-upload" className="hidden" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
                <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${docFile ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Upload size={22} />
                  </div>
                  <span className="text-[13px] font-medium text-slate-300 break-all">{docFile ? docFile.name : "Pilih File Dokumen"}</span>
                  {!docFile && <span className="text-[11px] text-slate-600">PDF, DOCX, atau file lainnya</span>}
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-2">2. File Signature (.sig)</label>
              <div className={`relative border rounded-xl p-8 text-center transition-all cursor-pointer ${sigFile ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.08] bg-slate-900/30 hover:border-emerald-500/20 hover:bg-slate-900/50'}`}>
                <input type="file" id="sig-upload" className="hidden" onChange={(e) => setSigFile(e.target.files?.[0] || null)} />
                <label htmlFor="sig-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sigFile ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <FileKey size={22} />
                  </div>
                  <span className="text-[13px] font-medium text-slate-300 break-all">{sigFile ? sigFile.name : "Pilih File Signature"}</span>
                  {!sigFile && <span className="text-[11px] text-slate-600">File .sig dari proses signing</span>}
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={!docFile || !sigFile || loading} className="btn-primary w-full py-3.5 text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memverifikasi ECDSA...</>
            ) : (
              <><Shield size={16} /> Jalankan Verifikasi</>
            )}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-7 rounded-2xl text-center animate-scale-in ${result.is_valid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            {result.is_valid ? (
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
            ) : (
              <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            )}
            <h3 className={`text-2xl font-extrabold mb-2 ${result.is_valid ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.is_valid ? "DOKUMEN VALID ✓" : "DOKUMEN TIDAK VALID ✗"}
            </h3>
            <p className="text-slate-400 text-[13px] font-medium">{result.is_valid ? "Tanda tangan digital cocok — dokumen asli dan tidak dimodifikasi" : "Tanda tangan tidak cocok — dokumen mungkin telah diubah"}</p>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="glass-card p-6">
        <h3 className="text-white font-bold text-[14px] mb-3">Tentang Verifikasi ECDSA</h3>
        <div className="space-y-2.5 text-[13px] text-slate-500 font-medium">
          <p>• <span className="text-slate-300">ECDSA</span> (Elliptic Curve Digital Signature Algorithm) menggunakan kurva <span className="text-emerald-400">SECP256K1</span></p>
          <p>• Tanda tangan digital menjamin <span className="text-slate-300">authenticity</span> (keaslian), <span className="text-slate-300">integrity</span> (integritas), dan <span className="text-slate-300">non-repudiation</span></p>
          <p>• Proses verifikasi menggunakan <span className="text-slate-300">public key</span> untuk memastikan dokumen tidak dimodifikasi</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return <DashboardLayout><VerifyContent /></DashboardLayout>;
}
