"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Shield, AlertCircle } from "lucide-react";

export default function DigitalValidationPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-emerald-400" />
            Validasi Digital
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verifikasi tanda tangan dan hash dokumen
          </p>
        </div>

        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Coming Soon</h2>
          <p className="text-slate-400">
            Halaman validasi digital masih dalam pengembangan.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
