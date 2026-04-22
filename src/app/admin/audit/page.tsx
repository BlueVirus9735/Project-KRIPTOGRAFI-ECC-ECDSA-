"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  ClipboardList, Search, RefreshCw, User, 
  FileText, Edit, Trash2, Plus, Clock
} from "lucide-react";

const API = "http://localhost:8000/api";

interface AuditLog {
  id: number;
  user_id: number;
  username?: string;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values: any;
  new_values: any;
  ip_address: string;
  created_at: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || "") : "";

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API}/auth/audit.php?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.status === "success") {
        setLogs(data.data);
      } else {
        setError(data.message || "Gagal memuat audit log");
      }
    } catch (err) {
      setError("Kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus size={16} className="text-emerald-400" />;
      case 'UPDATE': return <Edit size={16} className="text-blue-400" />;
      case 'DELETE': return <Trash2 size={16} className="text-rose-400" />;
      default: return <FileText size={16} className="text-slate-400" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      UPDATE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      DELETE: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    };
    return colors[action] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
    log.username?.toLowerCase().includes(search.toLowerCase()) ||
    log.ip_address?.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="text-emerald-400" />
              Audit Log
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Riwayat aktivitas user dalam sistem
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Cari audit log..."
              className="glass-input w-full pl-10 pr-4 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Logs Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              Memuat data...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Tidak ada audit log ditemukan
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Waktu</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Aksi</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Entitas</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                          <User size={14} />
                        </div>
                        <span className="text-sm text-white">{log.username || `User #${log.user_id}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getActionBadge(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
