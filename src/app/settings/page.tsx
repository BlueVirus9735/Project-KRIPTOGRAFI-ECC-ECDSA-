"use client";
import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import {
  Key, Download, CheckCircle, AlertCircle, RefreshCw,
  ShieldCheck, Copy, Eye, EyeOff, Info, Clock, XCircle
} from "lucide-react";

const API = "http://localhost:8000/api";

async function generateECKeyPair(): Promise<{ privateKeyPem: string; publicKeyPem: string }> {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  const privateKeyDer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const privateKeyB64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyDer)));
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyB64.match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----`;

  const publicKeyDer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyDer)));
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyB64.match(/.{1,64}/g)!.join("\n")}\n-----END PUBLIC KEY-----`;

  return { privateKeyPem, publicKeyPem };
}

function SettingsContent() {
  const { user, token } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState("");
  const [generatedPublicKey, setGeneratedPublicKey] = useState("");
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Server state
  const [currentPublicKey, setCurrentPublicKey] = useState<string | null>(null);
  const [pendingPublicKey, setPendingPublicKey] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = () => {
    setLoadingProfile(true);
    fetch(`${API}/auth/me.php?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === "success" && d.user) {
          setCurrentPublicKey(d.user.public_key || null);
          setPendingPublicKey(d.user.pending_public_key || null);
          setKeyStatus(d.user.key_status || (d.user.public_key ? "approved" : "none"));
        }
      })
      .finally(() => setLoadingProfile(false));
  };

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const handleGenerate = async () => {
    setGenerating(true);
    setSaved(false);
    try {
      const { privateKeyPem, publicKeyPem } = await generateECKeyPair();
      setGeneratedPrivateKey(privateKeyPem);
      setGeneratedPublicKey(publicKeyPem);
    } catch (e: any) {
      alert("Gagal generate key pair: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPrivateKey = () => {
    if (!generatedPrivateKey) return;
    const blob = new Blob([generatedPrivateKey], { type: "application/x-pem-file" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `private_key_${user?.username || "user"}_${Date.now()}.pem`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePublicKey = async () => {
    if (!generatedPublicKey) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/update_public_key.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, public_key: generatedPublicKey }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setSaved(true);
        fetchProfile();
        alert(
          data.key_status === "approved"
            ? "✅ Public key berhasil diaktifkan!"
            : "📨 Pengajuan berhasil dikirim!\n\nPublic Key kamu telah dikirim ke Administrator (Otoritas CA) untuk diverifikasi. Kunci akan aktif setelah disetujui."
        );
      } else {
        alert("Gagal: " + data.message);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPublicKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleLabel: Record<string, string> = {
    kph: "KPH (Kepala KPH / Tata Usaha)",
    phw: "PHW (Pemeriksa / Verifikator)",
    divisi: "Kepala Divisi",
    admin: "Administrator",
    sysadmin: "System Administrator (Otoritas CA)",
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-6 animate-fade-in">
      <div className="pb-6 border-b border-slate-200 dark:border-white/[0.04]">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Key className="text-amber-500" size={22} /> Manajemen Key Kriptografi
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-[13px] mt-1 font-medium">
          Generate dan kelola ECC key pair untuk enkripsi dan tanda tangan digital dokumen RTT
        </p>
      </div>

      {/* Info pengguna & Status Kunci */}
      <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-900 dark:text-white font-bold text-[15px]">{user?.nama || user?.username || "—"}</p>
            <p className="text-slate-600 dark:text-slate-400 text-[12px]">{roleLabel[user?.role || ""] || user?.role}</p>
          </div>
        </div>

        <div>
          {loadingProfile ? (
            <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          ) : keyStatus === "approved" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 font-bold text-[11px]">
              <CheckCircle size={13} /> Kunci Aktif &amp; Terverifikasi
            </div>
          ) : keyStatus === "pending" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 font-bold text-[11px]">
              <Clock size={13} className="animate-spin" /> Menunggu Persetujuan Admin (CA)
            </div>
          ) : keyStatus === "rejected" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300 font-bold text-[11px]">
              <XCircle size={13} /> Pengajuan Kunci Ditolak
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 text-[11px]">
              <AlertCircle size={13} /> Belum Ada Kunci Terdaftar
            </div>
          )}
        </div>
      </div>

      {/* Notice jika Pending */}
      {keyStatus === "pending" && (
        <div className="glass-card p-5 border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 flex items-start gap-3">
          <Clock size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-amber-800 dark:text-amber-300 font-bold text-[13px]">Permohonan Kunci Sedang Diverifikasi</p>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Kamu telah mengajukan Public Key baru. Untuk mencegah pembajakan akun dan penyamaran identitas, 
              kunci ini harus disetujui terlebih dahulu oleh <strong className="text-slate-900 dark:text-white">Administrator (Otoritas CA)</strong> sebelum 
              dapat digunakan untuk menandatangani atau membuka dokumen terenkripsi.
            </p>
          </div>
        </div>
      )}

      {/* Instruksi CA */}
      <div className="glass-card p-5 border border-blue-200 dark:border-blue-500/15 bg-blue-50 dark:bg-blue-500/5">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <p className="text-blue-800 dark:text-blue-300 font-bold text-[13px]">Prinsip Otoritas Kunci (Certificate Authority)</p>
            <ol className="text-[12px] text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
              <li>Generate sepasang kunci ECC (ECDSA P-256) baru secara lokal di browser kamu</li>
              <li><strong className="text-amber-700 dark:text-amber-300">Download dan simpan Private Key (.pem)</strong> di laptop pribadi kamu (jangan sampai hilang)</li>
              <li>Ajukan Public Key ke Administrator. Administrator akan memverifikasi identitasmu sebelum mengaktifkan kunci</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="glass-card p-7">
        <h3 className="text-slate-900 dark:text-white font-bold text-[15px] mb-4 flex items-center gap-2">
          <RefreshCw size={16} className="text-blue-500" /> Generate Key Pair Baru
        </h3>
        {keyStatus === "approved" && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/15">
            <p className="text-amber-800 dark:text-amber-300 text-[12px]">
              ⚠️ Kamu sudah memiliki kunci aktif. Jika men-generate dan mengajukan kunci baru, kunci baru harus diverifikasi ulang oleh Administrator sebelum aktif menggantikan kunci lama.
            </p>
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary px-6 py-3 text-[13px] font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menghasilkan Kunci...</>
          ) : (
            <><Key size={16} /> Generate Key Pair Baru</>
          )}
        </button>
      </div>

      {/* Hasil generate */}
      {generatedPrivateKey && (
        <div className="space-y-4 animate-slide-up">
          {/* Private Key */}
          <div className="glass-card p-6 border border-red-200 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-red-800 dark:text-red-300 font-bold text-[14px] flex items-center gap-2">
                🔑 Private Key — RAHASIA PRIBADI
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setShowPrivKey(!showPrivKey)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
                  {showPrivKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={handleDownloadPrivateKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 border border-red-200 text-red-800 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30 text-[12px] font-bold transition-colors">
                  <Download size={13} /> Download .pem
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-black/40 rounded-xl p-4 border border-slate-200 dark:border-red-500/10">
              <pre className="font-mono text-[10px] text-red-900 dark:text-red-300/80 break-all whitespace-pre-wrap">
                {showPrivKey ? generatedPrivateKey : generatedPrivateKey.replace(/[^\n]/g, "•")}
              </pre>
            </div>
            <p className="text-red-700 dark:text-red-400/70 text-[11px] mt-2 font-medium">
              ⚠️ Simpan private key ini di perangkat lokalmu. Server TIDAK PERNAH menyimpannya. Kunci ini digunakan untuk membuka dokumen dan menandatangani file.
            </p>
          </div>

          {/* Public Key */}
          <div className="glass-card p-6 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-emerald-800 dark:text-emerald-300 font-bold text-[14px]">🔓 Public Key Baru (Siap Diajukan)</h3>
              <button onClick={() => handleCopyPublicKey(generatedPublicKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-[12px] font-bold transition-colors">
                <Copy size={13} /> {copied ? "Tersalin!" : "Salin"}
              </button>
            </div>
            <div className="bg-white dark:bg-black/40 rounded-xl p-4 border border-slate-200 dark:border-emerald-500/10">
              <pre className="font-mono text-[10px] text-emerald-900 dark:text-emerald-300/70 break-all whitespace-pre-wrap">{generatedPublicKey}</pre>
            </div>

            <button
              onClick={handleSavePublicKey}
              disabled={saving || saved}
              className="mt-4 w-full btn-primary py-3 text-[13px] font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengirim Pengajuan...</>
              ) : saved ? (
                <><CheckCircle size={15} /> Pengajuan Terkirim!</>
              ) : (
                <><ShieldCheck size={15} /> Ajukan Public Key ke Administrator (CA)</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Current public key */}
      {currentPublicKey && !generatedPublicKey && keyStatus === "approved" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-900 dark:text-slate-300 font-bold text-[14px]">Public Key Aktif &amp; Terverifikasi</h3>
            <button onClick={() => handleCopyPublicKey(currentPublicKey)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white text-[12px] font-bold transition-colors">
              <Copy size={13} /> {copied ? "Tersalin!" : "Salin"}
            </button>
          </div>
          <div className="bg-slate-50 dark:bg-black/40 rounded-xl p-4 border border-slate-200 dark:border-white/[0.04]">
            <pre className="font-mono text-[10px] text-slate-800 dark:text-slate-400 break-all whitespace-pre-wrap">{currentPublicKey}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return <DashboardLayout><SettingsContent /></DashboardLayout>;
}
