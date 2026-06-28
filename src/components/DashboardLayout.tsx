"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { LogOut, Bell, Search, Hexagon } from "lucide-react";

interface AuthContextType {
  user: any;
  token: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within DashboardLayout");
  return ctx;
};

const API = "http://localhost:8000/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard Overview";
    if (pathname.startsWith("/rtt")) return "Manajemen RTT";
    if (pathname.startsWith("/rpkh")) return "Sistem RPKH";
    if (pathname.startsWith("/validation")) return "Validasi Dokumen";
    if (pathname.startsWith("/verify")) return "Verifikasi Digital";
    return "Aplikasi";
  };

  const getPageDesc = () => {
    if (pathname === "/") return "Ringkasan data operasional";
    if (pathname.startsWith("/rtt")) return "Kelola dokumen rencana teknik tahunan";
    if (pathname.startsWith("/rpkh")) return "Pengelolaan kelestarian hutan";
    if (pathname.startsWith("/validation")) return "Validasi integritas & keaslian";
    if (pathname.startsWith("/verify")) return "Verifikasi tanda tangan ECDSA";
    return "";
  };

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    if (!localToken) {
      router.push("/login");
      setLoading(false);
    } else {
      setToken(localToken);
      fetch(`${API}/auth/me.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: localToken })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
          setToken("");
          router.push("/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken("");
        router.push("/login");
      })
      .finally(() => setLoading(false));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0b1120] bg-mesh">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Memuat sistem...</p>
      </div>
    </div>
  );
  
  if (!user) return null;

  return (
    <AuthContext.Provider value={{ user, token }}>
      <div className="flex h-screen w-full bg-[#0b1120] text-slate-100 font-sans overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar user={user} />
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-mesh relative">
          
          {/* Top Header */}
          <header className="glass-header h-[72px] flex items-center justify-between px-8 z-40 shrink-0">
            <div className="flex flex-col">
              <h1 className="text-[15px] font-bold text-white">{getPageTitle()}</h1>
              <p className="text-[11px] text-slate-500 font-medium">{getPageDesc()}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group hidden lg:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  className="glass-input w-52 py-2 pl-9 pr-4 text-[12px]" 
                />
              </div>

              {/* Notification */}
              <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-all relative">
                <Bell size={18} />
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
              </button>
              
              {/* Divider */}
              <div className="w-px h-8 bg-white/[0.06]" />

              {/* User */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[12px] font-semibold text-slate-200">{user?.nama || user?.username}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{user?.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center text-[11px] font-bold text-slate-300">
                  {(user?.nama || user?.username)?.substring(0, 2).toUpperCase()}
                </div>
              </div>
              
              {/* Logout */}
              <button onClick={handleLogout} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Keluar">
                <LogOut size={17} />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar box-border">
            {children}
          </main>

        </div>
      </div>
    </AuthContext.Provider>
  );
}
