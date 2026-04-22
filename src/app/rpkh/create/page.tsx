"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

const API = "http://localhost:8000/api";

interface DetailRow { petak: string; anak_petak: string; luas: string; jenis_tanaman: string; keterangan: string; }

function RpkhCreateContent() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ tahun_mulai: "2024", tahun_selesai: "2034", wilayah: "", kph: "", bkph: "", rph: "" });
  const [details, setDetails] = useState<DetailRow[]>([{ petak: "", anak_petak: "", luas: "", jenis_tanaman: "", keterangan: "" }]);

  const addRow = () => setDetails([...details, { petak: "", anak_petak: "", luas: "", jenis_tanaman: "", keterangan: "" }]);
  const removeRow = (i: number) => setDetails(details.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof DetailRow, value: string) => {
    const nd = [...details]; nd[i] = { ...nd[i], [field]: value }; setDetails(nd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/rpkh/create.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, details, token }),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert(`RPKH berhasil dibuat!\nSHA-256 Hash: ${data.hash}`);
        router.push("/rpkh");
      } else alert(data.message);
    } catch (e) { alert("Gagal terhubung ke server"); }
    finally { setLoading(false); }
  };

  const inputClass = "glass-input w-full px-4 py-3 text-[13px]";
  const labelClass = "block text-[11px] font-semibold text-slate-400 mb-2";

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 pb-6 border-b border-white/[0.04]">
        <Link href="/rpkh" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-slate-500 hover:text-white transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Tambah Data RPKH</h1>
          <p className="text-slate-500 text-[13px] font-medium mt-0.5">Rencana Pengaturan Kelestarian Hutan (Dokumen Induk)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className="glass-card p-7">
          <h3 className="text-white font-bold mb-5 flex items-center gap-2.5">
            <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/20">1</span>
            Identitas RPKH
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Tahun Mulai</label>
              <input type="number" className={inputClass} value={form.tahun_mulai} onChange={e => setForm({ ...form, tahun_mulai: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Tahun Selesai</label>
              <input type="number" className={inputClass} value={form.tahun_selesai} onChange={e => setForm({ ...form, tahun_selesai: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Wilayah</label>
              <input type="text" className={inputClass} value={form.wilayah} onChange={e => setForm({ ...form, wilayah: e.target.value })} placeholder="Jawa Barat dan Banten" required />
            </div>
            <div>
              <label className={labelClass}>KPH</label>
              <input type="text" className={inputClass} value={form.kph} onChange={e => setForm({ ...form, kph: e.target.value })} placeholder="KPH Bandung Utara" required />
            </div>
            <div>
              <label className={labelClass}>BKPH</label>
              <input type="text" className={inputClass} value={form.bkph} onChange={e => setForm({ ...form, bkph: e.target.value })} placeholder="BKPH Lembang" required />
            </div>
            <div>
              <label className={labelClass}>RPH</label>
              <input type="text" className={inputClass} value={form.rph} onChange={e => setForm({ ...form, rph: e.target.value })} placeholder="RPH Ciater" required />
            </div>
          </div>
        </div>

        {/* Detail Petak */}
        <div className="glass-card p-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold flex items-center gap-2.5">
              <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/20">2</span>
              Data Petak
            </h3>
            <button type="button" onClick={addRow} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
              <Plus size={14} /> Tambah Baris
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-900/40 border-b border-white/[0.04]">
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase w-8">#</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Petak</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Anak Petak</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Luas (Ha)</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Jenis Tanaman</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Keterangan</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {details.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td className="p-2 text-slate-500 font-mono text-xs text-center">{i + 1}</td>
                    <td className="p-2"><input className="glass-input w-full px-2.5 py-2 text-xs" value={row.petak} onChange={e => updateRow(i, 'petak', e.target.value)} placeholder="1A" /></td>
                    <td className="p-2"><input className="glass-input w-full px-2.5 py-2 text-xs" value={row.anak_petak} onChange={e => updateRow(i, 'anak_petak', e.target.value)} placeholder="a" /></td>
                    <td className="p-2"><input type="number" step="0.01" className="glass-input w-full px-2.5 py-2 text-xs" value={row.luas} onChange={e => updateRow(i, 'luas', e.target.value)} placeholder="0.00" /></td>
                    <td className="p-2"><input className="glass-input w-full px-2.5 py-2 text-xs" value={row.jenis_tanaman} onChange={e => updateRow(i, 'jenis_tanaman', e.target.value)} placeholder="Jati" /></td>
                    <td className="p-2"><input className="glass-input w-full px-2.5 py-2 text-xs" value={row.keterangan} onChange={e => updateRow(i, 'keterangan', e.target.value)} placeholder="-" /></td>
                    <td className="p-2">
                      {details.length > 1 && (
                        <button type="button" onClick={() => removeRow(i)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan RPKH</>}
        </button>
      </form>
    </div>
  );
}

export default function RpkhCreatePage() {
  return <DashboardLayout><RpkhCreateContent /></DashboardLayout>;
}
