"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TreePine, Eye, EyeOff, ArrowRight } from "lucide-react";

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
        setError(data.message || "Login gagal");
      }
    } catch (err) {
      setError("Kesalahan koneksi ke server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-mesh-login relative overflow-hidden">
      
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[80px] animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="w-full max-w-[420px] px-6 animate-scale-in relative z-10">
        
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/20 animate-float">
            <TreePine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Sistem Pengelolaan RTT</h1>
          <p className="text-slate-400 text-sm font-medium">Perum Perhutani Divre Jabar & Banten</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 animate-glow">
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium border border-red-500/20 flex items-center gap-2 animate-slide-down">
              <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[12px] font-semibold text-slate-400 mb-2">Username</label>
              <input 
                type="text" 
                className="glass-input w-full px-4 py-3 text-sm"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Masukkan username" 
                required 
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="glass-input w-full px-4 py-3 pr-11 text-sm"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Masukkan password" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk ke Sistem
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <p className="text-[11px] text-slate-500 text-center font-medium">
              Demo: <span className="text-slate-400">admin_kph</span> • <span className="text-slate-400">admin_phw</span> • <span className="text-slate-400">admin_direksi</span> 
              <span className="text-slate-600 block mt-0.5">(password: password)</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600 mt-6 font-medium">
          Dilindungi enkripsi ECC & ECDSA • © 2026 Perhutani
        </p>
      </div>
    </div>
  );
}
