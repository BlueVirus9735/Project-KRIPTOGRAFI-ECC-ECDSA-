"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Map,
  FileText,
  ClipboardList,
  PenTool,
  PlaySquare,
  FilePlus,
  X,
  Layers,
  Zap,
  Terminal,
  Share2,
  Printer,
  ChevronDown,
  Cpu,
  Globe,
  Lock,
  Download,
  Key,
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
  const [uploadKeterangan, setUploadKeterangan] = useState("");
  const [finalizeKeyModal, setFinalizeKeyModal] = useState(false);
  const [privateKeyInput, setPrivateKeyInput] = useState("");

  const fetchWorkspace = () => {
    setLoading(true);
    fetch(`http://localhost:8000/api/rtt/detail.php?id=${id}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.status === "success") setData(d);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SMART INPUTS ---
  // 1. Fetch RPKH Details
  useEffect(() => {
    if (data?.rtt?.rpkh_id) {
      fetch(`http://localhost:8000/api/rpkh/detail.php?id=${data.rtt.rpkh_id}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.status === "success") setRpkhDetails(d.details || []);
        });
    }
  }, [data?.rtt?.rpkh_id]);

  // 2. Auto-Fetch from RPKH
  useEffect(() => {
    if (activeModal === "nett" && formData.petak && rpkhDetails.length > 0) {
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
          n_per_ha: prev.n_per_ha || detail.n_per_ha,
        }));
      }
    }
  }, [formData.petak, activeModal, rpkhDetails]);

  // 2. Auto-Calculate Volume
  useEffect(() => {
    if (activeModal === "nett") {
      const ai = parseFloat(formData.ai) || 0;
      const aii = parseFloat(formData.aii) || 0;
      const aiii = parseFloat(formData.aiii) || 0;
      if (ai > 0 || aii > 0 || aiii > 0) {
        setFormData((prev: any) => ({
          ...prev,
          jumlah_volume: ai + aii + aiii,
        }));
      }
    }
  }, [formData.ai, formData.aii, formData.aiii, activeModal]);
  // --------------------

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Upload file untuk peta/peta_bap
      if (
        (activeModal === "peta" || activeModal === "peta_bap") &&
        uploadFile
      ) {
        const formDataFile = new FormData();
        formDataFile.append("file", uploadFile);
        formDataFile.append("rtt_id", id);
        formDataFile.append("type", activeModal);
        formDataFile.append("keterangan", uploadKeterangan);
        formDataFile.append("token", localStorage.getItem("token") || "");

        if (activeModal === "peta") {
          const petaFields = [
            "bagian_hutan",
            "kelompok_hutan",
            "rph",
            "bkph",
            "jenis_tanaman",
            "jarak_tanam",
            "skala",
            "petak",
            "luas_baku",
            "panjang",
            "kelas_hutan",
            "tahun_tanam",
          ];
          petaFields.forEach((f) => formDataFile.append(f, formData[f] || ""));
        }

        const res = await fetch(
          `http://localhost:8000/api/rtt/upload_file.php`,
          {
            method: "POST",
            body: formDataFile,
          },
        );
        const responseData = await res.json();
        if (responseData.status === "success") {
          setActiveModal(null);
          setFormData({});
          setUploadFile(null);
          setUploadKeterangan("");
          fetchWorkspace();
        } else {
          alert(responseData.message || "Upload gagal");
        }
      } else {
        // Data biasa (non-file)
        const payloadToSubmit = { ...formData };
        if (activeModal === "ba_detail") {
          payloadToSubmit.berita_acara_id =
            data.berita_acara?.[0]?.id || data.berita_acara?.id || 0;
        }
        const res = await fetch(
          `http://localhost:8000/api/rtt/upload_doc.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rtt_id: id,
              doc_type: activeModal,
              payload: payloadToSubmit,
            }),
          },
        );
        const responseData = await res.json();
        if (responseData.status === "success") {
          setActiveModal(null);
          setFormData({});
          fetchWorkspace();
        }
      }
    } catch (err) {
      alert("Error server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKeyInput) {
      alert("Private Key wajib diisi untuk penandatanganan ECDSA!");
      return;
    }
    if (
      !confirm(
        "Otorisasi Tanda Tangan ECDSA? Berkas akan dipatenkan (Immutable).",
      )
    )
      return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/rtt/sign.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rtt_id: id,
          user_id: user?.id,
          private_key: privateKeyInput,
        }),
      });
      const d = await res.json();
      if (d.status === "success") {
        setFinalizeKeyModal(false);
        setPrivateKeyInput("");
        fetchWorkspace();
      } else {
        alert(d.message || "Gagal melakukan otorisasi.");
      }
    } catch (e) {
      alert("Error server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-[50vh] justify-center items-center">
        <div className="w-8 h-8 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );

  if (!data || !data.rtt)
    return (
      <div className="text-center py-20 text-slate-500 text-sm font-medium">
        Dokumen Tidak Ditemukan
      </div>
    );

  const {
    rtt,
    summary,
    nett,
    peta,
    rekap_klem,
    klem_detail,
    berita_acara,
    peta_bap,
  } = data;

  const docModules = [
    {
      key: "summary",
      name: "Summary RTT",
      role: "ADMIN",
      desc: "Data kompilasi volume",
      done: !!summary,
      icon: <FileText size={20} />,
    },
    {
      key: "nett",
      name: "NETT RTT",
      role: "ADMIN",
      desc: "Perhitungan netto volume",
      done: !!nett,
      icon: <Layers size={20} />,
    },
    {
      key: "peta",
      name: "Peta Lokasi",
      role: "GIS",
      desc: "Batas petak tebangan",
      done: peta.length > 0,
      icon: <Globe size={20} />,
    },
    {
      key: "rekap_klem",
      name: "Rekap Klem",
      role: "FIELD",
      desc: "Identifikasi jumlah pohon",
      done: rekap_klem.length > 0,
      icon: <ClipboardList size={20} />,
    },
    {
      key: "klem_detail",
      name: "Detail Klem",
      role: "FIELD",
      desc: "Data individu pohon",
      done: klem_detail.length > 0,
      icon: <Cpu size={20} />,
    },
    {
      key: "berita_acara",
      name: "Berita Acara",
      role: "FIELD",
      desc: "Laporan verifikasi lapangan",
      done: !!berita_acara,
      icon: <PenTool size={20} />,
    },
    {
      key: "ba_detail",
      name: "Detail Berita Acara",
      role: "FIELD",
      desc: "Detail pemeriksaan petak",
      done: data.berita_acara?.details && data.berita_acara.details.length > 0,
      icon: <ClipboardList size={20} />,
    },
    {
      key: "peta_bap",
      name: "Peta BAP",
      role: "GIS",
      desc: "Visualisasi lampiran BAP",
      done: !!peta_bap,
      icon: <Map size={20} />,
    },
  ];

  const doneCount = docModules.filter((c) => c.done).length;
  const isSah = rtt.status === "disahkan";

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <Link
            href="/rtt"
            className="w-9 h-9 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Berkas RTT: {rtt.nomor_dokumen || "Tanpa Nomor"}
            </h2>
            <p className="text-[12px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
              Kesatuan Pemangkuan Hutan {rtt.kph}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-md border text-[11px] font-bold tracking-wider uppercase ${isSah ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}
          >
            Status:{" "}
            {isSah ? "SAH & TERENKRIPSI" : rtt.status.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {/* Security & Audit Info */}
      <div className="bg-[#0f172a] border border-slate-700/50 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-white">
              Jejak Audit Kriptografi
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Hash ID: {rtt.hash || "Menunggu finalisasi dokumen..."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {doneCount === 8 &&
          (rtt.status === "draft" ||
            rtt.status === "revisi_phw" ||
            rtt.status === "revisi_kph") &&
          (user?.role === "sysadmin" || user?.role === "kph") ? (
            <button
              onClick={async () => {
                if (!confirm("Kirim dokumen ini ke PHW untuk diverifikasi?"))
                  return;
                try {
                  const res = await fetch(
                    `http://localhost:8000/api/rtt/submit.php`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        rtt_id: id,
                        token: localStorage.getItem("token"),
                      }),
                    },
                  );
                  const d = await res.json();
                  if (d.status === "success") {
                    alert("Berhasil dikirim ke PHW!");
                    fetchWorkspace();
                  } else alert(d.message);
                } catch (e) {
                  alert("Error server");
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white rounded-md text-[12px] font-bold transition-all shadow-lg"
            >
              Ajukan Verifikasi ke PHW
            </button>
          ) : rtt.status === "menunggu_verifikasi_phw" ? (
            <div className="px-4 py-2 bg-indigo-900/30 border border-indigo-700/50 text-indigo-400 rounded-md text-[11px] font-bold">
              Menunggu Verifikasi PHW
            </div>
          ) : rtt.status === "menunggu_pengesahan" ? (
            <div className="px-4 py-2 bg-amber-900/30 border border-amber-700/50 text-amber-400 rounded-md text-[11px] font-bold">
              Menunggu Pengesahan Final
            </div>
          ) : isSah ? (
            <>
              <button
                onClick={() =>
                  window.open(
                    `http://localhost:8000/api/rtt/generate_pdf.php?id=${id}`,
                  )
                }
                className="px-4 py-2 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white rounded-md text-[11px] font-bold flex items-center gap-2 transition-all"
              >
                <Printer size={14} /> Cetak PDF
              </button>
              <button
                onClick={() =>
                  window.open(
                    `http://localhost:8000/api/rtt/download_encrypted.php?id=${id}`,
                  )
                }
                className="px-4 py-2 bg-emerald-900/40 border border-emerald-600/50 hover:bg-emerald-800/60 text-emerald-400 rounded-md text-[11px] font-bold flex items-center gap-2 transition-all"
              >
                <Lock size={14} /> Unduh Enkripsi
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    window.open(
                      `http://localhost:8000/api/rtt/download_bundle.php?id=${id}&type=sig`,
                    )
                  }
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-[10px] font-bold text-slate-300 flex items-center gap-1.5 transition-all"
                >
                  <Download size={12} /> .SIG
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `http://localhost:8000/api/rtt/download_bundle.php?id=${id}&type=pub`,
                    )
                  }
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-[10px] font-bold text-slate-300 flex items-center gap-1.5 transition-all"
                >
                  <Key size={12} /> .PEM
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-500 rounded-md text-[11px] font-bold">
              {doneCount < 8
                ? `Modul Tersisa: ${8 - doneCount}`
                : "Menunggu Proses"}
            </div>
          )}
        </div>
      </div>

      {/* Progress & Modules List */}
      <div className="bg-[#0b1120] border border-slate-700/50 rounded-lg overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f172a]">
          <div>
            <h3 className="text-[15px] font-bold text-white">
              Kelengkapan Lampiran Dokumen
            </h3>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Lengkapi seluruh formulir dan unggahan berkas di bawah ini.
            </p>
          </div>
          <div className="w-full md:w-64">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>Progres Pengisian</span>
              <span className="text-emerald-400">
                {Math.round((doneCount / 8) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(doneCount / 8) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {docModules.map((doc, idx) => {
            const isMyRole = user?.role === "sysadmin" || user?.role === "kph";
            return (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${doc.done ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400" : "bg-slate-800/50 border-slate-700 text-slate-500"}`}
                  >
                    {doc.done ? <CheckCircle2 size={18} /> : doc.icon}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-200">
                      {doc.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed hidden sm:block">
                      {doc.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                  {isMyRole &&
                  (rtt.status === "draft" ||
                    rtt.status === "revisi_phw" ||
                    rtt.status === "revisi_kph") ? (
                    <button
                      onClick={() => setActiveModal(doc.key)}
                      className={`w-24 py-1.5 text-[11px] font-bold rounded border transition-all ${doc.done ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700" : "bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/40 hover:text-blue-300"}`}
                    >
                      {doc.done ? "Ubah" : "Lengkapi"}
                    </button>
                  ) : (
                    <div className="w-24 text-right sm:text-center text-[10px] text-slate-600 font-bold uppercase">
                      {doc.done ? "Tersimpan" : "-"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm [color-scheme:dark] animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-xl shadow-2xl p-8 max-w-lg w-full shadow-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mb-6 space-y-1">
              <h3 className="text-xl font-bold text-white">
                Input Data{" "}
                <span className="text-emerald-400">
                  {docModules.find((m) => m.key === activeModal)?.name ||
                    activeModal}
                </span>
              </h3>
              <p className="text-slate-400 text-[13px]">
                Lengkapi data spesifik untuk modul ini sebelum pengesahan.
              </p>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-5">
              {activeModal === "summary" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      Bentuk Tebangan Utama
                    </label>
                    <input
                      autoFocus
                      required
                      type="text"
                      name="bentuk_tebangan"
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      placeholder="e.g. TEBANGAN A 2026"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Luas Bruto (Ha)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="luas"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Est. Pohon
                      </label>
                      <input
                        required
                        type="number"
                        name="jumlah_pohon"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      Jenis Kayu
                    </label>
                    <input
                      required
                      type="text"
                      name="jenis_kayu"
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Kayu Perkakas (m³)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="kayu_perkakas"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Kayu Bakar (m³)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="kayu_bakar"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Bambu (btg)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="bambu"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Arang (m³)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="arang"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      Keterangan
                    </label>
                    <textarea
                      name="keterangan"
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark] min-h-[100px]"
                    />
                  </div>
                </div>
              )}
              {/* Upload File untuk Peta dan Peta BAP */}
              {activeModal === "peta" && (
                <div className="space-y-4 border-b border-white/[0.06] pb-4 mb-4">
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Metadata Peta
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Bagian Hutan
                      </label>
                      <input
                        type="text"
                        name="bagian_hutan"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Kelompok Hutan
                      </label>
                      <input
                        type="text"
                        name="kelompok_hutan"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        RPH
                      </label>
                      <input
                        type="text"
                        name="rph"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        BKPH
                      </label>
                      <input
                        type="text"
                        name="bkph"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Jenis Tanaman
                      </label>
                      <input
                        type="text"
                        name="jenis_tanaman"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Jarak Tanam
                      </label>
                      <input
                        type="text"
                        name="jarak_tanam"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Skala
                      </label>
                      <input
                        type="text"
                        name="skala"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Petak
                      </label>
                      <input
                        type="text"
                        name="petak"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Luas Baku (Ha)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="luas_baku"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Panjang (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="panjang"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Kelas Hutan
                      </label>
                      <input
                        type="text"
                        name="kelas_hutan"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Tahun Tanam
                      </label>
                      <input
                        type="number"
                        name="tahun_tanam"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              )}
              {(activeModal === "peta" || activeModal === "peta_bap") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      Pilih File (PDF, JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] || null)
                      }
                      className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"
                    />
                    {uploadFile && (
                      <p className="text-emerald-400 text-[11px]">
                        ✓ {uploadFile.name} (
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      Keterangan Tambahan
                    </label>
                    <input
                      type="text"
                      value={uploadKeterangan}
                      onChange={(e) => setUploadKeterangan(e.target.value)}
                      className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      placeholder="e.g. Lampiran File"
                    />
                  </div>
                </div>
              )}

              {activeModal === "nett" && (
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary flex-1 py-2 text-[11px] flex items-center justify-center gap-2"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".csv";
                        input.onchange = (e: any) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const text = ev.target?.result as string;
                            const lines = text.split("\n");
                            if (lines.length > 1) {
                              const headers = lines[0]
                                .split(",")
                                .map((h) => h.trim());
                              const values = lines[1]
                                .split(",")
                                .map((v) => v.trim());
                              const newFormData = { ...formData };
                              headers.forEach((h, i) => {
                                if (h) newFormData[h] = values[i];
                              });
                              setFormData(newFormData);
                              alert("Data berhasil di-import dari CSV!");
                            }
                          };
                          reader.readAsText(file);
                        };
                        input.click();
                      }}
                    >
                      <FilePlus size={14} /> Import CSV
                    </button>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">
                      Identitas Petak
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Bagian Hutan
                        </label>
                        <input
                          type="text"
                          name="bagian_hutan"
                          value={formData.bagian_hutan || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Petak (Sesuai RPKH)
                        </label>
                        {rpkhDetails.length > 0 ? (
                          <select
                            name="petak"
                            value={formData.petak || ""}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                          >
                            <option value="">-- Pilih Petak --</option>
                            {rpkhDetails.map((d) => (
                              <option key={d.id} value={d.petak}>
                                {d.petak} (Kuota: {d.luas} Ha)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="petak"
                            value={formData.petak || ""}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                            placeholder="e.g. 23A"
                          />
                        )}
                        {formData.petak &&
                          rpkhDetails.find(
                            (x: any) => x.petak === formData.petak,
                          ) && (
                            <p
                              className={`text-[10px] mt-1 ${parseFloat(formData.luas_baku || 0) > parseFloat(rpkhDetails.find((x: any) => x.petak === formData.petak).luas) ? "text-rose-400 font-bold" : "text-emerald-400"}`}
                            >
                              ℹ️ Maksimal Luas RPKH:{" "}
                              {
                                rpkhDetails.find(
                                  (x: any) => x.petak === formData.petak,
                                ).luas
                              }{" "}
                              Ha
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          BKPH
                        </label>
                        <input
                          type="text"
                          name="bkph"
                          value={formData.bkph || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          RPH
                        </label>
                        <input
                          type="text"
                          name="rph"
                          value={formData.rph || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Anak Petak Baru
                        </label>
                        <input
                          type="text"
                          name="anak_petak_baru"
                          value={formData.anak_petak_baru || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        Lokasi & Tanaman
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setFormData((p: any) => ({
                                ...p,
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude,
                              }));
                            });
                          } else alert("Geolocation not supported");
                        }}
                        className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30"
                      >
                        📍 Ambil Koordinat
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          name="latitude"
                          value={formData.latitude || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          name="longitude"
                          value={formData.longitude || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Luas Baku (Ha)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="luas_baku"
                          value={formData.luas_baku || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Jenis Tanaman
                        </label>
                        <input
                          type="text"
                          name="jenis_tanaman"
                          value={formData.jenis_tanaman || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">
                      Data Bonita & Hutan (Auto-fetch)
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Kelas Hutan
                        </label>
                        <input
                          type="text"
                          name="kelas_hutan"
                          value={formData.kelas_hutan || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          BON
                        </label>
                        <input
                          type="text"
                          name="bon"
                          value={formData.bon || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          KBD
                        </label>
                        <input
                          type="text"
                          name="kbd"
                          value={formData.kbd || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          DKN
                        </label>
                        <input
                          type="text"
                          name="dkn"
                          value={formData.dkn || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          N/Ha
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="n_per_ha"
                          value={formData.n_per_ha || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Thn Tanam
                        </label>
                        <input
                          type="number"
                          name="tahun_tanam"
                          value={formData.tahun_tanam || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">
                      Data Tebangan & Volume (m³)
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          AI (m³)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="ai"
                          value={formData.ai || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          AII (m³)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="aii"
                          value={formData.aii || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          AIII (m³)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="aiii"
                          value={formData.aiii || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block text-emerald-400">
                          Jml Volume (Auto)
                        </label>
                        <input
                          readOnly
                          type="number"
                          step="0.01"
                          name="jumlah_volume"
                          value={formData.jumlah_volume || ""}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark] bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Jml Pohon
                        </label>
                        <input
                          type="number"
                          name="jumlah_pohon"
                          value={formData.jumlah_pohon || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Kayu Bakar
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="kayu_bakar"
                          value={formData.kayu_bakar || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Tunggak
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="tunggak"
                          value={formData.tunggak || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Kulit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="kulit"
                          value={formData.kulit || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">
                      Data Lanjutan & Keterangan
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Anak Petak Lama
                        </label>
                        <input
                          type="text"
                          name="anak_petak_lama"
                          value={formData.anak_petak_lama || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Telah Ditebang (m³)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="telah_ditebang"
                          value={formData.telah_ditebang || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Tahun YAD
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="tahun_yad"
                          value={formData.tahun_yad || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Akan Ditebang Teres
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="akan_ditebang_teres"
                          value={formData.akan_ditebang_teres || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Akan Ditebang Non-Teres
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="akan_ditebang_non_teres"
                          value={formData.akan_ditebang_non_teres || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Faktor Koreksi KPH
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="faktor_koreksi_kph"
                          value={formData.faktor_koreksi_kph || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          X Faktor Klem
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="xfaktor_klem"
                          value={formData.xfaktor_klem || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Hasil Lain (Jenis)
                        </label>
                        <input
                          type="text"
                          name="hasil_lain_jenis"
                          value={formData.hasil_lain_jenis || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Satuan
                        </label>
                        <input
                          type="text"
                          name="hasil_lain_satuan"
                          value={formData.hasil_lain_satuan || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Volume
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="hasil_lain_volume"
                          value={formData.hasil_lain_volume || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Alat Mekanis (Jenis)
                        </label>
                        <input
                          type="text"
                          name="alat_mekanis_jenis"
                          value={formData.alat_mekanis_jenis || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Volume Alat Mekanis
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="alat_mekanis_volume"
                          value={formData.alat_mekanis_volume || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Keterangan
                      </label>
                      <textarea
                        name="keterangan"
                        value={formData.keterangan || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeModal === "rekap_klem" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Nomor Blok
                      </label>
                      <input
                        required
                        type="text"
                        name="no_blok"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        placeholder="e.g. Blok 1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Luas Blok (Ha)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="luas_blok"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Jumlah Pohon
                      </label>
                      <input
                        required
                        type="number"
                        name="jumlah_pohon"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Volume (m³)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="volume"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeModal === "klem_detail" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Nomor Pohon
                      </label>
                      <input
                        required
                        type="text"
                        name="no_pohon"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        placeholder="e.g. 001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Jenis Pohon
                      </label>
                      <input
                        required
                        type="text"
                        name="jenis_pohon"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        placeholder="e.g. Jati"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Keliling Batang (cm)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.1"
                        name="keliling"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Volume (m³)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="volume"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeModal === "berita_acara" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Nama Petugas Pemeriksa
                      </label>
                      <input
                        required
                        type="text"
                        name="nama_petugas"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        placeholder="e.g. Ahmad Subarjo"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Jabatan
                      </label>
                      <input
                        required
                        type="text"
                        name="jabatan"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        placeholder="e.g. Kepala KRPH"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      Tanggal Pemeriksaan
                    </label>
                    <input
                      required
                      type="date"
                      name="tanggal"
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      Hasil Pemeriksaan Ringkas
                    </label>
                    <textarea
                      required
                      rows={4}
                      name="hasil_pemeriksaan"
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark] leading-relaxed"
                      placeholder="Tuliskan laporan ringkas hasil pemeriksaan petak di sini..."
                    />
                  </div>
                </div>
              )}

              {activeModal === "ba_detail" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Petak
                      </label>
                      <input
                        required
                        type="text"
                        name="petak"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        placeholder="e.g. 12A"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Anak Petak
                      </label>
                      <input
                        required
                        type="text"
                        name="anak_petak"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                        placeholder="e.g. a"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Luas Baku (Ha)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="luas_baku"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Luas Rencana (Ha)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="luas_rencana"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Jenis Tebangan
                      </label>
                      <input
                        required
                        type="text"
                        name="jenis_tebangan"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        Jenis Tanaman
                      </label>
                      <input
                        required
                        type="text"
                        name="jenis_tanaman"
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      Rencana Volume (m³)
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      name="rencana_volume"
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      Keterangan
                    </label>
                    <textarea
                      name="keterangan"
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-[13px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all [color-scheme:dark] min-h-[80px]"
                    />
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3.5 text-[13px] font-bold disabled:opacity-50"
              >
                {isSubmitting
                  ? "Transmitting Data..."
                  : "Submit Transaksi Data"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Finalize Key Modal */}
      {finalizeKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm [color-scheme:dark] animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-xl shadow-2xl p-8 max-w-lg w-full shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setFinalizeKeyModal(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mb-6 space-y-2">
              <h3 className="text-xl font-bold text-white">
                Masukkan <span className="text-emerald-400">Private Key</span>
              </h3>
              <p className="text-slate-400 text-[12px] font-medium leading-relaxed">
                Untuk mengesahkan secara hukum Rencana Teknik Tahunan ini,
                sistem membutuhkan parameter *Private Key* Anda untuk algoritma
                ECDSA. Key ini tidak akan disimpan di server.
              </p>
            </div>
            <form onSubmit={handleSign} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-semibold block">
                  Konten Private Key (.pem)
                </label>
                <textarea
                  autoFocus
                  required
                  rows={6}
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  className="glass-input w-full px-4 py-3 text-[11px] font-mono leading-relaxed"
                  placeholder={
                    "-----BEGIN ENCRYPTED PRIVATE KEY-----\n...\n-----END ENCRYPTED PRIVATE KEY-----"
                  }
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3.5 text-[13px] font-bold disabled:opacity-50"
              >
                {isSubmitting
                  ? "Generating ECDSA Signature..."
                  : "Validasi Kunci & Finalize RTT"}
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
