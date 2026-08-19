"use client";

import { HelpCircle } from "lucide-react";

interface FieldHintProps {
  /** Teks singkatan / label pendek, misal: "N/Ha" */
  label: string;
  /** Kepanjangan singkatan, misal: "Jumlah Pohon per Hektar" */
  title: string;
  /** Penjelasan lebih detail (opsional) */
  description?: string;
  /** Posisi tooltip: "top" | "bottom" | "left" | "right" */
  position?: "top" | "bottom" | "left" | "right";
  /** Arah tumbuh tooltip: "left" = tumbuh ke kanan (default), "right" = tumbuh ke kiri (untuk kolom kanan) */
  align?: "left" | "right";
}

/**
 * FieldHint — komponen tooltip keterangan untuk singkatan istilah teknis kehutanan.
 * Menggunakan pure CSS hover (group/group-hover Tailwind) agar tidak flicker.
 *
 * Cara pakai:
 *   <FieldHint label="N/Ha" title="Jumlah Pohon per Hektar" description="Kepadatan tegakan pohon dalam 1 Ha" />
 *   <FieldHint label="BON" title="Bonita" description="Kualitas tempat tumbuh pohon (B1=terbaik)" align="right" />
 */
export default function FieldHint({
  label,
  title,
  description,
  position = "top",
  align = "left",
}: FieldHintProps) {
  const anchorH = align === "right" ? "right-0" : "left-0";
  const arrowH  = align === "right" ? "right-3"  : "left-3";

  const positionClass = {
    top:    `bottom-full ${anchorH} mb-2`,
    bottom: `top-full ${anchorH} mt-2`,
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  }[position];

  const arrowClass = {
    top:    `top-full ${arrowH} border-t-slate-700 border-x-transparent border-b-transparent border-[5px]`,
    bottom: `bottom-full ${arrowH} border-b-slate-700 border-x-transparent border-t-transparent border-[5px]`,
    left:   "left-full top-1/2 -translate-y-1/2 border-l-slate-700 border-y-transparent border-r-transparent border-[5px]",
    right:  "right-full top-1/2 -translate-y-1/2 border-r-slate-700 border-y-transparent border-l-transparent border-[5px]",
  }[position];

  return (
    <span className="inline-flex items-center gap-1">
      {/* Label teks */}
      <span>{label}</span>

      {/* Wrapper group — hover area mencakup icon + tooltip agar tidak flicker */}
      <span className="group relative inline-flex items-center cursor-help">
        {/* Icon tanda tanya */}
        <HelpCircle
          size={11}
          className="text-slate-500 group-hover:text-blue-400 transition-colors"
        />

        {/* Tooltip — hidden by default, tampil saat hover group */}
        <span
          className={`
            absolute ${positionClass} z-50 w-52
            pointer-events-none
            opacity-0 group-hover:opacity-100
            scale-95 group-hover:scale-100
            transition-all duration-150 ease-out
          `}
        >
          <span className="block bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 shadow-2xl shadow-black/40">
            {/* Kepanjangan */}
            <span className="block text-[11px] font-bold text-blue-400 mb-0.5">
              {title}
            </span>
            {/* Deskripsi */}
            {description && (
              <span className="block text-[10px] text-slate-400 leading-relaxed">
                {description}
              </span>
            )}
          </span>
          {/* Arrow */}
          <span className={`absolute border ${arrowClass}`} />
        </span>
      </span>
    </span>
  );
}
