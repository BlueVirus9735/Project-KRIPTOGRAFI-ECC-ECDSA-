"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, Send, CheckCircle } from "lucide-react";

const API = "http://localhost:8000/api";

const STEPS = ["Identitas", "SK", "Keputusan", "Tebangan", "Rekap", "Peta", "Berita Acara", "Lampiran", "Pengesahan"];

function RttCreateContent() {
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [rttId, setRttId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [rpkhList, setRpkhList] = useState<any[]>([]);
  const [selectedRpkh, setSelectedRpkh] = useState<any>(null);

  // Form states
  const [identitas, setIdentitas] = useState({ rpkh_id: "", nomor_dokumen: "", tanggal: new Date().toISOString().split('T')[0], kph: "", bkph: "", rph: "" });
  const [sk, setSk] = useState({ nomor_sk: "", tanggal_sk: "", tentang: "" });
  const [keputusan, setKeputusan] = useState({ menimbang: "", mengingat: "", memutuskan: "" });
  const [tebangan, setTebangan] = useState<any[]>([{ petak: "", anak_petak: "", luas: "", jenis_tanaman: "", volume: "", jumlah_pohon: "", keterangan: "" }]);
  const [beritaAcara, setBeritaAcara] = useState<any[]>([{ tanggal: "", nama_petugas: "", jabatan: "", hasil_pemeriksaan: "" }]);
  const [pengesahan, setPengesahan] = useState<any[]>([{ nama_pejabat: "", jabatan: "", npk: "", tanggal: "" }]);
  const [petaFile, setPetaFile] = useState<File | null>(null);
  const [lampiranFile, setLampiranFile] = useState<File | null>(null);
  const [lampiranJudul, setLampiranJudul] = useState('');
  const [lampiranKeterangan, setLampiranKeterangan] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('rtt_draft');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.identitas) setIdentitas(data.identitas);
      if (data.sk) setSk(data.sk);
      if (data.keputusan) setKeputusan(data.keputusan);
      if (data.tebangan) setTebangan(data.tebangan);
      if (data.beritaAcara) setBeritaAcara(data.beritaAcara);
      if (data.pengesahan) setPengesahan(data.pengesahan);
      if (data.step) setStep(data.step);
      if (data.rttId) setRttId(data.rttId);
    }
    fetch(`${API}/rpkh/list.php`).then(r => r.json()).then(d => { if (d.status === "success") setRpkhList(d.data || []); });
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const data = { identitas, sk, keputusan, tebangan, beritaAcara, pengesahan, step, rttId };
    localStorage.setItem('rtt_draft', JSON.stringify(data));
  }, [identitas, sk, keputusan, tebangan, beritaAcara, pengesahan, step, rttId]);

  // Auto-fill from RPKH
  useEffect(() => {
    if (identitas.rpkh_id) {
      const rpkh = rpkhList.find(r => r.id == identitas.rpkh_id);
      if (rpkh) {
        setSelectedRpkh(rpkh);
        setIdentitas(prev => ({ ...prev, kph: rpkh.kph, bkph: rpkh.bkph, rph: rpkh.rph }));
      }
    }
  }, [identitas.rpkh_id, rpkhList]);

  // Calculated rekap
  const totalLuas = tebangan.reduce((s, t) => s + (parseFloat(t.luas) || 0), 0);
  const totalVolume = tebangan.reduce((s, t) => s + (parseFloat(t.volume) || 0), 0);
  const totalPohon = tebangan.reduce((s, t) => s + (parseInt(t.jumlah_pohon) || 0), 0);

  const handleCreateRtt = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/rtt/create.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identitas, token }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setRttId(data.rtt_id);
        setStep(1);
      } else alert(data.message);
    } catch (e) { alert("Gagal terhubung ke server"); }
    finally { setLoading(false); }
  };

  const validateForm = () => {
    if (!identitas.rpkh_id || !identitas.nomor_dokumen || !identitas.tanggal || !identitas.kph || !identitas.bkph || !identitas.rph) {
      return "Harap lengkapi semua data pada tab Identitas.";
    }
    if (!sk.nomor_sk || !sk.tanggal_sk || !sk.tentang) {
      return "Harap lengkapi semua data pada tab SK.";
    }
    if (!keputusan.menimbang || !keputusan.mengingat || !keputusan.memutuskan) {
      return "Harap lengkapi semua data pada tab Keputusan.";
    }
    if (tebangan.length === 0 || !tebangan[0].petak || !tebangan[0].luas || !tebangan[0].volume) {
      return "Harap isi minimal 1 baris data Tebangan yang valid (Petak, Luas, Volume wajib diisi).";
    }
    if (beritaAcara.length === 0 || !beritaAcara[0].tanggal || !beritaAcara[0].nama_petugas || !beritaAcara[0].jabatan || !beritaAcara[0].hasil_pemeriksaan) {
      return "Harap isi minimal 1 baris Berita Acara yang valid.";
    }
    if (pengesahan.length === 0 || !pengesahan[0].nama_pejabat || !pengesahan[0].jabatan || !pengesahan[0].npk || !pengesahan[0].tanggal) {
      return "Harap isi minimal 1 baris Pengesahan yang valid.";
    }
    return null;
  };

  const handleSaveAll = async (submit = false) => {
    if (!rttId) return;

    if (submit) {
      const errorMsg = validateForm();
      if (errorMsg) {
        alert("Gagal submit: " + errorMsg);
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Upload files first if any
      if (petaFile) {
        const pForm = new FormData();
        pForm.append('file', petaFile);
        pForm.append('rtt_id', rttId.toString());
        pForm.append('type', 'peta');
        pForm.append('token', token || '');
        await fetch(`${API}/rtt/upload_file.php`, { method: 'POST', body: pForm });
      }
      if (lampiranFile) {
        const lForm = new FormData();
        lForm.append('file', lampiranFile);
        lForm.append('rtt_id', rttId.toString());
        lForm.append('type', 'lampiran');
        lForm.append('token', token || '');
        lForm.append('judul', lampiranJudul);
        lForm.append('keterangan', lampiranKeterangan);
        await fetch(`${API}/rtt/upload_file.php`, { method: 'POST', body: lForm });
      }

      // 2. Save text data
      const res = await fetch(`${API}/rtt/save_all.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtt_id: rttId, token, identitas, sk, keputusan, tebangan, berita_acara: beritaAcara, pengesahan }),
      });
      const data = await res.json();
      if (data.status === "success") {
        if (submit) {
          localStorage.removeItem('rtt_draft'); // Clear draft
          alert(`Draft awal RTT berhasil dibuat. Silakan lengkapi 8 Modul Data di halaman Workspace RTT.`);
          router.push(`/rtt/${rttId}`);
        } else {
          alert(`Data RTT berhasil disimpan!`);
        }
      } else alert("Gagal update data: " + data.message);
    } catch (e: any) { alert("Terjadi kesalahan jaringan saat menyimpan: " + e.message); }
    finally { setLoading(false); }
  };

  const inputClass = "glass-input w-full px-4 py-3 text-[13px]";
  const labelClass = "block text-[11px] font-semibold text-slate-400 mb-2";
  const textareaClass = inputClass + " min-h-[100px] resize-y";

  const addTebangan = () => setTebangan([...tebangan, { petak: "", anak_petak: "", luas: "", jenis_tanaman: "", volume: "", jumlah_pohon: "", keterangan: "" }]);
  const removeTebangan = (i: number) => setTebangan(tebangan.filter((_, idx) => idx !== i));
  const updateTebangan = (i: number, field: string, value: string) => { const n = [...tebangan]; n[i] = { ...n[i], [field]: value }; setTebangan(n); };

  const addBA = () => setBeritaAcara([...beritaAcara, { tanggal: "", nama_petugas: "", jabatan: "", hasil_pemeriksaan: "" }]);
  const removeBA = (i: number) => setBeritaAcara(beritaAcara.filter((_, idx) => idx !== i));
  const updateBA = (i: number, field: string, value: string) => { const n = [...beritaAcara]; n[i] = { ...n[i], [field]: value }; setBeritaAcara(n); };

  const addPeng = () => setPengesahan([...pengesahan, { nama_pejabat: "", jabatan: "", npk: "", tanggal: "" }]);
  const removePeng = (i: number) => setPengesahan(pengesahan.filter((_, idx) => idx !== i));
  const updatePeng = (i: number, field: string, value: string) => { const n = [...pengesahan]; n[i] = { ...n[i], [field]: value }; setPengesahan(n); };

  // Reset form
  const handleReset = () => {
    if (confirm('Yakin ingin menghapus semua data dan mulai dari awal?')) {
      localStorage.removeItem('rtt_draft');
      setStep(0);
      setRttId(null);
      setIdentitas({ rpkh_id: "", nomor_dokumen: "", tanggal: new Date().toISOString().split('T')[0], kph: "", bkph: "", rph: "" });
      setSk({ nomor_sk: "", tanggal_sk: "", tentang: "" });
      setKeputusan({ menimbang: "", mengingat: "", memutuskan: "" });
      setTebangan([{ petak: "", anak_petak: "", luas: "", jenis_tanaman: "", volume: "", jumlah_pohon: "", keterangan: "" }]);
      setBeritaAcara([{ tanggal: "", nama_petugas: "", jabatan: "", hasil_pemeriksaan: "" }]);
      setPengesahan([{ nama_pejabat: "", jabatan: "", npk: "", tanggal: "" }]);
      setLampiranJudul('');
      setLampiranKeterangan('');
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-4">
          <Link href="/rtt" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Penyusunan Dokumen RTT</h1>
            <p className="text-slate-500 text-[13px] font-medium">Langkah {step + 1} dari {STEPS.length}: <span className="text-slate-300">{STEPS[step]}</span></p>
          </div>
        </div>
        <button onClick={handleReset} className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1.5 transition-colors">
          <Trash2 size={14} /> Reset Form
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => rttId && i > 0 ? setStep(i) : null}
            className={`flex-1 h-2 rounded-full transition-all duration-500 ${i < step ? 'bg-emerald-500' : i === step ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-slate-800'}`}
            title={s}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 font-medium px-1">
        {STEPS.map((s, i) => <span key={s} className={i <= step ? 'text-emerald-400 font-semibold' : ''}>{s}</span>)}
      </div>

      {/* Step Content */}
      <div className="glass-card p-7 min-h-[300px]">

        {/* STEP 0: Identitas */}
        {step === 0 && (
          <div className="space-y-5">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">📋 Identitas Dokumen RTT</h3>
            <div>
              <label className={labelClass}>Pilih RPKH (Dokumen Induk)</label>
              <select className={inputClass} value={identitas.rpkh_id} onChange={e => setIdentitas({ ...identitas, rpkh_id: e.target.value })} required>
                <option value="">-- Pilih RPKH --</option>
                {rpkhList.map(r => <option key={r.id} value={r.id}>{r.wilayah} — {r.kph} ({r.tahun_mulai}-{r.tahun_selesai})</option>)}
              </select>
              {rpkhList.length === 0 && <p className="text-amber-400 text-xs mt-2">⚠️ Belum ada RPKH. <Link href="/rpkh/create" className="underline">Buat RPKH dulu</Link></p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nomor Dokumen</label>
                <input className={inputClass} value={identitas.nomor_dokumen} onChange={e => setIdentitas({ ...identitas, nomor_dokumen: e.target.value })} placeholder="RTT/2026/001" required />
              </div>
              <div>
                <label className={labelClass}>Tanggal</label>
                <input type="date" className={inputClass} value={identitas.tanggal} onChange={e => setIdentitas({ ...identitas, tanggal: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelClass}>KPH</label><input className={inputClass} value={identitas.kph} onChange={e => setIdentitas({ ...identitas, kph: e.target.value })} /></div>
              <div><label className={labelClass}>BKPH</label><input className={inputClass} value={identitas.bkph} onChange={e => setIdentitas({ ...identitas, bkph: e.target.value })} /></div>
              <div><label className={labelClass}>RPH</label><input className={inputClass} value={identitas.rph} onChange={e => setIdentitas({ ...identitas, rph: e.target.value })} /></div>
            </div>
            {selectedRpkh && <p className="text-emerald-400 text-xs font-medium">✓ Data KPH/BKPH/RPH otomatis terisi dari RPKH terpilih</p>}
          </div>
        )}

        {/* STEP 1: SK */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-white font-bold text-lg">📜 Surat Keputusan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Nomor SK</label><input className={inputClass} value={sk.nomor_sk} onChange={e => setSk({ ...sk, nomor_sk: e.target.value })} placeholder="SK/RTT/001/2026" /></div>
              <div><label className={labelClass}>Tanggal SK</label><input type="date" className={inputClass} value={sk.tanggal_sk} onChange={e => setSk({ ...sk, tanggal_sk: e.target.value })} /></div>
            </div>
            <div><label className={labelClass}>Tentang</label><textarea className={textareaClass} value={sk.tentang} onChange={e => setSk({ ...sk, tentang: e.target.value })} placeholder="Tentang penetapan rencana teknik tahunan..." /></div>
          </div>
        )}

        {/* STEP 2: Keputusan */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-white font-bold text-lg">⚖️ Keputusan</h3>
            <div><label className={labelClass}>Menimbang</label><textarea className={textareaClass} value={keputusan.menimbang} onChange={e => setKeputusan({ ...keputusan, menimbang: e.target.value })} placeholder="Bahwa untuk melaksanakan..." /></div>
            <div><label className={labelClass}>Mengingat</label><textarea className={textareaClass} value={keputusan.mengingat} onChange={e => setKeputusan({ ...keputusan, mengingat: e.target.value })} placeholder="1. Peraturan Pemerintah..." /></div>
            <div><label className={labelClass}>Memutuskan</label><textarea className={textareaClass} value={keputusan.memutuskan} onChange={e => setKeputusan({ ...keputusan, memutuskan: e.target.value })} placeholder="MENETAPKAN: ..." /></div>
          </div>
        )}

        {/* STEP 3: Tebangan */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">🌲 Data Rencana Tebangan</h3>
              <button type="button" onClick={addTebangan} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"><Plus size={14} /> Tambah Baris</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
              <table className="w-full min-w-[800px] text-sm">
                <thead><tr className="bg-slate-900/40 border-b border-white/[0.04]">
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase w-8">#</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Petak</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Anak Petak</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Luas</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Jenis Tanaman</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Volume</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Jml Pohon</th>
                  <th className="p-3 text-[10px] font-semibold text-slate-500 uppercase">Ket</th>
                  <th className="w-8"></th>
                </tr></thead>
                <tbody>
                  {tebangan.map((t, i) => (
                    <tr key={i} className="border-b border-white/[0.03]">
                      <td className="p-2 text-slate-500 text-xs text-center">{i+1}</td>
                      <td className="p-2"><input className="glass-input w-full px-2.5 py-2 text-xs" value={t.petak} onChange={e => updateTebangan(i, 'petak', e.target.value)} placeholder="1A" /></td>
                      <td className="p-2"><input className="glass-input w-full px-2.5 py-2 text-xs" value={t.anak_petak} onChange={e => updateTebangan(i, 'anak_petak', e.target.value)} placeholder="a" /></td>
                      <td className="p-2"><input type="number" step="0.01" className="glass-input w-20 px-2.5 py-2 text-xs" value={t.luas} onChange={e => updateTebangan(i, 'luas', e.target.value)} /></td>
                      <td className="p-2"><input className="glass-input w-full px-2.5 py-2 text-xs" value={t.jenis_tanaman} onChange={e => updateTebangan(i, 'jenis_tanaman', e.target.value)} placeholder="Jati" /></td>
                      <td className="p-2"><input type="number" step="0.01" className="glass-input w-20 px-2.5 py-2 text-xs" value={t.volume} onChange={e => updateTebangan(i, 'volume', e.target.value)} /></td>
                      <td className="p-2"><input type="number" className="glass-input w-16 px-2.5 py-2 text-xs" value={t.jumlah_pohon} onChange={e => updateTebangan(i, 'jumlah_pohon', e.target.value)} /></td>
                      <td className="p-2"><input className="glass-input w-full px-2.5 py-2 text-xs" value={t.keterangan} onChange={e => updateTebangan(i, 'keterangan', e.target.value)} /></td>
                      <td className="p-2">{tebangan.length > 1 && <button onClick={() => removeTebangan(i)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4: Rekap */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-white font-bold text-lg">📊 Rekapitulasi</h3>
            <p className="text-slate-500 text-[13px] font-medium">Data dihitung otomatis dari tabel tebangan</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
              <div className="glass-card p-6 text-center bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/15">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Total Luas (Ha)</p>
                <p className="text-3xl font-extrabold text-emerald-400">{totalLuas.toFixed(2)}</p>
              </div>
              <div className="glass-card p-6 text-center bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/15">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Total Volume (m³)</p>
                <p className="text-3xl font-extrabold text-blue-400">{totalVolume.toFixed(2)}</p>
              </div>
              <div className="glass-card p-6 text-center bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/15">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Total Pohon</p>
                <p className="text-3xl font-extrabold text-amber-400">{totalPohon.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Peta */}
        {step === 5 && (
          <div className="space-y-5">
            <h3 className="text-white font-bold text-lg">🗺️ Peta Lokasi</h3>
            <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-700/50 space-y-4">
              <div className="space-y-2">
                <label className={labelClass}>Upload File Peta (Opsional namun disarankan)</label>
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setPetaFile(e.target.files?.[0] || null)}
                  className="glass-input w-full px-4 py-3 text-[13px] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"
                />
                {petaFile && <p className="text-emerald-400 text-xs">✓ File peta siap diunggah: {petaFile.name}</p>}
                <p className="text-slate-400 text-[12px] mt-2">Format: PDF, JPG, PNG. Max: 10MB</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Berita Acara */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">📝 Berita Acara Pemeriksaan</h3>
              <button type="button" onClick={addBA} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"><Plus size={14} /> Tambah</button>
            </div>
            {beritaAcara.map((ba, i) => (
              <div key={i} className="bg-slate-900/30 p-5 rounded-xl border border-white/[0.04] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold">Berita Acara #{i+1}</span>
                  {beritaAcara.length > 1 && <button onClick={() => removeBA(i)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelClass}>Tanggal</label><input type="date" className={inputClass} value={ba.tanggal} onChange={e => updateBA(i, 'tanggal', e.target.value)} /></div>
                  <div><label className={labelClass}>Nama Petugas</label><input className={inputClass} value={ba.nama_petugas} onChange={e => updateBA(i, 'nama_petugas', e.target.value)} /></div>
                  <div><label className={labelClass}>Jabatan</label><input className={inputClass} value={ba.jabatan} onChange={e => updateBA(i, 'jabatan', e.target.value)} /></div>
                </div>
                <div><label className={labelClass}>Hasil Pemeriksaan</label><textarea className={textareaClass} value={ba.hasil_pemeriksaan} onChange={e => updateBA(i, 'hasil_pemeriksaan', e.target.value)} placeholder="Hasil pemeriksaan lapangan..." /></div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 7: Lampiran */}
        {step === 7 && (
          <div className="space-y-5">
            <h3 className="text-white font-bold text-lg">📎 Lampiran Dokumen</h3>
            <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-700/50 space-y-4">
              <div>
                <label className={labelClass}>Judul Lampiran</label>
                <input className={inputClass} value={lampiranJudul} onChange={e => setLampiranJudul(e.target.value)} placeholder="e.g. Surat Keterangan Hak Guna" />
              </div>
              <div>
                <label className={labelClass}>Keterangan</label>
                <textarea className={textareaClass} value={lampiranKeterangan} onChange={e => setLampiranKeterangan(e.target.value)} placeholder="Keterangan tentang lampiran..." />
              </div>
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <label className={labelClass}>Upload Dokumen Lampiran Lainnya (Opsional)</label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={(e) => setLampiranFile(e.target.files?.[0] || null)}
                  className="glass-input w-full px-4 py-3 text-[13px] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"
                />
                {lampiranFile && <p className="text-emerald-400 text-xs">✓ File lampiran siap diunggah: {lampiranFile.name}</p>}
                <p className="text-slate-400 text-[12px] mt-2">Format: PDF, DOC, JPG, PNG. Max: 10MB</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Pengesahan */}
        {step === 8 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">✍️ Halaman Pengesahan</h3>
              <button type="button" onClick={addPeng} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"><Plus size={14} /> Tambah Pejabat</button>
            </div>
            {pengesahan.map((p, i) => (
              <div key={i} className="bg-slate-900/30 p-5 rounded-xl border border-white/[0.04] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold">Pejabat #{i+1}</span>
                  {pengesahan.length > 1 && <button onClick={() => removePeng(i)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>Nama Pejabat</label><input className={inputClass} value={p.nama_pejabat} onChange={e => updatePeng(i, 'nama_pejabat', e.target.value)} /></div>
                  <div><label className={labelClass}>Jabatan</label><input className={inputClass} value={p.jabatan} onChange={e => updatePeng(i, 'jabatan', e.target.value)} /></div>
                  <div><label className={labelClass}>NPK</label><input className={inputClass} value={p.npk} onChange={e => updatePeng(i, 'npk', e.target.value)} /></div>
                  <div><label className={labelClass}>Tanggal</label><input type="date" className={inputClass} value={p.tanggal} onChange={e => updatePeng(i, 'tanggal', e.target.value)} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="btn-secondary flex items-center gap-2 px-5 py-2.5 text-[13px] disabled:opacity-30">
          <ArrowLeft size={16} /> Sebelumnya
        </button>

        <div className="flex gap-3">
          {rttId && (
            <button onClick={() => handleSaveAll(false)} disabled={loading} className="btn-secondary flex items-center gap-2 px-5 py-2.5 text-[13px] disabled:opacity-50">
              <Save size={16} /> Simpan Draft
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button onClick={() => { if (step === 0 && !rttId) handleCreateRtt(); else setStep(step + 1); }} disabled={loading || (step === 0 && !identitas.rpkh_id)}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[13px] disabled:opacity-50">
              {loading ? "Memproses..." : <>{step === 0 && !rttId ? "Buat RTT" : "Selanjutnya"} <ArrowRight size={16} /></>}
            </button>
          ) : (
            <button onClick={() => handleSaveAll(true)} disabled={loading}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[13px] disabled:opacity-50">
              {loading ? "Memproses..." : <><Send size={16} /> Lanjutkan ke Workspace</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RttCreatePage() {
  return <DashboardLayout><RttCreateContent /></DashboardLayout>;
}
