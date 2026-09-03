"use client";
import { useState, useRef } from "react";
import { Key, Lock, X, ShieldCheck, Upload, FileText } from "lucide-react";

interface PrivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (privateKey: string) => void;
  title: string;
  description: string;
  actionLabel?: string;
  loading?: boolean;
}

export default function PrivateKeyModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionLabel = "Konfirmasi",
  loading = false,
}: PrivateKeyModalProps) {
  const [privateKey, setPrivateKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const cleanKey = privateKey.trim();
    if (!cleanKey) {
      alert("Private key tidak boleh kosong!");
      return;
    }
    if (!cleanKey.includes("-----BEGIN") || !cleanKey.includes("PRIVATE KEY-----")) {
      alert("Format private key tidak valid! Pastikan mengandung '-----BEGIN PRIVATE KEY-----' atau '-----BEGIN EC PRIVATE KEY-----'.");
      return;
    }
    onConfirm(cleanKey);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPrivateKey(content.trim());
      }
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setPrivateKey("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-amber-500/25 rounded-2xl p-7 w-full max-w-lg shadow-2xl shadow-black/80 animate-fade-in space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Key size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-[15px]">{title}</h3>
              <p className="text-slate-500 text-[11px]">Kriptografi ECC (ECDSA / ECIES)</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning / Description */}
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
          <p className="text-amber-300 text-[12px] leading-relaxed">{description}</p>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium">
            Private key hanya digunakan sesaat dalam memory untuk kalkulasi kriptografi dan tidak disimpan di server.
          </span>
        </div>

        {/* Key Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Private Key (.pem)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Upload size={12} /> Unggah File .pem
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pem,.key,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <textarea
            className="glass-input w-full px-4 py-3 text-[11px] font-mono h-[160px] resize-none focus:border-amber-400/50"
            placeholder={"Tempel isi private key di sini atau klik 'Unggah File .pem' di atas:\n\n-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            spellCheck={false}
          />
          {privateKey && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <FileText size={12} />
              <span>Private key terisi ({privateKey.length} karakter)</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-[13px] font-semibold transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !privateKey.trim()}
            className="flex-1 py-2.5 rounded-xl btn-primary text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
            ) : (
              <><Lock size={14} /> {actionLabel}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
