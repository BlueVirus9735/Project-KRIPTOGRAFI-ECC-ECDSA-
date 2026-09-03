"use client";
import { useState } from "react";
import {
  Lock, Unlock, Shield, ShieldCheck, Hash,
  FileText, Table, MapPin, TreePine, FileImage, ChevronDown, ChevronRight, Key, Sparkles, ExternalLink
} from "lucide-react";
import PrivateKeyModal from "./PrivateKeyModal";

const API = "http://localhost:8000/api";

interface EncryptedDocumentViewerProps {
  rttId: string;
  token: string;
  encContent?: any;
  ciphertextPreview?: string;
  ciphertextLength?: number;
  kphHash?: string;
  hasKphSignature?: boolean;
  hasPhwSignature?: boolean;
  encryptedFor?: string;
  onDecrypted?: (data: any) => void;
  mode?: "phw" | "divisi";
}

function SectionHeader({ icon, title, open, onToggle, isDecrypted }: {
  icon: React.ReactNode; title: string; open: boolean; onToggle: () => void; isDecrypted?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all ${
        isDecrypted
          ? "bg-emerald-50/70 dark:bg-emerald-500/5 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/15"
          : "bg-slate-100/90 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-bold text-[13px]">
        {icon}
        <span>{title}</span>
        {!isDecrypted && (
          <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/20">
            🔒 ENCRYPTED
          </span>
        )}
        {isDecrypted && (
          <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
            ✓ DECRYPTED
          </span>
        )}
      </div>
      {open ? <ChevronDown size={16} className="text-slate-500 dark:text-slate-400" /> : <ChevronRight size={16} className="text-slate-500 dark:text-slate-400" />}
    </button>
  );
}

function FieldCell({ label, value, isDecrypted, unit }: { label: string; value: any; isDecrypted: boolean; unit?: string }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-4 border-b border-slate-200/70 dark:border-white/[0.03] last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
      <span className="text-[12px] text-slate-600 dark:text-slate-400 font-medium w-[180px] shrink-0">{label}</span>
      <div className="mt-1 sm:mt-0">
        {!isDecrypted ? (
          <span className="font-mono text-[11px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 shadow-xs">
            <Lock size={10} className="text-amber-600 dark:text-amber-400 shrink-0" />
            {String(value)}
          </span>
        ) : (
          <span className="text-[13px] text-emerald-700 dark:text-emerald-300 font-semibold font-mono flex items-center gap-1">
            {String(value)} {unit ? <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{unit}</span> : ""}
          </span>
        )}
      </div>
    </div>
  );
}

export default function EncryptedDocumentViewer({
  rttId, token, encContent, ciphertextPreview, ciphertextLength = 0,
  kphHash, hasKphSignature, hasPhwSignature, encryptedFor,
  onDecrypted, mode = "phw"
}: EncryptedDocumentViewerProps) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [showRawPayload, setShowRawPayload] = useState(false);

  const [sections, setSections] = useState({
    identitas: true,
    summary: true,
    nett: true,
    rekap: true,
    ba: true,
    lampiran: true
  });

  const toggle = (s: keyof typeof sections) =>
    setSections(prev => ({ ...prev, [s]: !prev[s] }));

  const [userPrivateKey, setUserPrivateKey] = useState<string>("");
  const [viewingFilePath, setViewingFilePath] = useState<string | null>(null);

  const handleViewFile = async (filePath: string) => {
    if (!filePath) return;
    setViewingFilePath(filePath);
    try {
      const res = await fetch(`${API}/rtt/serve_file.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: filePath,
          token: token,
          key: userPrivateKey || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error("Gagal mengambil file (" + res.status + ")");
      }
      const blob = await res.blob();
      const fileUrl = URL.createObjectURL(blob);
      window.open(fileUrl, "_blank");
    } catch (err: any) {
      alert("Gagal membuka berkas terenkripsi: " + err.message);
    } finally {
      setViewingFilePath(null);
    }
  };

  const handleDecrypt = async (privateKey: string) => {
    setDecrypting(true);
    setShowKeyModal(false);
    try {
      const res = await fetch(`${API}/rtt/decrypt_view.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtt_id: rttId, token, private_key: privateKey }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setUserPrivateKey(privateKey);
        setDecryptedData(data);
        if (onDecrypted) onDecrypted(data);
      } else {
        alert("Gagal mendekripsi: " + data.message + (data.detail ? "\n\nDetail: " + data.detail : ""));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setDecrypting(false);
    }
  };

  const isDecrypted = !!decryptedData;

  // Active data source: decrypted values if unlocked, masked cipher values if locked
  const summary = isDecrypted ? decryptedData.summary : encContent?.masked_summary;
  const nett = isDecrypted ? decryptedData.nett : encContent?.masked_nett;
  const rekapKlem = isDecrypted ? decryptedData.rekap_klem : encContent?.masked_rekap;
  const beritaAcara = isDecrypted ? decryptedData.berita_acara : encContent?.masked_ba;
  const petaList = isDecrypted ? decryptedData.peta || [] : [];
  const petaBapList = isDecrypted ? decryptedData.peta_bap || [] : [];
  const lampiranList = isDecrypted ? decryptedData.lampiran || [] : [];


  return (
    <div className="space-y-4 animate-fade-in">
      {/* ========================================================= */}
      {/* 1. TOP STATUS BANNER (LOCKED vs UNLOCKED)                 */}
      {/* ========================================================= */}
      {!isDecrypted ? (
        <div className="glass-card border border-amber-300 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm dark:shadow-lg dark:shadow-black/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shrink-0">
              <Lock size={22} className="text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-amber-900 dark:text-amber-300 font-bold text-[14px]">Dokumen Terenkripsi (ECC ECIES)</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold uppercase">
                  Terkunci
                </span>
              </div>
              <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5">
                Teks isi tabel di bawah dalam bentuk <strong>Ciphertext</strong>. Hanya dapat dibuka menggunakan Private Key <span className="uppercase font-bold text-amber-800 dark:text-amber-300">{encryptedFor || mode}</span>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowKeyModal(true)}
            disabled={decrypting}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-extrabold text-[13px] transition-all shadow-md flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {decrypting ? (
              <><div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" /> Mendekripsi...</>
            ) : (
              <><Key size={16} /> Buka Dokumen (Input Private Key)</>
            )}
          </button>
        </div>
      ) : (
        <div className="glass-card border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-500/10 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm dark:shadow-lg dark:shadow-black/40 animate-slide-up">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
              <Unlock size={22} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-emerald-900 dark:text-emerald-300 font-bold text-[14px]">Dokumen Berhasil Didekripsi &amp; Terbuka</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                  Terbuka
                </span>
              </div>
              <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5">
                Kunci privat cocok! Seluruh nilai tabel di bawah telah ditransformasikan ke teks asli.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasKphSignature && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/25">
                <ShieldCheck size={13} className="text-emerald-700 dark:text-emerald-400" />
                <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-bold">ECDSA KPH: VALID</span>
              </div>
            )}
            {hasPhwSignature && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/15 border border-blue-300 dark:border-blue-500/25">
                <ShieldCheck size={13} className="text-blue-700 dark:text-blue-400" />
                <span className="text-[11px] text-blue-800 dark:text-blue-400 font-bold">ECDSA PHW: VALID</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. IDENTITAS DOKUMEN RTT                                  */}
      {/* ========================================================= */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.05]">
        <SectionHeader icon={<FileText size={15} />} title="Identitas Dokumen RTT" open={sections.identitas} onToggle={() => toggle("identitas")} isDecrypted={isDecrypted} />
        {sections.identitas && (
          <div className="p-2 space-y-0.5">
            <FieldCell
              label="Nomor Dokumen"
              value={isDecrypted ? (decryptedData?.rtt?.nomor_dokumen || encContent?.nomor_dokumen) : encContent?.masked_identitas?.nomor_dokumen}
              isDecrypted={isDecrypted}
            />
            <FieldCell
              label="Tanggal Dokumen"
              value={isDecrypted ? (decryptedData?.rtt?.tanggal || encContent?.tanggal) : encContent?.masked_identitas?.tanggal}
              isDecrypted={isDecrypted}
            />
            <FieldCell
              label="Kesatuan Pemangkuan Hutan (KPH)"
              value={isDecrypted ? (decryptedData?.rtt?.kph || encContent?.kph) : encContent?.masked_identitas?.kph}
              isDecrypted={isDecrypted}
            />
            <FieldCell
              label="Bagian Kesatuan Pemangkuan Hutan (BKPH)"
              value={isDecrypted ? (decryptedData?.rtt?.bkph || encContent?.bkph) : encContent?.masked_identitas?.bkph}
              isDecrypted={isDecrypted}
            />
            <FieldCell
              label="Resort Pemangkuan Hutan (RPH)"
              value={isDecrypted ? (decryptedData?.rtt?.rph || encContent?.rph) : encContent?.masked_identitas?.rph}
              isDecrypted={isDecrypted}
            />
            <FieldCell
              label="Status Dokumen"
              value={encContent?.status}
              isDecrypted={true}
            />
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 3. RINGKASAN TEBANGAN (SUMMARY)                          */}
      {/* ========================================================= */}
      {summary && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.05]">
          <SectionHeader icon={<Table size={15} />} title="Ringkasan Rencana Tebangan (Summary)" open={sections.summary} onToggle={() => toggle("summary")} isDecrypted={isDecrypted} />
          {sections.summary && (
            <div className="p-2 space-y-0.5">
              <FieldCell label="Bentuk Tebangan" value={summary.bentuk_tebangan} isDecrypted={isDecrypted} />
              <FieldCell label="Luas Area" value={summary.luas} isDecrypted={isDecrypted} unit="Ha" />
              <FieldCell label="Jenis Kayu" value={summary.jenis_kayu} isDecrypted={isDecrypted} />
              <FieldCell label="Kayu Perkakas" value={summary.kayu_perkakas} isDecrypted={isDecrypted} unit="m³" />
              <FieldCell label="Kayu Bakar" value={summary.kayu_bakar} isDecrypted={isDecrypted} unit="m³" />
              <FieldCell label="Jumlah Pohon" value={summary.jumlah_pohon} isDecrypted={isDecrypted} unit="Pohon" />
              <FieldCell label="Keterangan" value={summary.keterangan} isDecrypted={isDecrypted} />
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. DATA NETT (PERENCANAAN PETAK)                          */}
      {/* ========================================================= */}
      {nett && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.05]">
          <SectionHeader icon={<MapPin size={15} />} title="Rencana Petak (NETT)" open={sections.nett} onToggle={() => toggle("nett")} isDecrypted={isDecrypted} />
          {sections.nett && (
            <div className="p-2 space-y-0.5">
              <FieldCell label="Bagian Hutan" value={nett.bagian_hutan} isDecrypted={isDecrypted} />
              <FieldCell label="BKPH" value={nett.bkph} isDecrypted={isDecrypted} />
              <FieldCell label="RPH" value={nett.rph} isDecrypted={isDecrypted} />
              <FieldCell label="Nomor Petak" value={nett.petak} isDecrypted={isDecrypted} />
              <FieldCell label="Luas Baku" value={nett.luas_baku} isDecrypted={isDecrypted} unit="Ha" />
              <FieldCell label="Jenis Tanaman" value={nett.jenis_tanaman} isDecrypted={isDecrypted} />
              <FieldCell label="Kelas Hutan" value={nett.kelas_hutan} isDecrypted={isDecrypted} />
              <FieldCell label="Volume Kayu" value={nett.volume_kayu} isDecrypted={isDecrypted} unit="m³" />
              <FieldCell label="Tahun Tanam" value={nett.tahun_tanam} isDecrypted={isDecrypted} />
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TABEL REKAP KLEM                                       */}
      {/* ========================================================= */}
      {rekapKlem && rekapKlem.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.05]">
          <SectionHeader icon={<TreePine size={15} />} title={`Tabel Rekap Klem (${rekapKlem.length} Baris Data)`} open={sections.rekap} onToggle={() => toggle("rekap")} isDecrypted={isDecrypted} />
          {sections.rekap && (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-100/90 dark:bg-slate-900/60">
                    {["Petak", "Anak Petak", "Kelas Hutan", "Luas Rencana", "Jumlah Pohon", "Volume"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                  {rekapKlem.slice(0, 15).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        {!isDecrypted ? (
                          <span className="font-mono text-[10px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                            🔒 {row.petak}
                          </span>
                        ) : (
                          <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold">{row.petak}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isDecrypted ? (
                          <span className="font-mono text-[10px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                            🔒 {row.anak_petak}
                          </span>
                        ) : (
                          <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold">{row.anak_petak}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isDecrypted ? (
                          <span className="font-mono text-[10px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                            🔒 {row.kelas_hutan}
                          </span>
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300">{row.kelas_hutan}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isDecrypted ? (
                          <span className="font-mono text-[10px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                            🔒 {row.luas_rencana}
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-300 font-mono font-semibold">{row.luas_rencana} Ha</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isDecrypted ? (
                          <span className="font-mono text-[10px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                            🔒 {row.jumlah_pohon}
                          </span>
                        ) : (
                          <span className="text-slate-900 dark:text-slate-200 font-mono">{row.jumlah_pohon}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isDecrypted ? (
                          <span className="font-mono text-[10px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                            🔒 {row.volume}
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">{row.volume} m³</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rekapKlem.length > 15 && (
                <p className="text-[11px] text-slate-500 px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-white/[0.04]">
                  ...dan {rekapKlem.length - 15} baris data lainnya
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. BERITA ACARA PEMERIKSAAN                               */}
      {/* ========================================================= */}
      {beritaAcara && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.05]">
          <SectionHeader icon={<FileText size={15} />} title="Berita Acara Pemeriksaan (BAP)" open={sections.ba} onToggle={() => toggle("ba")} isDecrypted={isDecrypted} />
          {sections.ba && (
            <div className="p-2 space-y-0.5">
              <FieldCell label="Nama Petugas Pemeriksa" value={beritaAcara.nama_petugas} isDecrypted={isDecrypted} />
              <FieldCell label="Jabatan Petugas" value={beritaAcara.jabatan} isDecrypted={isDecrypted} />
              <FieldCell label="Tanggal Pemeriksaan" value={beritaAcara.tanggal} isDecrypted={isDecrypted} />
              <FieldCell label="Hasil Pemeriksaan" value={beritaAcara.hasil_pemeriksaan} isDecrypted={isDecrypted} />
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. LAMPIRAN FILE & PETA                                   */}
      {/* ========================================================= */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.05]">
        <SectionHeader icon={<FileImage size={15} />} title="Lampiran File &amp; Peta Spasial" open={sections.lampiran} onToggle={() => toggle("lampiran")} isDecrypted={isDecrypted} />
        {sections.lampiran && (
          <div className="p-4 space-y-2">
            {!isDecrypted ? (
              <div className="space-y-2">
                {encContent?.masked_files && encContent.masked_files.length > 0 ? (
                  encContent.masked_files.map((f: any, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <FileImage size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-slate-900 dark:text-white">{f.tipe}</span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">({f.nama_file})</span>
                          </div>
                          <p className="font-mono text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">🔒 {f.cipher}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 px-2.5 py-1 rounded-md border border-amber-300 dark:border-amber-500/25 shrink-0">
                        🔒 TERENKRIPSI ECC
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[12px] text-slate-500 py-3 text-center">Tidak ada berkas peta atau lampiran pada dokumen ini.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {petaList.map((p: any, i: number) => (
                  <div key={'peta-' + i} className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <FileImage size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[12px] font-bold text-emerald-950 dark:text-emerald-200">Peta Lokasi Tebangan {p.bagian_hutan ? `— ${p.bagian_hutan}` : ''}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{p.file_path ? p.file_path.split('/').pop()?.replace('.enc', '') : 'peta.pdf'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-200 dark:border-transparent">TERVERIFIKASI</span>
                      {p.file_path && (
                        <button
                          type="button"
                          onClick={() => handleViewFile(p.file_path)}
                          disabled={viewingFilePath === p.file_path}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {viewingFilePath === p.file_path ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ExternalLink size={12} />
                          )}
                          Lihat File
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {petaBapList.map((pb: any, i: number) => (
                  <div key={'bap-' + i} className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileImage size={18} className="text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[12px] font-bold text-emerald-200">Peta Berita Acara Pemeriksaan (BAP)</p>
                        <p className="text-[11px] text-slate-400 font-mono">{pb.file_path ? pb.file_path.split('/').pop()?.replace('.enc', '') : 'peta_bap.pdf'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2.5 py-1 rounded">TERVERIFIKASI</span>
                      {pb.file_path && (
                        <button
                          type="button"
                          onClick={() => handleViewFile(pb.file_path)}
                          disabled={viewingFilePath === pb.file_path}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {viewingFilePath === pb.file_path ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ExternalLink size={12} />
                          )}
                          Lihat File
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {lampiranList.map((l: any, i: number) => (
                  <div key={'lamp-' + i} className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[12px] font-bold text-emerald-200">{l.judul || "Lampiran Dokumen"}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{l.file_path ? l.file_path.split('/').pop()?.replace('.enc', '') : 'lampiran.pdf'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2.5 py-1 rounded">TERVERIFIKASI</span>
                      {l.file_path && (
                        <button
                          type="button"
                          onClick={() => handleViewFile(l.file_path)}
                          disabled={viewingFilePath === l.file_path}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {viewingFilePath === l.file_path ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ExternalLink size={12} />
                          )}
                          Lihat File
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 8. COLLAPSIBLE RAW CIPHERTEXT PAYLOAD (SKRIPSI / AUDIT)    */}
      {/* ========================================================= */}
      <div className="border-t border-white/[0.05] pt-3">
        <button
          type="button"
          onClick={() => setShowRawPayload(!showRawPayload)}
          className="text-[11px] text-slate-500 hover:text-slate-300 font-mono flex items-center gap-1.5 transition-colors"
        >
          <Hash size={12} />
          {showRawPayload ? "Sembunyikan Raw Ciphertext Payload (Base64)" : "Lihat Raw Ciphertext Payload (Base64 ECIES — Pembuktian Kriptografi)"}
        </button>

        {showRawPayload && (
          <div className="mt-3 p-4 rounded-xl bg-black/60 border border-white/[0.05] space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Algoritma: ECIES (ECDH NIST P-256 + HKDF SHA-256 + AES-GCM 256)</span>
              <span>Panjang: {ciphertextLength} karakter</span>
            </div>
            <pre className="font-mono text-[10px] text-emerald-400/70 break-all whitespace-pre-wrap max-h-[140px] overflow-y-auto">
              {ciphertextPreview || "—"}
            </pre>
            {kphHash && (
              <p className="text-[10px] text-slate-500 font-mono">
                SHA-256 Hash KPH: {kphHash}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal Input Private Key */}
      <PrivateKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onConfirm={handleDecrypt}
        title={`Buka Dokumen dengan Private Key ${mode === "divisi" ? "Divisi" : "PHW"}`}
        description={`Masukkan atau unggah file private key (.pem) milik ${mode === "divisi" ? "Kepala Divisi" : "PHW"} untuk mendekripsi nilai-nilai tabel dan membuka seluruh isi dokumen RTT ini.`}
        actionLabel="Dekripsi & Buka Isi Dokumen"
        loading={decrypting}
      />
    </div>
  );
}
