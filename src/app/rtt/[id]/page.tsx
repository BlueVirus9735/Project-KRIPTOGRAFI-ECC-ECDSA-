"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import FieldHint from "@/components/FieldHint";
import PrivateKeyModal from "@/components/PrivateKeyModal";
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
  Plus,
  Trash2,
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [authorizingPrint, setAuthorizingPrint] = useState(false);

  const handleAuthorizePrint = async (privateKey: string) => {
    setAuthorizingPrint(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("http://localhost:8000/api/rtt/auth_pdf.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rtt_id: id,
          private_key: privateKey,
        }),
      });
      const result = await res.json();
      if (result.status === "success" && result.url) {
        setShowPrintModal(false);
        window.open(result.url, "_blank");
      } else {
        alert(result.message || "Gagal mengotorisasi Private Key.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan koneksi server: " + (err.message || err));
    } finally {
      setAuthorizingPrint(false);
    }
  };

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
    const { name, value } = e.target;
    if (activeModal === "nett" && name === "petak") {
      const detail = rpkhDetails.find((x: any) => x.petak === value);
      const matchedTebangan = data?.tebangan?.find((t: any) => t.petak === value);
      if (detail) {
        setFormData((prev: any) => ({
          ...prev,
          petak: value,
          anak_petak_baru: matchedTebangan?.anak_petak || prev.anak_petak_baru || "",
          luas_baku: detail.luas || prev.luas_baku || "",
          jenis_tanaman: detail.jenis_tanaman || prev.jenis_tanaman || "",
          kelas_hutan: detail.kelas_hutan || prev.kelas_hutan || "",
          bon: detail.bon || prev.bon || "",
          kbd: detail.kbd || prev.kbd || "",
          dkn: detail.dkn || prev.dkn || "",
          n_per_ha: detail.n_per_ha || prev.n_per_ha || "",
        }));
        return;
      }
    }
    setFormData({ ...formData, [name]: value });
  };

  const handlePetakChange = (e: any) => {
    const selectedPetak = e.target.value;
    const tebangan = data?.tebangan?.find(
      (t: any) => t.petak === selectedPetak,
    );
    if (tebangan) {
      setFormData({
        ...formData,
        petak: tebangan.petak,
        anak_petak: tebangan.anak_petak,
        luas_rencana: tebangan.luas,
      });
    } else {
      setFormData({
        ...formData,
        petak: selectedPetak,
        anak_petak: "",
        luas_rencana: "",
      });
    }
  };

  const handleRekapKlemListChange = (
    index: number,
    field: string,
    value: any,
  ) => {
    const newList = [...(formData.rekap_klem_list || [])];
    newList[index][field] = value;
    setFormData({ ...formData, rekap_klem_list: newList });
  };

  const handleKlemDetailChange = (index: number, field: string, value: any) => {
    const newList = [...(formData.klem_detail_list || [])];
    newList[index][field] = value;
    setFormData({ ...formData, klem_detail_list: newList });
  };

  const handleAddKlemDetailRow = () => {
    const newList = [
      ...(formData.klem_detail_list || []),
      {
        no_blok: "",
        no_pohon: "",
        jenis_pohon: "Jati",
        keliling: "",
        volume: "",
        keterangan: "",
      },
    ];
    setFormData({ ...formData, klem_detail_list: newList });
  };

  const handleRemoveKlemDetailRow = (index: number) => {
    const newList = formData.klem_detail_list?.filter(
      (_: any, i: number) => i !== index,
    );
    setFormData({ ...formData, klem_detail_list: newList });
  };

  const handleOpenModal = (key: string) => {
    if (key === "rekap_klem" && data) {
      const initialList =
        data.tebangan?.map((t: any) => {
          const existing = data.rekap_klem?.find(
            (rk: any) => rk.petak === t.petak && rk.anak_petak === t.anak_petak,
          );
          return {
            kph: data.rtt?.kph || "",
            bkph: data.rtt?.bkph || "",
            rph: data.rtt?.rph || "",
            kelas_hutan: data.nett?.kelas_hutan || "",
            tahun_tanam: data.nett?.tahun_tanam || "",
            luas_baku: data.nett?.luas_baku || "",
            jenis_tanaman: data.nett?.jenis_tanaman || "",
            petak: t.petak || "",
            anak_petak: t.anak_petak || "",
            luas_rencana: t.luas || "",
            no_blok: existing?.no_blok || "Blok 1",
            luas_blok: existing?.luas_blok || "",
            jumlah_pohon: existing?.jumlah_pohon || "",
            volume: existing?.volume || "",
            keterangan: existing?.keterangan || "",
          };
        }) || [];
      setFormData({ rekap_klem_list: initialList });
    } else if (key === "klem_detail" && data) {
      const initialTrees =
        data.klem_detail?.length > 0
          ? data.klem_detail
          : [
              {
                no_blok: "",
                no_pohon: "",
                jenis_pohon: "Jati",
                keliling: "",
                volume: "",
                keterangan: "",
              },
            ];
      setFormData({ klem_detail_list: initialTrees });
    } else if (key === "nett" && data) {
      const existing = data.nett || {};
      const defaultPetak =
        existing.petak ||
        data.tebangan?.[0]?.petak ||
        rpkhDetails?.[0]?.petak ||
        "";
      const matchedDetail = rpkhDetails.find(
        (x: any) => x.petak === defaultPetak,
      );
      const matchedTebangan = data.tebangan?.find(
        (t: any) => t.petak === defaultPetak,
      );

      setFormData({
        ...existing,
        bagian_hutan:
          existing.bagian_hutan ||
          data.rtt?.kph ||
          data.rtt?.rpkh_wilayah ||
          "",
        bkph: existing.bkph || data.rtt?.bkph || "",
        rph: existing.rph || data.rtt?.rph || "",
        petak: defaultPetak,
        anak_petak_baru:
          existing.anak_petak_baru ||
          matchedTebangan?.anak_petak ||
          data.tebangan?.[0]?.anak_petak ||
          "",
        luas_baku:
          existing.luas_baku ||
          matchedDetail?.luas ||
          matchedTebangan?.luas ||
          "",
        jenis_tanaman:
          existing.jenis_tanaman ||
          matchedDetail?.jenis_tanaman ||
          matchedTebangan?.jenis_tanaman ||
          "",
        kelas_hutan: existing.kelas_hutan || matchedDetail?.kelas_hutan || "",
        bon: existing.bon || matchedDetail?.bon || "",
        kbd: existing.kbd || matchedDetail?.kbd || "",
        dkn: existing.dkn || matchedDetail?.dkn || "",
        n_per_ha: existing.n_per_ha || matchedDetail?.n_per_ha || "",
      });
    } else if (key === "summary" && data) {
      const existing = data.summary || {};
      const totalLuas = data.tebangan?.reduce(
        (s: number, t: any) => s + (parseFloat(t.luas) || 0),
        0,
      );
      const totalPohon = data.tebangan?.reduce(
        (s: number, t: any) => s + (parseInt(t.jumlah_pohon) || 0),
        0,
      );
      const totalVolume = data.tebangan?.reduce(
        (s: number, t: any) => s + (parseFloat(t.volume) || 0),
        0,
      );
      setFormData({
        ...existing,
        luas: existing.luas || (totalLuas > 0 ? totalLuas.toString() : ""),
        jumlah_pohon:
          existing.jumlah_pohon ||
          (totalPohon > 0 ? totalPohon.toString() : ""),
        bentuk_tebangan:
          existing.bentuk_tebangan ||
          `Tebangan RTT ${data.rtt?.kph || ""}`.trim(),
        jenis_kayu:
          existing.jenis_kayu ||
          data.tebangan?.[0]?.jenis_tanaman ||
          "Jati",
        kayu_perkakas:
          existing.kayu_perkakas ||
          (totalVolume > 0 ? totalVolume.toString() : ""),
      });
    } else if (key === "peta" && data) {
      const existing = data.peta?.[0] || {};
      const defaultPetak =
        existing.petak ||
        data.tebangan?.[0]?.petak ||
        rpkhDetails?.[0]?.petak ||
        "";
      const matchedDetail = rpkhDetails.find(
        (x: any) => x.petak === defaultPetak,
      );
      setFormData({
        ...existing,
        bagian_hutan:
          existing.bagian_hutan ||
          data.rtt?.kph ||
          data.rtt?.rpkh_wilayah ||
          "",
        kelompok_hutan:
          existing.kelompok_hutan ||
          data.rtt?.rpkh_wilayah ||
          data.rtt?.kph ||
          "",
        bkph: existing.bkph || data.rtt?.bkph || "",
        rph: existing.rph || data.rtt?.rph || "",
        petak: defaultPetak,
        jenis_tanaman:
          existing.jenis_tanaman ||
          matchedDetail?.jenis_tanaman ||
          data.tebangan?.[0]?.jenis_tanaman ||
          "",
        kelas_hutan:
          existing.kelas_hutan ||
          matchedDetail?.kelas_hutan ||
          data.nett?.kelas_hutan ||
          "",
        luas_baku:
          existing.luas_baku ||
          matchedDetail?.luas ||
          data.tebangan?.[0]?.luas ||
          "",
        tahun_tanam:
          existing.tahun_tanam ||
          data.rtt?.rpkh_tahun ||
          data.nett?.tahun_tanam ||
          "",
      });
    } else {
      setFormData(data?.[key] || {});
    }
    setActiveModal(key);
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
        const payloadToSubmit =
          activeModal === "rekap_klem"
            ? formData.rekap_klem_list
            : activeModal === "klem_detail"
              ? formData.klem_detail_list
              : { ...formData };
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

  // ── Validasi Kesesuaian dengan RPKH ──────────────────────────────────────
  const rpkhWarnings: Record<string, string[]> = {};

  // 1. NETT: luas_baku tidak boleh melebihi kuota luas petak di RPKH
  if (nett && rpkhDetails.length > 0) {
    const rpkhPetak = rpkhDetails.find((x: any) => x.petak === nett.petak);
    if (rpkhPetak) {
      if (parseFloat(nett.luas_baku) > parseFloat(rpkhPetak.luas)) {
        rpkhWarnings["nett"] = rpkhWarnings["nett"] || [];
        rpkhWarnings["nett"].push(
          `Luas baku (${nett.luas_baku} Ha) melebihi kuota RPKH petak ${nett.petak} (${rpkhPetak.luas} Ha)`
        );
      }
      if (nett.jenis_tanaman && rpkhPetak.jenis_tanaman &&
        nett.jenis_tanaman.toLowerCase() !== rpkhPetak.jenis_tanaman.toLowerCase()) {
        rpkhWarnings["nett"] = rpkhWarnings["nett"] || [];
        rpkhWarnings["nett"].push(
          `Jenis tanaman "${nett.jenis_tanaman}" tidak sesuai RPKH ("${rpkhPetak.jenis_tanaman}")`
        );
      }
    }
  }

  // 2. Rekap Klem: total volume tidak boleh melebihi volume rencana tebangan
  if (rekap_klem.length > 0 && data.tebangan?.length > 0) {
    const totalVolRencana = data.tebangan.reduce(
      (s: number, t: any) => s + (parseFloat(t.volume) || 0), 0
    );
    const totalVolKlem = rekap_klem.reduce(
      (s: number, rk: any) => s + (parseFloat(rk.volume) || 0), 0
    );
    if (totalVolKlem > totalVolRencana * 1.05) {
      rpkhWarnings["rekap_klem"] = [
        `Total volume Rekap Klem (${totalVolKlem.toFixed(2)} m³) melebihi rencana tebangan (${totalVolRencana.toFixed(2)} m³)`
      ];
    }
  }

  // 3. Summary: luas tidak boleh melebihi total luas rencana tebangan
  if (summary && data.tebangan?.length > 0) {
    const totalLuasRencana = data.tebangan.reduce(
      (s: number, t: any) => s + (parseFloat(t.luas) || 0), 0
    );
    if (parseFloat(summary.luas) > totalLuasRencana * 1.05) {
      rpkhWarnings["summary"] = [
        `Luas Summary (${summary.luas} Ha) melebihi total luas rencana tebangan RTT (${totalLuasRencana.toFixed(2)} Ha)`
      ];
    }
  }

  // 4. Rekap Klem: periksa apakah semua petak tebangan sudah terwakili
  if (rekap_klem.length > 0 && data.tebangan?.length > 0) {
    const petakTebangan = data.tebangan.map((t: any) => t.petak);
    const petakKlem = rekap_klem.map((rk: any) => rk.petak);
    const petakTidakAda = petakTebangan.filter(
      (p: string) => !petakKlem.includes(p)
    );
    if (petakTidakAda.length > 0) {
      rpkhWarnings["rekap_klem"] = rpkhWarnings["rekap_klem"] || [];
      rpkhWarnings["rekap_klem"].push(
        `Petak ${petakTidakAda.join(", ")} belum ada di Rekap Klem`
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

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
    <>
      <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-4">
            <Link
              href="/rtt"
              className="w-9 h-9 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Berkas RTT: {rtt.nomor_dokumen || "Tanpa Nomor"}
              </h2>
              <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                Kesatuan Pemangkuan Hutan {rtt.kph}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-md border text-[11px] font-bold tracking-wider uppercase ${isSah ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-500/50 dark:text-emerald-400" : "bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"}`}
            >
              Status:{" "}
              {isSah ? "SAH & TERENKRIPSI" : rtt.status.replace(/_/g, " ")}
            </div>
          </div>
        </div>

        {/* Security & Audit Info */}
        <div className="glass-card border border-slate-200 dark:border-slate-700/50 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
                Jejak Audit Kriptografi
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-1">
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
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white rounded-md text-[12px] font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Lock size={14} /> {submitting ? "Menandatangani..." : "Ajukan & Tandatangani ke PHW"}
              </button>
            ) : rtt.status === "menunggu_verifikasi_phw" ? (
              <div className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-700/50 dark:text-indigo-400 rounded-md text-[11px] font-bold">
                Menunggu Verifikasi PHW
              </div>
            ) : rtt.status === "menunggu_pengesahan" ? (
              <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400 rounded-md text-[11px] font-bold">
                Menunggu Pengesahan Final
              </div>
            ) : isSah ? (
              <>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-md text-[11px] font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"
                  title="Otorisasi Private Key untuk Cetak / Download PDF Resmi"
                >
                  <Printer size={14} className="text-emerald-600 dark:text-emerald-400" /> Cetak / Download PDF
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      window.open(
                        `http://localhost:8000/api/rtt/download_bundle.php?id=${id}&type=sig`,
                      )
                    }
                    className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
                  >
                    <Download size={12} /> .SIG
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `http://localhost:8000/api/rtt/download_bundle.php?id=${id}&type=pub`,
                      )
                    }
                    className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
                  >
                    <Key size={12} /> .PEM
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-500 rounded-md text-[11px] font-bold">
                {doneCount < 8
                  ? `Modul Tersisa: ${8 - doneCount}`
                  : "Menunggu Proses"}
              </div>
            )}
          </div>
        </div>

        {/* Progress & Modules List */}
        <div className="glass-card border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 dark:bg-[#0f172a]">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                Kelengkapan Lampiran Dokumen
              </h3>
              <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-0.5">
                Lengkapi seluruh formulir dan unggahan berkas di bawah ini.
              </p>
            </div>
            <div className="w-full md:w-64">
              <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                <span>Progres Pengisian</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {Math.round((doneCount / 8) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(doneCount / 8) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
            {docModules.map((doc, idx) => {
              const isMyRole =
                user?.role === "sysadmin" || user?.role === "kph";
              const warnings = rpkhWarnings[doc.key] || [];
              const hasWarning = warnings.length > 0;
              return (
                <div
                  key={idx}
                  className={`p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${hasWarning ? "border-l-2 border-amber-500/70" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${
                          hasWarning
                            ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-500/50 dark:text-amber-400"
                            : doc.done
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500/30 dark:text-emerald-400"
                            : "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500"
                        }`}
                      >
                        {hasWarning ? (
                          <span className="text-base leading-none">⚠️</span>
                        ) : doc.done ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          doc.icon
                        )}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                          {doc.name}
                          {hasWarning && (
                            <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Tidak Sesuai RPKH
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-500 mt-0.5 leading-relaxed hidden sm:block">
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
                          onClick={() => handleOpenModal(doc.key)}
                          className={`w-24 py-1.5 text-[11px] font-bold rounded border transition-all ${
                            hasWarning
                              ? "bg-amber-50 dark:bg-amber-600/20 border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-600/40"
                              : doc.done
                              ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                              : "bg-blue-50 dark:bg-blue-600/20 border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/40"
                          }`}
                        >
                          {doc.done ? "Ubah" : "Lengkapi"}
                        </button>
                      ) : (
                        <div className="w-24 text-right sm:text-center text-[10px] text-slate-500 font-bold uppercase">
                          {doc.done ? "Tersimpan" : "-"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detail Warning Ketidaksesuaian RPKH */}
                  {hasWarning && (
                    <div className="ml-14 space-y-1">
                      {warnings.map((w, wi) => (
                        <div
                          key={wi}
                          className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-900/10 border border-amber-500/20 rounded-md px-3 py-1.5"
                        >
                          <span className="shrink-0 mt-0.5">⚠</span>
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl p-8 w-full relative animate-scale-in max-h-[90vh] overflow-y-auto ${
              activeModal === "klem_detail" ||
              activeModal === "klem" ||
              activeModal === "rekap_klem"
                ? "max-w-5xl"
                : "max-w-lg"
            }`}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mb-6 space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Input Data{" "}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {docModules.find((m) => m.key === activeModal)?.name ||
                    activeModal}
                </span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[13px]">
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
                      placeholder=""
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
                      placeholder=""
                    />
                  </div>
                </div>
              )}

              {activeModal === "nett" && (
                <div className="space-y-6">
                  {/* Banner Terintegrasi Otomatis */}
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
                            placeholder=""
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
                      Data Bonita &amp; Hutan (Auto-fetch)
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          <FieldHint
                            label="Kelas Hutan"
                            title="Kelas Umur Tegakan"
                            description="Pengelompokan umur pohon: KU I (10 thn), KU II (20 thn), dst."
                          />
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
                          <FieldHint
                            label="BON"
                            title="Bonita"
                            description="Kualitas tempat tumbuh pohon. B1 = terbaik, B5 = terburuk."
                          />
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
                          <FieldHint
                            label="KBD"
                            title="Kerapatan Bidang Dasar"
                            description="Luas penampang batang pohon per hektar (m²/Ha). Ukuran kepadatan hutan."
                            align="right"
                          />
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
                          <FieldHint
                            label="DKN"
                            title="Diameter Kuadrat Netto"
                            description="Diameter rata-rata pohon hasil pengukuran, dipakai untuk menghitung volume kayu."
                          />
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
                          <FieldHint
                            label="N/Ha"
                            title="Jumlah Pohon per Hektar"
                            description="Kepadatan tegakan: berapa batang pohon dalam 1 Hektar luas lahan."
                          />
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
                          <FieldHint
                            label="AI (m³)"
                            title="Sortimen Kayu Kelas A-I"
                            description="Kayu berkualitas terbaik: diameter besar, lurus, tanpa cacat. Harga tertinggi."
                          />
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
                          <FieldHint
                            label="AII (m³)"
                            title="Sortimen Kayu Kelas A-II"
                            description="Kayu kualitas menengah: diameter sedang atau sedikit cacat."
                          />
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
                          <FieldHint
                            label="AIII (m³)"
                            title="Sortimen Kayu Kelas A-III"
                            description="Kayu kualitas terendah: diameter kecil atau banyak cacat. Biasanya untuk kayu bakar/arang."
                            align="right"
                          />
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
                          <FieldHint
                            label="Tunggak"
                            title="Volume Tunggak"
                            description="Volume sisa batang pohon yang tertinggal di tanah setelah penebangan."
                          />
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
                          <FieldHint
                            label="Kulit"
                            title="Volume Kulit Kayu"
                            description="Volume bagian kulit kayu yang dipisahkan dari batang saat pengolahan."
                            align="right"
                          />
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
                          <FieldHint
                            label="Tahun YAD"
                            title="Tahun Yang Akan Datang"
                            description="Estimasi volume kayu yang direncanakan untuk ditebang di tahun berikutnya."
                          />
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
                          <FieldHint
                            label="Faktor Koreksi KPH"
                            title="Faktor Koreksi KPH"
                            description="Angka penyesuaian volume berdasarkan kondisi nyata di lapangan menurut data KPH."
                          />
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
                          <FieldHint
                            label="X Faktor Klem"
                            title="Faktor Pengali Klem"
                            description="Koefisien pengurang volume kayu akibat potongan klem (bagian yang tidak bisa dipakai)."
                            align="right"
                          />
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
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {formData.rekap_klem_list?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/60 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/50 pb-2 gap-2">
                        <p className="text-[12px] font-bold text-emerald-400 uppercase tracking-wider">
                          Petak {item.petak} - {item.anak_petak}{" "}
                          <span className="text-slate-400 font-normal">
                            ({item.luas_rencana} Ha)
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                          Kelas {item.kelas_hutan} &bull; {item.jenis_tanaman}{" "}
                          &bull; T.T {item.tahun_tanam}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            Nomor Blok
                          </label>
                          <input
                            required
                            type="text"
                            value={item.no_blok || ""}
                            onChange={(e) =>
                              handleRekapKlemListChange(
                                idx,
                                "no_blok",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            Luas Blok (Ha)
                          </label>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={item.luas_blok || ""}
                            onChange={(e) =>
                              handleRekapKlemListChange(
                                idx,
                                "luas_blok",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            Jml Pohon
                          </label>
                          <input
                            required
                            type="number"
                            value={item.jumlah_pohon || ""}
                            onChange={(e) =>
                              handleRekapKlemListChange(
                                idx,
                                "jumlah_pohon",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            Volume (m³)
                          </label>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={item.volume || ""}
                            onChange={(e) =>
                              handleRekapKlemListChange(
                                idx,
                                "volume",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400 font-semibold block">
                          Keterangan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={item.keterangan || ""}
                          onChange={(e) =>
                            handleRekapKlemListChange(
                              idx,
                              "keterangan",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                          placeholder="Catatan tambahan..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === "klem_detail" && (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-[11px] text-emerald-300 font-medium leading-relaxed">
                      Lengkapi data detail pohon secara individu. Anda dapat
                      menambahkan banyak pohon sekaligus.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddKlemDetailRow}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded flex items-center gap-1"
                    >
                      <Plus size={14} /> Tambah Pohon
                    </button>
                  </div>

                  {formData.klem_detail_list?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/60 relative group space-y-4"
                    >
                      {formData.klem_detail_list.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveKlemDetailRow(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 sm:pt-0">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            Nomor Blok
                          </label>
                          <input
                            required
                            type="text"
                            value={item.no_blok || ""}
                            onChange={(e) =>
                              handleKlemDetailChange(
                                idx,
                                "no_blok",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                            placeholder=""
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            No Pohon
                          </label>
                          <input
                            required
                            type="text"
                            value={item.no_pohon || ""}
                            onChange={(e) =>
                              handleKlemDetailChange(
                                idx,
                                "no_pohon",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                            placeholder=""
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            Jenis Pohon
                          </label>
                          <input
                            required
                            type="text"
                            value={item.jenis_pohon || ""}
                            onChange={(e) =>
                              handleKlemDetailChange(
                                idx,
                                "jenis_pohon",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                            placeholder=""
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            Keliling (cm)
                          </label>
                          <input
                            required
                            type="number"
                            step="0.1"
                            value={item.keliling || ""}
                            onChange={(e) =>
                              handleKlemDetailChange(
                                idx,
                                "keliling",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            Volume (m³)
                          </label>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={item.volume || ""}
                            onChange={(e) =>
                              handleKlemDetailChange(
                                idx,
                                "volume",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 font-semibold block">
                            Keterangan
                          </label>
                          <input
                            type="text"
                            value={item.keterangan || ""}
                            onChange={(e) =>
                              handleKlemDetailChange(
                                idx,
                                "keterangan",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-[12px] bg-[#0b1120] border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all"
                            placeholder="..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
                        placeholder=""
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
                        placeholder=""
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
                        placeholder=""
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
                        placeholder=""
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
                {isSubmitting ? "Transmitting Data..." : "Kirim"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Finalize Key Modal */}
      {finalizeKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl p-8 max-w-lg w-full relative animate-scale-in">
            <button
              onClick={() => setFinalizeKeyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4 shadow-sm">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Otorisasi Tanda Tangan
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-[13px] mb-6">
              Masukkan{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Private Key</span>{" "}
              Anda untuk memvalidasi dan mematenkan dokumen RTT ini menggunakan
              ECDSA.
            </p>
            <form onSubmit={handleSign} className="space-y-4">
              <div>
                <label className="text-[11px] text-slate-700 dark:text-slate-400 font-semibold block text-left mb-1.5 uppercase tracking-wider">
                  Private Key (Format Hex/PEM)
                </label>
                <textarea
                  required
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  className="w-full px-4 py-2.5 text-[13px] bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 transition-all font-mono min-h-[100px]"
                  placeholder="-----BEGIN EC PRIVATE KEY-----&#10;..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !privateKeyInput}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white rounded-md text-[13px] font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <PenTool size={16} /> Enkripsi & Sahkan Dokumen
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL SUBMIT KPH: ECDSA + ECC ENKRIPSI ===== */}
      <PrivateKeyModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={async (privateKey: string) => {
          setShowSubmitModal(false);
          setSubmitting(true);
          try {
            const res = await fetch("http://localhost:8000/api/rtt/submit.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                rtt_id: id,
                token: localStorage.getItem("token"),
                private_key: privateKey,
              }),
            });
            const d = await res.json();
            if (d.status === "success") {
              alert(
                "✅ Dokumen berhasil dikirim ke PHW!\n\n" +
                "📋 Dokumen telah ditandatangani secara digital (ECDSA) oleh KPH\n" +
                "🔒 Dokumen telah dienkripsi menggunakan ECC untuk PHW\n\n" +
                "KPH Hash: " + d.kph_hash
              );
              fetchWorkspace();
            } else {
              alert("❌ " + d.message + (d.detail ? "\n\nDetail: " + d.detail : ""));
            }

          } catch (e) {
            alert("Error server");
          } finally {
            setSubmitting(false);
          }
        }}
        title="Tanda Tangan Digital & Enkripsi Dokumen RTT"
        description="Dokumen akan ditandatangani secara digital menggunakan ECDSA (private key KPH) dan dienkripsi menggunakan ECC untuk PHW. Masukkan private key KPH untuk melanjutkan."
        actionLabel="Tandatangani & Kirim ke PHW"
        loading={submitting}
      />

      {/* Modal Otorisasi Private Key Cetak / Download PDF */}
      <PrivateKeyModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onConfirm={handleAuthorizePrint}
        loading={authorizingPrint}
        title="Otorisasi Private Key Cetak Dokumen"
        description={`Dokumen resmi RTT (${data?.rtt?.nomor_dokumen || "RTT"}) dilindungi enkripsi kriptografi ECC. Unggah file Private Key (.pem / .key) atau tempelkan kuncinya untuk mengotorisasi pencetakan atau pengunduhan file PDF resmi.`}
        actionLabel={authorizingPrint ? "Memverifikasi Kunci..." : "Verifikasi & Buka PDF"}
      />
    </>
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
