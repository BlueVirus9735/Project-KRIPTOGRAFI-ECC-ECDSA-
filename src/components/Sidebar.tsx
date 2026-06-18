"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Database,
  CheckCircle,
  Shield,
  Archive,
  TreePine,
  Settings,
  Layers,
  Plus,
  Users,
  BarChart2,
  UserCog,
  Map,
  ClipboardList,
  FileCheck,
  PenTool,
  Eye,
  LockOpen,
} from "lucide-react";
import {
  hasPermission,
  hasAnyPermission,
  getRoleDisplayName,
  PERMISSIONS,
  type UserRole,
} from "@/lib/auth";

interface SidebarProps {
  user: {
    id: number;
    username: string;
    nama: string;
    role: UserRole;
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  if (!user) return null;

  const buildNavGroups = () => {
    const groups = [];

    // 1. MENU UTAMA - Dashboard (visible to all authenticated users)
    groups.push({
      title: "Menu Utama",
      items: [
        {
          name: "Dashboard",
          path: "/",
          icon: <LayoutDashboard size={18} />,
          show: hasPermission(user, PERMISSIONS.DASHBOARD_VIEW),
        },
      ].filter((item) => item.show),
    });

    // 2. MANAJEMEN DATA - Based on role
    const manajemenItems = [];

    // RPKH - Viewable by admin, kph, phw
    if (hasPermission(user, PERMISSIONS.RPKH_VIEW)) {
      manajemenItems.push({
        name: "Sistem RPKH",
        path: "/rpkh",
        icon: <Database size={18} />,
      });
    }

    // RTT Documents - Viewable by all roles
    if (hasPermission(user, PERMISSIONS.DOCUMENT_VIEW)) {
      manajemenItems.push({
        name: "Dokumen RTT",
        path: "/rtt",
        icon: <FileText size={18} />,
      });
    }

    // Create RTT - Only admin
    if (hasPermission(user, PERMISSIONS.DOCUMENT_CREATE)) {
      manajemenItems.push({
        name: "Susun RTT",
        path: "/rtt/create",
        icon: <Plus size={18} />,
      });
    }

    // Input Data Sections - Based on role
    if (user.role === "lapangan") {
      manajemenItems.push(
        {
          name: "Daftar Klem",
          path: "/rtt/klem",
          icon: <ClipboardList size={18} />,
        },
        {
          name: "Rekap Klem",
          path: "/rtt/rekap-klem",
          icon: <BarChart2 size={18} />,
        },
        {
          name: "Berita Acara",
          path: "/rtt/berita-acara",
          icon: <FileCheck size={18} />,
        },
      );
    }

    if (user.role === "gis") {
      manajemenItems.push(
        { name: "Peta Lokasi", path: "/rtt/peta", icon: <Map size={18} /> },
        { name: "Peta BAP", path: "/rtt/peta-bap", icon: <Map size={18} /> },
      );
    }

    if (user.role === "admin") {
      manajemenItems.push(
        {
          name: "RTT Summary",
          path: "/rtt/summary",
          icon: <FileText size={18} />,
        },
        { name: "NETT RTT", path: "/rtt/nett", icon: <Database size={18} /> },
      );
    }

    if (manajemenItems.length > 0) {
      groups.push({
        title: "Manajemen Data",
        items: manajemenItems,
      });
    }

    // 3. VALIDASI & WORKFLOW - For KPH, PHW, Divisi
    const validasiItems = [];

    if (
      hasPermission(user, PERMISSIONS.DOCUMENT_REVIEW) ||
      hasPermission(user, PERMISSIONS.DOCUMENT_APPROVE_KPH)
    ) {
      validasiItems.push({
        name: "Review Dokumen",
        path: "/validation",
        icon: <Eye size={18} />,
      });
    }

    if (hasPermission(user, PERMISSIONS.DOCUMENT_VERIFY_PHW)) {
      validasiItems.push({
        name: "Verifikasi PHW",
        path: "/verify",
        icon: <CheckCircle size={18} />,
      });
    }

    if (hasPermission(user, PERMISSIONS.DOCUMENT_FINALIZE)) {
      validasiItems.push({
        name: "Pengesahan Final",
        path: "/finalize",
        icon: <Shield size={18} />,
      });
    }

    if (hasPermission(user, PERMISSIONS.VALIDATION_VIEW)) {
      validasiItems.push(
        {
          name: "Validasi Digital",
          path: "/validation/digital",
          icon: <Shield size={18} />,
        },
        {
          name: "Dekripsi Dokumen",
          path: "/validation/decrypt",
          icon: <LockOpen size={18} />,
        }
      );
    }

    if (validasiItems.length > 0) {
      groups.push({
        title: "Validasi & Workflow",
        items: validasiItems,
      });
    }

    // 4. LAPORAN - For KPH and admin
    const laporanItems = [];

    if (hasPermission(user, PERMISSIONS.REPORT_VIEW)) {
      laporanItems.push(
        {
          name: "Laporan RTT",
          path: "/reports",
          icon: <BarChart2 size={18} />,
        },
        { name: "Statistik", path: "/statistics", icon: <Layers size={18} /> },
      );
    }

    if (laporanItems.length > 0) {
      groups.push({
        title: "Laporan",
        items: laporanItems,
      });
    }

    // 5. ADMINISTRASI - Only for SYSADMIN
    if (user.role === "sysadmin") {
      groups.push({
        title: "Administrasi",
        items: [
          {
            name: "Kelola User",
            path: "/admin/users",
            icon: <UserCog size={18} />,
          },
          {
            name: "Audit Log",
            path: "/admin/audit",
            icon: <ClipboardList size={18} />,
          },
          {
            name: "Pengaturan",
            path: "/admin/settings",
            icon: <Settings size={18} />,
          },
        ],
      });
    }

    return groups.filter((group) => group.items.length > 0);
  };

  const navGroups = buildNavGroups();

  return (
    <aside className="glass-sidebar w-[260px] flex flex-col h-screen shrink-0 relative z-50">
      {/* Brand Header */}
      <div className="h-[72px] flex items-center px-7 gap-3.5 shrink-0 border-b border-white/[0.04]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden bg-white shrink-0">
          <img src="/logo_perhutani.jpg" alt="Logo Perhutani" className="w-full h-full object-contain p-0.5" />
        </div>
        <div>
          <h2 className="text-[13px] font-extrabold text-white tracking-wide">
            PERHUTANI
          </h2>
          <p className="text-[9px] text-slate-500 font-medium tracking-wider">
            divisi regional jawa barat dan banten
          </p>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-7 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? "bg-emerald-500/10 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full" />
                    )}

                    <div
                      className={`${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"} transition-colors`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-[13px] font-semibold ${isActive ? "text-white" : "text-inherit"}`}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-white/[0.04] shrink-0">
        <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
            {user?.nama?.substring(0, 2).toUpperCase() ||
              user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-slate-200 truncate">
              {user?.nama || user?.username}
            </p>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {getRoleDisplayName(user?.role)}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
        </div>
      </div>
    </aside>
  );
}
