"use client";

import { useEffect, useState } from "react";
import DashboardLayout, { useAuth } from "@/components/DashboardLayout";
import Link from "next/link";
import { 
  FileText, Database, Activity, Clock, ShieldCheck, 
  ChevronDown, Calendar, Users, Tractor, Fuel, Briefcase, TrendingUp
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';

const API = "http://localhost:8000/api";


function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ rpkh: 0, rtt: 0, draft: 0, review: 0, sah: 0 });
  const [dynamicChart, setDynamicChart] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/rtt/list.php`).then(r => r.json()),
      fetch(`${API}/rpkh/list.php`).then(r => r.json())
    ]).then(([rttData, rpkhData]) => {
        const rttList = rttData.data || [];
        const rpkhList = rpkhData.data || [];
        setStats({
            rtt: rttList.length,
            rpkh: rpkhList.length,
            draft: rttList.filter((r:any) => r.status === 'DRAFT').length,
            review: rttList.filter((r:any) => r.status === 'DIAJUKAN').length,
            sah: rttList.filter((r:any) => r.status === 'SAH').length
        });
        
        // Build dynamic chart data
        const dataMap = new Map();
        rttList.forEach((r:any) => {
            const d = new Date(r.created_at);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dataMap.has(dateStr)) dataMap.set(dateStr, { name: dateStr, ts: d.getTime(), rtt: 0, rpkh: 0, draft: 0, sah: 0 });
            const entry = dataMap.get(dateStr);
            entry.rtt++;
            if (r.status === 'DRAFT') entry.draft++;
            if (r.status === 'SAH') entry.sah++;
        });

        rpkhList.forEach((r:any) => {
            const d = new Date(r.created_at);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dataMap.has(dateStr)) dataMap.set(dateStr, { name: dateStr, ts: d.getTime(), rtt: 0, rpkh: 0, draft: 0, sah: 0 });
            dataMap.get(dateStr).rpkh++;
        });

        const sortedData = Array.from(dataMap.values()).sort((a:any, b:any) => a.ts - b.ts);
        
        // Calculate cumulative
        let cumRtt = 0, cumRpkh = 0, cumDraft = 0, cumSah = 0;
        const cumulativeData = sortedData.map((d:any) => {
            cumRtt += d.rtt;
            cumRpkh += d.rpkh;
            cumDraft += d.draft;
            cumSah += d.sah;
            return { name: d.name, rtt: cumRtt, rpkh: cumRpkh, draft: cumDraft, sah: cumSah };
        });

        setDynamicChart(cumulativeData);
    }).catch(err => console.error("Error fetching dashboard stats:", err));
  }, []);

  const cards = [
    { label: "Dokumen RTT", value: stats.rtt, icon: <Briefcase size={20} />, gradient: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-400", borderColor: "border-blue-500/15" },
    { label: "Database RPKH", value: stats.rpkh, icon: <Database size={20} />, gradient: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-400", borderColor: "border-amber-500/15" },
    { label: "Draf RTT", value: stats.draft, icon: <Clock size={20} />, gradient: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-400", borderColor: "border-emerald-500/15" },
    { label: "Validasi & Review", value: stats.review, icon: <Activity size={20} />, gradient: "from-purple-500/20 to-purple-600/5", iconColor: "text-purple-400", borderColor: "border-purple-500/15" },
    { label: "Disahkan", value: stats.sah, icon: <ShieldCheck size={20} />, gradient: "from-rose-500/20 to-rose-600/5", iconColor: "text-rose-400", borderColor: "border-rose-500/15" },
  ];

  return (
    <div className="space-y-8 max-w-full">
      
      {/* 1. Filter Row */}
      <div className="flex items-center gap-3 flex-wrap animate-slide-down">
        <button className="glass-card py-2 px-4 flex items-center gap-3 cursor-pointer hover:border-slate-600/30 transition-all text-[12px] font-semibold text-slate-400">
          Semua Proyek
          <ChevronDown size={14} className="text-slate-600" />
        </button>
        <button className="glass-card py-2 px-4 flex items-center gap-3 cursor-pointer hover:border-slate-600/30 transition-all text-[12px] font-semibold text-slate-400">
          Harian
          <ChevronDown size={14} className="text-slate-600" />
        </button>
        <button className="glass-card py-2 px-4 flex items-center gap-3 cursor-pointer hover:border-slate-600/30 transition-all text-[12px] font-semibold text-slate-400">
          <Calendar size={14} className="text-slate-500" />
          21 April 2026
          <ChevronDown size={14} className="text-slate-600" />
        </button>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
        {cards.map((card, i) => (
          <div 
            key={i} 
            className={`glass-card glass-card-hover bg-gradient-to-br ${card.gradient} to-transparent border ${card.borderColor} p-5 flex flex-col justify-between h-[130px] group transition-all duration-300 cursor-default`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[12px] font-semibold text-slate-300">{card.label}</span>
              <div className={`${card.iconColor} opacity-40 group-hover:opacity-70 transition-opacity`}>
                {card.icon}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{card.value}</h3>
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp size={12} />
                <span className="text-[10px] font-semibold">+12%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Chart Section */}
      <div className="glass-card p-7 relative overflow-hidden animate-fade-in">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-gradient-to-bl from-emerald-500/[0.03] to-transparent pointer-events-none" />
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-[15px] font-bold text-white">Grafik Data RTT</h3>
            <p className="text-[12px] text-slate-500 mt-1 font-medium">Penyusunan & pengelolaan sumber daya</p>
          </div>
          <button className="glass-card px-4 py-2 flex items-center gap-2 text-slate-400 cursor-pointer text-[12px] font-semibold hover:border-slate-600/30 transition-all">
            1 bulan terakhir
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="h-[280px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dynamicChart.length > 0 ? dynamicChart : undefined} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.06)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}} 
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#131c2e', 
                  border: '1px solid rgba(148,163,184,0.1)', 
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}
                itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 500 }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="rtt" name="Dokumen RTT" stroke="#3b82f6" fill="url(#gradBlue)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="rpkh" name="Database RPKH" stroke="#10b981" fill="url(#gradGreen)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="draft" name="Draf RTT" stroke="#f59e0b" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
              <Area type="monotone" dataKey="sah" name="Disahkan" stroke="#8b5cf6" fillOpacity={0} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center gap-8 mt-6 border-t border-white/[0.04] pt-5">
          {[
            { color: 'bg-blue-500', label: 'Dokumen RTT' },
            { color: 'bg-emerald-500', label: 'Database RPKH' },
            { color: 'bg-amber-500', label: 'Draf RTT' },
            { color: 'bg-purple-500', label: 'Disahkan' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default function Home() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
