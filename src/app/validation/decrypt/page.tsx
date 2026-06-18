"use client";

import { useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import { LockOpen, Lock, UploadCloud, Key, ShieldCheck, RefreshCw, Download, AlertTriangle } from "lucide-react";

const API = "http://localhost:8000/api";

function DecryptContent() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !privateKey) {
      setError("Silakan pilih file .enc dan masukkan Private Key.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("encrypted_file", file);
      formData.append("private_key", privateKey);

      const res = await fetch(`${API}/rtt/decrypt_file.php`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Handle file download
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Decrypted_${file.name.replace('.enc', '.json')}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        setSuccess(true);
      } else {
        const errText = await res.text();
        setError(errText || "Gagal melakukan dekripsi. Pastikan kunci yang digunakan benar.");
      }
    } catch (e: any) {
      setError("Terjadi kesalahan pada server saat dekripsi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[750px] mx-auto space-y-6 animate-fade-in pb-20">
      <div className="pb-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <LockOpen className="text-teal-400" /> Dekripsi Dokumen ECC (ECIES)
        </h1>
        <p className="text-slate-500 text-[13px] mt-1 font-medium">
          Kembalikan file .enc yang terenkripsi menjadi dokumen JSON asli menggunakan Private Key Anda.
        </p>
      </div>

      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/[0.03] to-transparent pointer-events-none" />
        
        <form onSubmit={handleDecrypt} className="space-y-6 relative z-10">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3">
              <ShieldCheck size={18} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[12px] font-bold">Dekripsi Berhasil!</p>
                <p className="text-[11px] font-medium opacity-80">Dokumen telah dikembalikan ke format aslinya dan otomatis diunduh ke komputer Anda.</p>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[12px] font-bold text-slate-300 uppercase tracking-wider">
              <UploadCloud size={14} className="text-teal-400" /> 1. Upload File Terenkripsi (.enc)
            </label>
            <div className="relative group cursor-pointer">
              <input 
                type="file" 
                required
                accept=".enc"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${file ? 'border-teal-500/50 bg-teal-500/5' : 'border-slate-700 bg-slate-800/30 group-hover:border-teal-500/30 group-hover:bg-slate-800/50'}`}>
                {file ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
                      <ShieldCheck size={24} />
                    </div>
                    <p className="text-[14px] font-bold text-white">{file.name}</p>
                    <p className="text-[11px] text-teal-400 font-medium">Siap untuk didekripsi ({(file.size / 1024).toFixed(1)} KB)</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/[0.04] text-slate-400 mx-auto flex items-center justify-center">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-[13px] font-medium text-slate-300">Klik atau seret file .enc ke area ini</p>
                    <p className="text-[11px] text-slate-500">Hanya mendukung format algoritma ECIES SECP256K1</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Private Key Input */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[12px] font-bold text-slate-300 uppercase tracking-wider">
              <Key size={14} className="text-teal-400" /> 2. Masukkan Private Key
            </label>
            <textarea 
              required
              rows={6}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="glass-input w-full px-4 py-3 text-[11px] font-mono leading-relaxed"
              placeholder={"-----BEGIN ENCRYPTED PRIVATE KEY-----\n...\n-----END ENCRYPTED PRIVATE KEY-----"}
            />
            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
              <Lock size={10} /> Private Key dikirim secara aman dan tidak akan disimpan di server.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading || !file || !privateKey}
              className="btn-primary w-full py-4 text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 border-none shadow-lg shadow-teal-500/20"
            >
              {loading ? (
                <><RefreshCw size={16} className="animate-spin" /> Membuka Gembok Kriptografi...</>
              ) : (
                <><LockOpen size={16} /> Dekripsi & Buka Dokumen</>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}

export default function DecryptPage() {
  return <DashboardLayout><DecryptContent /></DashboardLayout>;
}
