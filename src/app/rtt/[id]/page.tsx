"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import Link from "next/link";
import { 
    ArrowLeft, CheckCircle2, ShieldCheck, Map, FileText, 
    ClipboardList, PenTool, PlaySquare, FilePlus, X,
    Layers, Zap, Terminal, Share2, Printer, ChevronDown,
    Cpu, Globe, Lock, Download, Key
} from "lucide-react";

// Wrapper component that uses useAuth inside DashboardLayout context
function RttDetailContent({ id }: { id: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [rpkhDetails, setRpkhDetails] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadKeterangan, setUploadKeterangan] = useState('');
  const [finalizeKeyModal, setFinalizeKeyModal] = useState(false);
  const [privateKeyInput, setPrivateKeyInput] = useState("");

  const fetchWorkspace = () => {
    setLoading(true);
    fetch(`http://localhost:8000/api/rtt/detail.php?id=${id}`)
      .then(res => res.json())
      .then(d => { if (d.status === "success") setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWorkspace(); }, [id]);

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SMART INPUTS ---
  // 1. Fetch RPKH Details
  useEffect(() => {
    if (data?.rtt?.rpkh_id) {
      fetch(`http://localhost:8000/api/rpkh/detail.php?id=${data.rtt.rpkh_id}`)
        .then(res => res.json())
        .then(d => { if (d.status === 'success') setRpkhDetails(d.details || []); });
    }
  }, [data?.rtt?.rpkh_id]);

  // 2. Auto-Fetch from RPKH
  useEffect(() => {
    if (activeModal === 'nett' && formData.petak && rpkhDetails.length > 0) {
      const detail = rpkhDetails.find((x: any) => x.petak === formData.petak);
      if (detail) {
        setFormData((prev: any) => ({
          ...prev,
          luas_baku: prev.luas_baku || detail.luas,
          jenis_tanaman: prev.jenis_tanaman || detail.jenis_tanaman,
          kelas_hutan: prev.kelas_hutan || detail.kelas_hutan,
          bon: prev.bon || detail.bon,
          kbd: prev.kbd || detail.kbd,
          dkn: prev.dkn || detail.dkn,
          n_per_ha: prev.n_per_ha || detail.n_per_ha
        }));
      }
    }
  }, [formData.petak, activeModal, rpkhDetails]);

  // 2. Auto-Calculate Volume
  useEffect(() => {
    if (activeModal === 'nett') {
      const ai = parseFloat(formData.ai) || 0;
      const aii = parseFloat(formData.aii) || 0;
      const aiii = parseFloat(formData.aiii) || 0;
      if (ai > 0 || aii > 0 || aiii > 0) {
        setFormData((prev: any) => ({ ...prev, jumlah_volume: ai + aii + aiii }));
      }
    }
  }, [formData.ai, formData.aii, formData.aiii, activeModal]);
  // --------------------


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Upload file untuk peta/peta_bap
      if ((activeModal === 'peta' || activeModal === 'peta_bap') && uploadFile) {
        const formDataFile = new FormData();
        formDataFile.append('file', uploadFile);
        formDataFile.append('rtt_id', id);
        formDataFile.append('type', activeModal);
        formDataFile.append('keterangan', uploadKeterangan);
        formDataFile.append('token', localStorage.getItem('token') || '');
        
        if (activeModal === 'peta') {
          const petaFields = ['bagian_hutan','kelompok_hutan','rph','bkph','jenis_tanaman','jarak_tanam','skala','petak','luas_baku','panjang','kelas_hutan','tahun_tanam'];
          petaFields.forEach(f => formDataFile.append(f, formData[f] || ''));
        }

        const res = await fetch(`http://localhost:8000/api/rtt/upload_file.php`, {
          method: "POST",
          body: formDataFile
        });
        const responseData = await res.json();
        if (responseData.status === "success") {
          setActiveModal(null);
          setFormData({});
          setUploadFile(null);
          setUploadKeterangan('');
          fetchWorkspace();
        } else {
          alert(responseData.message || 'Upload gagal');
        }
      } else {
        // Data biasa (non-file)
        const payloadToSubmit = { ...formData };
        if (activeModal === 'ba_detail') {
          payloadToSubmit.berita_acara_id = data.berita_acara?.[0]?.id || data.berita_acara?.id || 0;
        }
        const res = await fetch(`http://localhost:8000/api/rtt/upload_doc.php`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rtt_id: id, doc_type: activeModal, payload: payloadToSubmit })
        });
        const responseData = await res.json();
        if (responseData.status === "success") {
          setActiveModal(null);
          setFormData({});
          fetchWorkspace();
        }
      }
    } catch (err) { alert("Error server."); }
    finally { setIsSubmitting(false); }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKeyInput) {
      alert("Private Key wajib diisi untuk penandatanganan ECDSA!");
      return;
    }
    if (!confirm("Otorisasi Tanda Tangan ECDSA? Berkas akan dipatenkan (Immutable).")) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/rtt/sign.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtt_id: id, user_id: user?.id, private_key: privateKeyInput })
      });
      const d = await res.json();
      if (d.status === "success") {
        setFinalizeKeyModal(false);
        setPrivateKeyInput("");
        fetchWorkspace();
      } else {
        alert(d.message || "Gagal melakukan otorisasi.");
      }
    } catch (e) { alert("Error server."); }
    finally { setIsSubmitting(false); }
  };

  if (loading) return (
    <div className="flex h-[50vh] justify-center items-center">
      <div className="w-8 h-8 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (!data || !data.rtt) return (
    <div className="text-center py-20 text-slate-500 text-sm font-medium">Dokumen Tidak Ditemukan</div>
  );

  const { rtt, summary, nett, peta, rekap_klem, klem_detail, berita_acara, peta_bap } = data;

  const docModules = [
    { key: "summary", name: "Summary RTT", role: "ADMIN", desc: "Data kompilasi volume", done: !!summary, icon: <FileText size={20} /> },
    { key: "nett", name: "NETT RTT", role: "ADMIN", desc: "Perhitungan netto volume", done: !!nett, icon: <Layers size={20} /> },
    { key: "peta", name: "Peta Lokasi", role: "GIS", desc: "Batas petak tebangan", done: peta.length > 0, icon: <Globe size={20} /> },
    { key: "rekap_klem", name: "Rekap Klem", role: "FIELD", desc: "Identifikasi jumlah pohon", done: rekap_klem.length > 0, icon: <ClipboardList size={20} /> },
    { key: "klem_detail", name: "Detail Klem", role: "FIELD", desc: "Data individu pohon", done: klem_detail.length > 0, icon: <Cpu size={20} /> },
    { key: "berita_acara", name: "Berita Acara", role: "FIELD", desc: "Laporan verifikasi lapangan", done: !!berita_acara, icon: <PenTool size={20} /> },
    { key: "ba_detail", name: "Detail Berita Acara", role: "FIELD", desc: "Detail pemeriksaan petak", done: (data.berita_acara?.details && data.berita_acara.details.length > 0), icon: <ClipboardList size={20} /> },
    { key: "peta_bap", name: "Peta BAP", role: "GIS", desc: "Visualisasi lampiran BAP", done: !!peta_bap, icon: <Map size={20} /> },
  ];

  const doneCount = docModules.filter(c=>c.done).length;
  const isSah = rtt.status === "disahkan";

  return (
    <div className="space-y-8 animate-fade-in pb-20">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.04]">
          <div className="flex items-center gap-4">
            <Link href="/rtt" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600/30 transition-all">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-white">{rtt.nomor_dokumen}</h2>
              <p className="text-[12px] text-slate-500 font-medium mt-0.5">Kesatuan Pemangkuan Hutan {rtt.kph}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`status-badge border ${isSah ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isSah ? 'bg-emerald-400 pulse-dot' : 'bg-slate-500'}`} />
              {isSah ? 'SAH • SIGNED' : rtt.status}
            </div>
            <button className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-slate-500 hover:text-white transition-all"><Share2 size={16} /></button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 relative overflow-hidden glass-card p-8 flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/[0.06] to-transparent pointer-events-none" />
            <div className="space-y-5 relative z-10">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="status-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">Digital Signature Workspace</span>
                <span className="text-slate-600 text-[11px] font-medium">Protocol: SECP256K1</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight max-w-xl">
                Integritas Data Transaksi <br/>
                <span className="text-slate-600">Rencana Teknik Tahunan</span>
              </h1>
              <div className="flex flex-wrap gap-6 pt-1">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-600 uppercase">Document Hash ID</p>
                  <p className="text-[12px] font-mono text-slate-400 break-all">{rtt.hash ? rtt.hash.substring(0,32) : 'Awaiting Final Validation...'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-7 flex flex-col justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kelengkapan Berkas</p>
              <h4 className="text-4xl font-extrabold text-white tracking-tight">{Math.round((doneCount/8)*100)}%</h4>
            </div>
            
            <div className="space-y-5 pb-1">
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden border border-white/[0.04]">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 rounded-full" 
                  style={{ width: `${(doneCount/8)*100}%` }}
                />
              </div>
              
              <div className="min-h-12">
                {doneCount === 8 && (rtt.status === 'draft' || rtt.status === 'revisi_phw' || rtt.status === 'revisi_kph') && (user?.role === 'sysadmin' || user?.role === 'kph') ? (
                  <button onClick={async () => {
                    if (!confirm("Kirim dokumen ini ke PHW untuk diverifikasi?")) return;
                    try {
                      const res = await fetch(`http://localhost:8000/api/rtt/submit.php`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ rtt_id: id, token: localStorage.getItem('token') })
                      });
                      const d = await res.json();
                      if (d.status === "success") {
                        alert("Berhasil dikirim ke PHW!");
                        fetchWorkspace();
                      } else alert(d.message);
                    } catch(e) { alert("Error server"); }
                  }} className="btn-primary w-full h-full text-[12px] font-bold bg-blue-500 hover:bg-blue-600 border-blue-400">
                    Kirim ke PHW (Verifikasi)
                  </button>
                ) : rtt.status === 'menunggu_verifikasi_phw' ? (
                  <div className="w-full h-full bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 font-semibold text-[11px] text-center px-4">
                    {user?.role === 'phw' || user?.role === 'sysadmin' ? 'Buka menu Validasi PHW untuk memverifikasi' : 'Menunggu Verifikasi dari pihak PHW'}
                  </div>
                ) : rtt.status === 'menunggu_pengesahan' ? (
                  <div className="w-full h-full bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 font-semibold text-[11px] text-center px-4">
                    Menunggu Pengesahan (Finalize) dari Divisi
                  </div>
                ) : isSah ? (
                  <>
                  <button onClick={() => window.open(`http://localhost:8000/api/rtt/generate_pdf.php?id=${id}`)} className="btn-secondary w-full h-full text-[12px] font-bold flex items-center justify-center gap-2">
                    <Printer size={16} /> Cetak RTT Final
                  </button>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => window.open(`http://localhost:8000/api/rtt/download_encrypted.php?id=${id}`)}
                      className="w-full py-2.5 px-3 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-lg text-[11px] font-bold text-teal-400 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Lock size={14} /> Unduh Dokumen (Encrypted ECC)
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => window.open(`http://localhost:8000/api/rtt/download_bundle.php?id=${id}&type=sig`)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Download size={12} /> Unduh .SIG
                      </button>
                      <button 
                        onClick={() => window.open(`http://localhost:8000/api/rtt/download_bundle.php?id=${id}&type=pub`)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Key size={12} /> Unduh .PEM
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                  <div className="w-full h-full bg-slate-800/30 border border-dashed border-slate-700/50 rounded-xl flex items-center justify-center text-slate-600 font-semibold text-[11px] text-center px-4">
                    {doneCount < 8 ? `Lengkapi ${8 - doneCount} Module Tersisa` : 'Menunggu Status'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
          {docModules.map((doc, idx) => {
            const isMyRole = user?.role === 'sysadmin' || user?.role === 'kph'; 
            return (
              <div key={idx} className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300 overflow-hidden h-[220px] ${
                doc.done 
                  ? 'glass-card border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.05] to-transparent' 
                  : 'glass-card glass-card-hover'
              }`}>
                <div className="flex justify-between items-start mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    doc.done 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-800/80 text-slate-500 border border-white/[0.06]'
                  }`}>
                    {doc.icon}
                  </div>
                  {doc.done && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-1">
                  <h3 className="text-[14px] font-bold text-slate-100">{doc.name}</h3>
                  <p className="text-slate-500 text-[12px] font-medium leading-relaxed">{doc.desc}</p>
                </div>

                <div className="mt-4 flex justify-between items-center pt-3 border-t border-white/[0.04]">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{doc.role} Unit</span>
                  {isMyRole && (rtt.status === 'draft' || rtt.status === 'revisi_phw' || rtt.status === 'revisi_kph') && (
                    <button onClick={() => setActiveModal(doc.key)} className={`px-4 py-1.5 text-[10px] font-bold transition-all ${doc.done ? 'btn-secondary' : 'btn-primary'}`}>
                      {doc.done ? 'Edit Data' : 'Input Data'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
            <div className="glass-card p-8 max-w-lg w-full shadow-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto">
              <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
              <div className="mb-6 space-y-1">
                <h3 className="text-xl font-bold text-white">Input Data <span className="text-emerald-400">{docModules.find(m => m.key === activeModal)?.name || activeModal}</span></h3>
                <p className="text-slate-400 text-[13px]">Lengkapi data spesifik untuk modul ini sebelum pengesahan.</p>
              </div>
              <form onSubmit={handleFormSubmit} className="space-y-5">
                {activeModal === 'summary' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">Bentuk Tebangan Utama</label>
                      <input autoFocus required type="text" name="bentuk_tebangan" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" placeholder="e.g. TEBANGAN A 2026" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Luas Bruto (Ha)</label>
                        <input required type="number" step="0.01" name="luas" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Est. Pohon</label>
                        <input required type="number" name="jumlah_pohon" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">Jenis Kayu</label>
                      <input required type="text" name="jenis_kayu" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Kayu Perkakas (m³)</label>
                        <input required type="number" step="0.01" name="kayu_perkakas" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Kayu Bakar (m³)</label>
                        <input required type="number" step="0.01" name="kayu_bakar" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Bambu (btg)</label>
                        <input required type="number" step="0.01" name="bambu" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Arang (m³)</label>
                        <input required type="number" step="0.01" name="arang" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">Keterangan</label>
                      <textarea name="keterangan" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px] min-h-[100px]" />
                    </div>
                  </div>
                )}
                {/* Upload File untuk Peta dan Peta BAP */}
                {activeModal === 'peta' && (
                  <div className="space-y-4 border-b border-white/[0.06] pb-4 mb-4">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Metadata Peta</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Bagian Hutan</label><input type="text" name="bagian_hutan" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Kelompok Hutan</label><input type="text" name="kelompok_hutan" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">RPH</label><input type="text" name="rph" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">BKPH</label><input type="text" name="bkph" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Jenis Tanaman</label><input type="text" name="jenis_tanaman" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Jarak Tanam</label><input type="text" name="jarak_tanam" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Skala</label><input type="text" name="skala" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Petak</label><input type="text" name="petak" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Luas Baku (Ha)</label><input type="number" step="0.01" name="luas_baku" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Panjang (m)</label><input type="number" step="0.01" name="panjang" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Kelas Hutan</label><input type="text" name="kelas_hutan" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Tahun Tanam</label><input type="number" name="tahun_tanam" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                    </div>
                  </div>
                )}
                {(activeModal === 'peta' || activeModal === 'peta_bap') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">Pilih File (PDF, JPG, PNG)</label>
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="glass-input w-full px-4 py-3 text-[13px] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"
                      />
                      {uploadFile && (
                        <p className="text-emerald-400 text-[11px]">✓ {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">Keterangan Tambahan</label>
                      <input 
                        type="text" 
                        value={uploadKeterangan}
                        onChange={(e) => setUploadKeterangan(e.target.value)}
                        className="glass-input w-full px-4 py-3 text-[13px]" 
                        placeholder="e.g. Lampiran File"
                      />
                    </div>
                  </div>
                )}

                {activeModal === 'nett' && (
                  <div className="space-y-6">
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary flex-1 py-2 text-[11px] flex items-center justify-center gap-2" onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file'; input.accept = '.csv';
                        input.onchange = (e: any) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const text = ev.target?.result as string;
                            const lines = text.split('\n');
                            if(lines.length > 1) {
                              const headers = lines[0].split(',').map(h => h.trim());
                              const values = lines[1].split(',').map(v => v.trim());
                              const newFormData = {...formData};
                              headers.forEach((h, i) => { if(h) newFormData[h] = values[i]; });
                              setFormData(newFormData);
                              alert('Data berhasil di-import dari CSV!');
                            }
                          };
                          reader.readAsText(file);
                        };
                        input.click();
                      }}>
                        <FilePlus size={14} /> Import CSV
                      </button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">Identitas Petak</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Bagian Hutan</label><input type="text" name="bagian_hutan" value={formData.bagian_hutan||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2">
                          <label className="text-[11px] text-slate-400 font-semibold block">Petak (Sesuai RPKH)</label>
                          {rpkhDetails.length > 0 ? (
                            <select name="petak" value={formData.petak||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]">
                              <option value="">-- Pilih Petak --</option>
                              {rpkhDetails.map(d => <option key={d.id} value={d.petak}>{d.petak} (Kuota: {d.luas} Ha)</option>)}
                            </select>
                          ) : (
                            <input type="text" name="petak" value={formData.petak||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" placeholder="e.g. 23A" />
                          )}
                          {formData.petak && rpkhDetails.find((x: any) => x.petak === formData.petak) && (
                            <p className={`text-[10px] mt-1 ${parseFloat(formData.luas_baku || 0) > parseFloat(rpkhDetails.find((x: any) => x.petak === formData.petak).luas) ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                              ℹ️ Maksimal Luas RPKH: {rpkhDetails.find((x: any) => x.petak === formData.petak).luas} Ha
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">BKPH</label><input type="text" name="bkph" value={formData.bkph||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">RPH</label><input type="text" name="rph" value={formData.rph||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Anak Petak Baru</label><input type="text" name="anak_petak_baru" value={formData.anak_petak_baru||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                        <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Lokasi & Tanaman</p>
                        <button type="button" onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setFormData((p: any) => ({...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude}));
                            });
                          } else alert("Geolocation not supported");
                        }} className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30">📍 Ambil Koordinat</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Latitude</label><input type="number" step="0.000001" name="latitude" value={formData.latitude||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Longitude</label><input type="number" step="0.000001" name="longitude" value={formData.longitude||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Luas Baku (Ha)</label><input type="number" step="0.01" name="luas_baku" value={formData.luas_baku||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Jenis Tanaman</label><input type="text" name="jenis_tanaman" value={formData.jenis_tanaman||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">Data Bonita & Hutan (Auto-fetch)</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Kelas Hutan</label><input type="text" name="kelas_hutan" value={formData.kelas_hutan||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">BON</label><input type="text" name="bon" value={formData.bon||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">KBD</label><input type="text" name="kbd" value={formData.kbd||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">DKN</label><input type="text" name="dkn" value={formData.dkn||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">N/Ha</label><input type="number" step="0.01" name="n_per_ha" value={formData.n_per_ha||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Thn Tanam</label><input type="number" name="tahun_tanam" value={formData.tahun_tanam||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">Data Tebangan & Volume (m³)</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">AI (m³)</label><input type="number" step="0.01" name="ai" value={formData.ai||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">AII (m³)</label><input type="number" step="0.01" name="aii" value={formData.aii||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">AIII (m³)</label><input type="number" step="0.01" name="aiii" value={formData.aiii||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block text-emerald-400">Jml Volume (Auto)</label><input readOnly type="number" step="0.01" name="jumlah_volume" value={formData.jumlah_volume||''} className="glass-input w-full px-4 py-3 text-[13px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Jml Pohon</label><input type="number" name="jumlah_pohon" value={formData.jumlah_pohon||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Kayu Bakar</label><input type="number" step="0.01" name="kayu_bakar" value={formData.kayu_bakar||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Tunggak</label><input type="number" step="0.01" name="tunggak" value={formData.tunggak||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Kulit</label><input type="number" step="0.01" name="kulit" value={formData.kulit||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">Data Lanjutan & Keterangan</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Anak Petak Lama</label><input type="text" name="anak_petak_lama" value={formData.anak_petak_lama||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Telah Ditebang (m³)</label><input type="number" step="0.01" name="telah_ditebang" value={formData.telah_ditebang||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Tahun YAD</label><input type="number" step="0.01" name="tahun_yad" value={formData.tahun_yad||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Akan Ditebang Teres</label><input type="number" step="0.01" name="akan_ditebang_teres" value={formData.akan_ditebang_teres||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Akan Ditebang Non-Teres</label><input type="number" step="0.01" name="akan_ditebang_non_teres" value={formData.akan_ditebang_non_teres||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Faktor Koreksi KPH</label><input type="number" step="0.01" name="faktor_koreksi_kph" value={formData.faktor_koreksi_kph||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">X Faktor Klem</label><input type="number" step="0.01" name="xfaktor_klem" value={formData.xfaktor_klem||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Hasil Lain (Jenis)</label><input type="text" name="hasil_lain_jenis" value={formData.hasil_lain_jenis||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Satuan</label><input type="text" name="hasil_lain_satuan" value={formData.hasil_lain_satuan||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Volume</label><input type="number" step="0.01" name="hasil_lain_volume" value={formData.hasil_lain_volume||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Alat Mekanis (Jenis)</label><input type="text" name="alat_mekanis_jenis" value={formData.alat_mekanis_jenis||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                        <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Volume Alat Mekanis</label><input type="number" step="0.01" name="alat_mekanis_volume" value={formData.alat_mekanis_volume||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" /></div>
                      </div>
                      <div className="space-y-2"><label className="text-[11px] text-slate-400 font-semibold block">Keterangan</label><textarea name="keterangan" value={formData.keterangan||''} onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" rows={3} /></div>
                    </div>
                  </div>
                )}

                {activeModal === 'rekap_klem' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Nomor Blok</label>
                        <input required type="text" name="no_blok" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" placeholder="e.g. Blok 1" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Luas Blok (Ha)</label>
                        <input required type="number" step="0.01" name="luas_blok" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Jumlah Pohon</label>
                        <input required type="number" name="jumlah_pohon" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Volume (m³)</label>
                        <input required type="number" step="0.01" name="volume" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'klem_detail' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Nomor Pohon</label>
                        <input required type="text" name="no_pohon" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" placeholder="e.g. 001" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Jenis Pohon</label>
                        <input required type="text" name="jenis_pohon" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" placeholder="e.g. Jati" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Keliling Batang (cm)</label>
                        <input required type="number" step="0.1" name="keliling" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Volume (m³)</label>
                        <input required type="number" step="0.01" name="volume" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'berita_acara' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Nama Petugas Pemeriksa</label>
                        <input required type="text" name="nama_petugas" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" placeholder="e.g. Ahmad Subarjo" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Jabatan</label>
                        <input required type="text" name="jabatan" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" placeholder="e.g. Kepala KRPH" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">Tanggal Pemeriksaan</label>
                      <input required type="date" name="tanggal" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">Hasil Pemeriksaan Ringkas</label>
                      <textarea required rows={4} name="hasil_pemeriksaan" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px] leading-relaxed" placeholder="Tuliskan laporan ringkas hasil pemeriksaan petak di sini..." />
                    </div>
                  </div>
                )}

                {activeModal === 'ba_detail' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Petak</label>
                        <input required type="text" name="petak" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" placeholder="e.g. 12A" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Anak Petak</label>
                        <input required type="text" name="anak_petak" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" placeholder="e.g. a" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Luas Baku (Ha)</label>
                        <input required type="number" step="0.01" name="luas_baku" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Luas Rencana (Ha)</label>
                        <input required type="number" step="0.01" name="luas_rencana" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Jenis Tebangan</label>
                        <input required type="text" name="jenis_tebangan" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">Jenis Tanaman</label>
                        <input required type="text" name="jenis_tanaman" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">Rencana Volume (m³)</label>
                      <input required type="number" step="0.01" name="rencana_volume" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">Keterangan</label>
                      <textarea name="keterangan" onChange={handleInputChange} className="glass-input w-full px-4 py-3 text-[13px] min-h-[80px]" />
                    </div>
                  </div>
                )}
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 text-[13px] font-bold disabled:opacity-50">
                  {isSubmitting ? 'Transmitting Data...' : 'Submit Transaksi Data'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Finalize Key Modal */}
        {finalizeKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
            <div className="glass-card p-8 max-w-lg w-full shadow-2xl relative animate-scale-in">
              <button onClick={() => setFinalizeKeyModal(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
              <div className="mb-6 space-y-2">
                <h3 className="text-xl font-bold text-white">Masukkan <span className="text-emerald-400">Private Key</span></h3>
                <p className="text-slate-400 text-[12px] font-medium leading-relaxed">
                  Untuk mengesahkan secara hukum Rencana Teknik Tahunan ini, sistem membutuhkan parameter *Private Key* Anda untuk algoritma ECDSA. Key ini tidak akan disimpan di server.
                </p>
              </div>
              <form onSubmit={handleSign} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400 font-semibold block">Konten Private Key (.pem)</label>
                  <textarea 
                    autoFocus 
                    required 
                    rows={6}
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)} 
                    className="glass-input w-full px-4 py-3 text-[11px] font-mono leading-relaxed" 
                    placeholder={"-----BEGIN ENCRYPTED PRIVATE KEY-----\n...\n-----END ENCRYPTED PRIVATE KEY-----"} 
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 text-[13px] font-bold disabled:opacity-50">
                  {isSubmitting ? 'Generating ECDSA Signature...' : 'Validasi Kunci & Finalize RTT'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
  );
}

// Main export - provides DashboardLayout context
export default function RttDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  return (
    <DashboardLayout>
      <RttDetailContent id={id} />
    </DashboardLayout>
  );
}
