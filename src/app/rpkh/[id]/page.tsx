"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { ArrowLeft, Hash, FileText, BookOpen } from "lucide-react";

const API = "http://localhost:8000/api";

function RpkhDetailContent() {
  const params = useParams();
  const id = params.id;
  const [rpkh, setRpkh] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [rttList, setRttList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    if (!privateKey) { alert("Masukkan private key"); return; }
    setSigning(true);
    try {
      const res = await fetch(`${API}/rpkh/sign.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rpkh_id: id, private_key: privateKey })
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("RPKH berhasil ditandatangani!");
        setShowSignModal(false);
        window.location.reload();
      } else alert(data.message);
    } catch (e) { alert("Gagal terhubung ke server"); }
    finally { setSigning(false); }
  };

  useEffect(() => {
    fetch(`${API}/rpkh/detail.php?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === "success") {
          setRpkh(data.data);
          setDetails(data.details || []);
          setRttList(data.rtt_list || []);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" /></div>;
  if (!rpkh) return <div className="text-center text-slate-500 py-20 font-medium">RPKH tidak ditemukan</div>;

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 pb-6 border-b border-white/[0.04]">
        <Link href="/rpkh" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-slate-500 hover:text-white transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Detail RPKH</h1>
          <p className="text-slate-500 text-[13px] font-medium">{rpkh.wilayah} ({rpkh.tahun_mulai}–{rpkh.tahun_selesai})</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <div className="glass-card p-5">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">KPH</p>
          <p className="text-white font-semibold text-[14px]">{rpkh.kph}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">BKPH / RPH</p>
          <p className="text-white font-semibold text-[14px]">{rpkh.bkph} / {rpkh.rph}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Keterangan</p>
          <p className="text-white font-medium text-[13px] break-words">{rpkh.keterangan || '-'}</p>
        </div>
        <div className="glass-card p-5 sm:col-span-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">SHA-256 Hash & Signature</p>
            {rpkh.signature ? (
              <span className="status-badge text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Signed ✓</span>
            ) : (
              <button onClick={() => setShowSignModal(true)} className="btn-primary text-[10px] px-2 py-1 flex items-center gap-1 rounded hover:bg-emerald-500 transition-colors bg-emerald-600 font-bold text-white"><Hash size={12}/> Sign RPKH</button>
            )}
          </div>
          <p className="text-emerald-400 font-mono text-[12px] break-all mb-2">{rpkh.hash || 'N/A'}</p>
          {rpkh.signature && <p className="text-teal-400 font-mono text-[11px] break-all border-t border-white/[0.04] pt-2">{rpkh.signature}</p>}
        </div>
      </div>

      {/* Detail Petak Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.04]">
          <h3 className="text-white font-semibold flex items-center gap-2"><BookOpen size={16} className="text-blue-400" /> Data Petak ({details.length} records)</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-900/40">
            <tr>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">#</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Petak</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Anak Petak</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Luas (Ha)</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Jenis Tanaman</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Kelas Hutan</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">BON</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">KBD</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">DKN</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">N/Ha</th>
              <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {details.map((d, i) => (
              <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3.5 text-[12px] text-slate-500">{i + 1}</td>
                <td className="p-3.5 text-[13px] text-slate-200 font-medium">{d.petak}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{d.anak_petak}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{Number(d.luas).toFixed(2)}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{d.jenis_tanaman}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{d.kelas_hutan || '-'}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{d.bon || '-'}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{d.kbd || '-'}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{d.dkn || '-'}</td>
                <td className="p-3.5 text-[13px] text-slate-400">{d.n_per_ha || '-'}</td>
                <td className="p-3.5 text-[13px] text-slate-500">{d.keterangan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Related RTT */}
      {rttList.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h3 className="text-white font-semibold flex items-center gap-2"><FileText size={16} className="text-emerald-400" /> RTT Terkait ({rttList.length})</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {rttList.map(rtt => (
              <Link key={rtt.id} href={`/rtt/${rtt.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors group">
                <div>
                  <span className="text-[13px] text-slate-200 font-medium group-hover:text-emerald-400 transition-colors">{rtt.nomor_dokumen}</span>
                  <span className="text-[12px] text-slate-500 ml-3">{rtt.tanggal}</span>
                </div>
                <span className="status-badge text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{rtt.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modal Sign */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-card p-8 max-w-lg w-full shadow-2xl relative animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-2">Tandatangani RPKH</h3>
            <p className="text-slate-400 text-sm mb-6">Masukkan Private Key Anda (.pem) untuk membubuhkan tanda tangan digital ECDSA ke dalam dokumen RPKH.</p>
            <div className="space-y-4">
              <textarea 
                value={privateKey} onChange={e => setPrivateKey(e.target.value)}
                className="glass-input w-full px-4 py-3 text-[13px] min-h-[150px] font-mono"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowSignModal(false)} className="btn-secondary px-5 py-2 text-sm">Batal</button>
                <button onClick={handleSign} disabled={signing} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                  {signing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</> : "Tandatangani"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RpkhDetailPage() {
  return <DashboardLayout><RpkhDetailContent /></DashboardLayout>;
}
