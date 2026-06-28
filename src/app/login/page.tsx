"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, LockKeyhole, Cpu } from "lucide-react";

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
    <div className="min-h-screen flex text-slate-200 overflow-hidden font-sans relative">
      {/* Global Background Image & Overlay */}
      <div className="absolute inset-0 bg-[#020617] z-0" />
      <div className="absolute inset-0 bg-[url('/pexels-lauripoldre-36099638.jpg')] bg-cover bg-center bg-no-repeat opacity-50 z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/95 via-[#022c22]/80 to-[#020617]/95 z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-90 z-0" />
      
      {/* Global Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none z-0" />

      {/* Left Panel: Branding & Identity */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between p-12 border-r border-white/5 z-10">
        <div className="relative z-10 animate-slide-up">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-2xl shadow-black/50 border border-white/10 backdrop-blur-sm">
              <img
                src="/logo_perhutani.jpg"
                alt="Perum Perhutani Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white uppercase drop-shadow-md">
                PERUM PERHUTANI
              </h2>
              <p className="text-emerald-200/80 text-sm font-medium tracking-wide">
                DIVISI REGIONAL JAWA BARAT DAN BANTEN
              </p>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 max-w-2xl mb-12 animate-fade-in stagger-children"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-6 uppercase tracking-widest backdrop-blur-md">
            <ShieldCheck size={14} />
          </div>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 drop-shadow-2xl">
            Sistem Manajemen <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              Dokumen RTT Digital
            </span>
          </h1>
          <p className="text-lg text-emerald-100/70 leading-relaxed font-light">
            Platform digitalisasi dokumen Rencana Teknik Tahunan (RTT) yang
            dilengkapi enkripsi dan tanda tangan digital untuk menjaga keamanan,
            keaslian, dan keutuhan data
          </p>

          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/50 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <LockKeyhole className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Kerahasiaan Terjamin
                </h4>
                <p className="text-xs text-emerald-200/60 mt-1 leading-relaxed">
                  Seluruh file lampiran dan peta lokasi dikunci rapat sehingga
                  aman dari pencurian data.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-900/50 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Keaslian Dokumen
                </h4>
                <p className="text-xs text-teal-200/60 mt-1 leading-relaxed">
                  Mendeteksi setiap perubahan data sekecil apapun secara
                  otomatis untuk mencegah pemalsuan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 relative z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-900/20 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="w-full max-w-[420px] z-10 animate-scale-in">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-20 h-20 bg-white rounded-2xl p-2.5 mx-auto mb-4 shadow-2xl border border-white/10">
              <img
                src="/logo_perhutani.jpg"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="mb-8">
              <h3 className="text-center text-2xl font-bold text-white mb-2 tracking-tight">
                Login Sistem
              </h3>
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
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-[#0f172a] border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukan Username Anda"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-[#0f172a] border border-slate-700/50 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukan Password Anda"
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
                      <span className="font-bold text-sm text-white tracking-wide">
                        Memverifikasi Otorisasi...
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-sm text-white tracking-wide">
                      MASUK
                    </span>
                  )}
                </div>
              </button>
            </form>
          </div>

          <div className="mt-8 text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 justify-center">
              <ShieldCheck size={14} />
              <span className="text-xs font-semibold tracking-wide uppercase">
                Dilindungi oleh Kriptografi Asimetris
              </span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium">
              © 2026 Hak Cipta Perum Perhutani Divisi Regional Jawa Barat dan
              Banten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
