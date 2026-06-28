"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Shield, CheckCircle, XCircle, Upload, FileKey } from "lucide-react";

const API = "http://localhost:8000/api";

function VerifyContent() {
  const [docFile, setDocFile] = useState<File | null>(null);
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [pubKeyFile, setPubKeyFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !sigFile || !pubKeyFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("document", docFile);
    formData.append("signature", sigFile);
    formData.append("public_key", pubKeyFile);

    try {
      const response = await fetch(`${API}/verify.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("Gagal terhubung ke backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 animate-fade-in">
      <div className="pb-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold text-white">Verifikasi Digital</h1>
        <p className="text-slate-500 text-[13px] mt-1 font-medium">
          Verifikasi keaslian data RTT menggunakan ECDSA
        </p>
      </div>

      <div className="glass-card p-7">
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase">
                1. Sertifikat Data (.json)
              </label>
              <div
                className={`relative border rounded-xl p-6 text-center transition-all cursor-pointer h-[160px] flex items-center justify-center ${docFile ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/[0.08] bg-slate-900/30 hover:border-emerald-500/20 hover:bg-slate-900/50"}`}
              >
                <input
                  type="file"
                  id="doc-upload"
                  className="hidden"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="doc-upload"
                  className="cursor-pointer flex flex-col items-center gap-3 w-full"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${docFile ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-500"}`}
                  >
                    <Upload size={18} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-300 line-clamp-2 px-2">
                    {docFile ? docFile.name : "Pilih Sertifikat .json"}
                  </span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase">
                2. File Signature (.sig)
              </label>
              <div
                className={`relative border rounded-xl p-6 text-center transition-all cursor-pointer h-[160px] flex items-center justify-center ${sigFile ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/[0.08] bg-slate-900/30 hover:border-emerald-500/20 hover:bg-slate-900/50"}`}
              >
                <input
                  type="file"
                  id="sig-upload"
                  className="hidden"
                  onChange={(e) => setSigFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="sig-upload"
                  className="cursor-pointer flex flex-col items-center gap-3 w-full"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${sigFile ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-500"}`}
                  >
                    <FileKey size={18} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-300 line-clamp-2 px-2">
                    {sigFile ? sigFile.name : "Pilih .sig"}
                  </span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase">
                3. File Public Key (.pem)
              </label>
              <div
                className={`relative border rounded-xl p-6 text-center transition-all cursor-pointer h-[160px] flex items-center justify-center ${pubKeyFile ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/[0.08] bg-slate-900/30 hover:border-emerald-500/20 hover:bg-slate-900/50"}`}
              >
                <input
                  type="file"
                  id="pub-upload"
                  className="hidden"
                  onChange={(e) => setPubKeyFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="pub-upload"
                  className="cursor-pointer flex flex-col items-center gap-3 w-full"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${pubKeyFile ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-500"}`}
                  >
                    <Shield size={18} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-300 line-clamp-2 px-2">
                    {pubKeyFile ? pubKeyFile.name : "Pilih .pem"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!docFile || !sigFile || !pubKeyFile || loading}
            className="btn-primary w-full py-4 text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Memverifikasi ECDSA...
              </>
            ) : (
              <>
                <Shield size={16} /> Jalankan Verifikasi
              </>
            )}
          </button>
        </form>

        {result && (
          <div
            className={`mt-6 p-7 rounded-2xl text-center animate-scale-in ${result.is_valid ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}
          >
            {result.is_valid ? (
              <CheckCircle
                size={48}
                className="text-emerald-400 mx-auto mb-4"
              />
            ) : (
              <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            )}
            <h3
              className={`text-2xl font-extrabold mb-2 ${result.is_valid ? "text-emerald-400" : "text-red-400"}`}
            >
              {result.is_valid ? "DATA VALID ✓" : "DATA TIDAK VALID ✗"}
            </h3>
            <p className="text-slate-400 text-[13px] font-medium">
              {result.is_valid
                ? "Isi sertifikat data cocok dengan tanda tangan — data asli dan tidak dimodifikasi"
                : "Tanda tangan tidak cocok — data mungkin telah diubah"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <DashboardLayout>
      <VerifyContent />
    </DashboardLayout>
  );
}
