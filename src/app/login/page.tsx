"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.status === "success") {
        localStorage.setItem("token", data.token);
        router.push("/");
      } else {
        setError(data.message || "Autentikasi gagal. Periksa kredensial Anda.");
      }
    } catch (err) {
      setError("Kesalahan koneksi ke server pusat.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-200 overflow-hidden font-sans relative flex-col items-center justify-center p-6">
      {/* Global Background Image & Overlay */}
      <div className="absolute inset-0 bg-[#020617] z-0" />
      <div className="absolute inset-0 bg-[url('/pexels-lauripoldre-36099638.jpg')] bg-cover bg-center bg-no-repeat opacity-50 z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#022c22]/60 to-[#020617]/80 z-0" />
      
      {/* Global Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none z-0" />

      {/* Main Centered Container */}
      <div className="w-full max-w-[420px] z-10 animate-scale-in">
        {/* Header / Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl p-2.5 mx-auto mb-5 shadow-2xl border border-white/10">
            <img src="/logo_perhutani.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
            Sistem Manajemen RTT
          </h2>
          <p className="text-emerald-200/80 text-sm font-medium mt-1.5 tracking-wide uppercase">
            Divisi Regional Jawa Barat & Banten
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="mb-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Otentikasi Akses</h3>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg text-sm text-red-200 font-medium flex items-start gap-3 animate-slide-down">
              <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                Identitas Pengguna
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-[#0f172a]/80 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                Kata Sandi Kredensial
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-[#0f172a]/80 border border-slate-700/50 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden rounded-xl p-[1px] mt-4"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-xy" />
              <div className="relative bg-[#022c22] rounded-[11px] px-4 py-3.5 flex items-center justify-center gap-2 transition-all duration-300 group-hover:bg-transparent">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-emerald-200/30 border-t-emerald-200 rounded-full animate-spin" />
                    <span className="font-bold text-sm text-white tracking-wide">Memverifikasi...</span>
                  </>
                ) : (
                  <span className="font-bold text-sm text-white tracking-wide">OTORISASI MASUK</span>
                )}
              </div>
            </button>
          </form>
        </div>

        <div className="mt-8 text-center flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 justify-center backdrop-blur-sm px-3 py-1 rounded-full bg-slate-900/30 border border-slate-800/50">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">Dilindungi Kriptografi Asimetris ECC</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1">© 2026 Hak Cipta Perum Perhutani Divisi Regional Jawa Barat dan Banten.</p>
        </div>
      </div>
    </div>
  );
}
