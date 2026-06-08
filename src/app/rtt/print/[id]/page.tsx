"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = "http://localhost:8000/api";

export default function PrintRttPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/rtt/detail.php?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") {
          setData(d);
          // Automatically trigger print dialog after small delay to render
          setTimeout(() => window.print(), 1000);
        }
      });
  }, [id]);

  if (!data)
    return <div className="p-10 text-center font-mono">Memuat Dokumen...</div>;

  const rtt = data.rtt;
  const summary = data.summary || {};
  const tebangan = data.tebangan || [];

  return (
    <div className="bg-white text-black min-h-screen p-10 font-serif max-w-[21cm] mx-auto shadow-2xl">
      {rtt.crypto_status === "corrupt" && (
        <div className="bg-red-100 text-red-800 border-4 border-red-600 p-4 mb-6 text-center font-bold text-sm rounded-lg">
          ⚠️ PERINGATAN INTEGRITAS: DATA TELAH DIMANIPULASI secara ilegal!
          <br />
          <span className="text-xs font-mono font-normal">
            (Hash SHA-256 tidak cocok dengan tanda tangan digital atau database
            asli)
          </span>
        </div>
      )}
      {/* KOP SURAT PERHUTANI */}
      <div className="border-b-4 border-black pb-4 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest">
            PERUM PERHUTANI
          </h1>
          <h2 className="text-lg font-bold">
            DIVISI REGIONAL JAWA BARAT & BANTEN
          </h2>
          <p className="text-sm">
            KPH: {rtt.kph} | BKPH: {rtt.bkph} | RPH: {rtt.rph}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Dokumen Rahasia / Terbatas</p>
          <p className="font-mono text-sm mt-1">ID: {rtt.id}</p>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-xl font-bold uppercase underline">
          Rencana Teknik Tahunan (RTT)
        </h2>
        <p className="font-bold mt-1">Nomor: {rtt.nomor_dokumen}</p>
        <p className="text-sm mt-1">Tanggal Terbit: {rtt.tanggal}</p>
      </div>

      {/* SUMMARY DATA */}
      <div className="mb-8">
        <h3 className="font-bold bg-gray-200 py-1 px-2 border border-black mb-2">
          A. RINGKASAN RTT
        </h3>
        <table className="w-full border-collapse border border-black text-sm">
          <tbody>
            <tr>
              <td className="border border-black px-3 py-2 font-semibold w-1/3">
                Bentuk Tebangan
              </td>
              <td className="border border-black px-3 py-2">
                {summary.bentuk_tebangan || "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-2 font-semibold">
                Total Luas (Ha)
              </td>
              <td className="border border-black px-3 py-2">
                {summary.luas || "-"} Ha
              </td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-2 font-semibold">
                Jenis Kayu Utama
              </td>
              <td className="border border-black px-3 py-2">
                {summary.jenis_kayu || "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-2 font-semibold">
                Total Jumlah Pohon
              </td>
              <td className="border border-black px-3 py-2">
                {summary.jumlah_pohon || "0"} Pohon
              </td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-2 font-semibold">
                Estimasi Kayu Perkakas / Bakar
              </td>
              <td className="border border-black px-3 py-2">
                {summary.kayu_perkakas || "0"} m³ / {summary.kayu_bakar || "0"}{" "}
                sm
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* DETAIL TEBANGAN */}
      <div className="mb-8">
        <h3 className="font-bold bg-gray-200 py-1 px-2 border border-black mb-2">
          B. RINCIAN PETAK TEBANGAN
        </h3>
        <table className="w-full border-collapse border border-black text-sm text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-2">No</th>
              <th className="border border-black px-2 py-2">Petak</th>
              <th className="border border-black px-2 py-2">Anak Petak</th>
              <th className="border border-black px-2 py-2">Luas (Ha)</th>
              <th className="border border-black px-2 py-2">Jenis Tanaman</th>
              <th className="border border-black px-2 py-2">Jml Pohon</th>
              <th className="border border-black px-2 py-2">Volume (m³)</th>
            </tr>
          </thead>
          <tbody>
            {tebangan.map((t: any, i: number) => (
              <tr key={i}>
                <td className="border border-black px-2 py-1">
                  {t.nomor || i + 1}
                </td>
                <td className="border border-black px-2 py-1">{t.petak}</td>
                <td className="border border-black px-2 py-1">
                  {t.anak_petak}
                </td>
                <td className="border border-black px-2 py-1">{t.luas}</td>
                <td className="border border-black px-2 py-1">
                  {t.jenis_tanaman}
                </td>
                <td className="border border-black px-2 py-1">
                  {t.jumlah_pohon}
                </td>
                <td className="border border-black px-2 py-1">{t.volume}</td>
              </tr>
            ))}
            {tebangan.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="border border-black px-2 py-4 italic"
                >
                  Belum ada rincian petak
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CRYPTOGRAPHY SIGNATURE BLOCK */}
      <div className="mt-16 pt-8 border-t-2 border-dashed border-gray-400">
        <h3 className="font-bold text-center mb-6 uppercase">
          PENGESAHAN DOKUMEN DIGITAL (CRYPTOGRAPHY)
        </h3>

        <div className="flex justify-between items-start">
          <div className="w-1/2 text-xs font-mono text-gray-600 space-y-3">
            <div>
              <p className="font-bold text-black">DOCUMENT HASH (SHA-256):</p>
              <p className="break-all">{rtt.hash || "Belum di-hash"}</p>
            </div>
            <div>
              <p className="font-bold text-black">ECDSA SIGNATURE:</p>
              <p className="break-all text-[10px] bg-gray-100 p-2 rounded border border-gray-300">
                {rtt.signature || "Belum ditandatangani"}
              </p>
            </div>
          </div>

          <div className="w-1/3 text-center border border-black p-4">
            <p className="font-bold text-sm mb-6">Telah Disahkan Oleh:</p>
            <div className="w-28 h-28 mx-auto border-2 border-black flex items-center justify-center bg-gray-50 mb-6 relative">
              {rtt.status === "disahkan" ? (
                rtt.crypto_status === "corrupt" ? (
                  <span className="text-red-600 font-extrabold rotate-[-15deg] text-xs border-4 border-red-600 px-1 py-1 text-center bg-red-50 z-10 leading-tight">
                    INVALID
                    <br />
                    (MUTASI DATA)
                  </span>
                ) : (
                  <span className="text-green-700 font-bold rotate-[-15deg] text-xl border-4 border-green-700 px-2 py-1">
                    VALID
                  </span>
                )
              ) : (
                <span className="text-red-500 font-bold text-sm">
                  NOT SIGNED
                </span>
              )}
            </div>
            <p className="font-bold uppercase">
              DIVISI REGIONAL JAWA BARAT & BANTEN
            </p>
            <p className="text-xs mt-1">Sistem RTT Digital Perhutani</p>
          </div>
        </div>
      </div>
      {/* Style to hide browser elements when printing */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .max-w-[21cm] { max-w: 100%; box-shadow: none; }
          @page { margin: 1cm; }
        }
      `,
        }}
      />
    </div>
  );
}
