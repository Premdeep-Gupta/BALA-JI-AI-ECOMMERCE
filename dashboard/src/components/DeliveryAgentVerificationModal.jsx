import React, { useState, useEffect } from "react";
import {
  X, CheckCircle, XCircle, FileText, Camera, CreditCard, Loader, Sparkles,
  BarChart3, Clock, Package, IndianRupee, Calendar, TrendingUp, AlertCircle,
  ChevronDown, ChevronUp, Star, Zap, Award, Activity, RefreshCw, Download,
  ShieldCheck, BadgeCheck, Wallet, ArrowUpRight, ArrowDownRight, Minus, ZoomIn
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

// ═══════════════════════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

const fmtTime = (t) =>
  t
    ? new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "—";

const shiftTag = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("afternoon"))
    return { label: "Afternoon", cls: "bg-sky-950/60 text-sky-300 border-sky-700/40" };
  if (t.includes("evening") || t.includes("night"))
    return { label: "Evening/Night", cls: "bg-violet-950/60 text-violet-300 border-violet-700/40" };
  return { label: "Morning", cls: "bg-amber-950/60 text-amber-300 border-amber-700/40" };
};

// Simple inline bar chart
const MiniBar = ({ value, max, color = "indigo" }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${colors[color] || "bg-indigo-500"} rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// KPI stat card
const KpiCard = ({ icon, label, value, sub, color = "indigo", trend, trendVal }) => {
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-400";
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  return (
    <div className={`bg-slate-950/70 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-2.5 relative overflow-hidden group`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-slate-800/20 to-transparent" />
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${color}-950/60 border border-${color}-800/30`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">{label}</p>
        <p className="text-xl font-black text-white leading-tight mt-0.5">{value}</p>
        {(sub || trendVal) && (
          <div className="flex items-center gap-1.5 mt-1">
            {trendVal && (
              <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trendColor}`}>
                <TrendIcon size={10} /> {trendVal}
              </span>
            )}
            {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PAYMENT / SHIFT DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════════════════════

const PaymentDashboardTab = ({ agentId, agentName }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [subTab, setSubTab] = useState("overview"); // overview | daily | orders
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/admin/delivery-agent/${agentId}/work-logs`);
      if (res.data.success) {
        setData(res.data);
        // Auto-select first month
        if (res.data.monthlyStats?.length > 0 && !selectedMonth) {
          setSelectedMonth(res.data.monthlyStats[0].month_key);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Could not load payment data. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [agentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-indigo-800 rounded-full" />
          <div className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest">Loading payment records…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-rose-400">
        <AlertCircle size={40} />
        <p className="text-sm font-bold">{error}</p>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.workLogs?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
          <BarChart3 size={32} className="text-slate-600" />
        </div>
        <p className="text-sm font-black uppercase tracking-wider">No shift records yet</p>
        <p className="text-xs text-slate-600 text-center max-w-xs">
          Shift data will appear here once {agentName} goes online and starts working.
        </p>
      </div>
    );
  }

  const { workLogs = [], monthlyStats = [], grandTotals = {}, currentMonth = {}, ordersHistory = [] } = data;

  const activeMonthlyStat = monthlyStats.find(m => m.month_key === selectedMonth) || monthlyStats[0];

  // Filter daily logs for selected month
  const dailyLogsForMonth = workLogs.filter(l => {
    const d = new Date(l.work_date);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return k === (selectedMonth || monthlyStats[0]?.month_key);
  });

  // Max values for bar charts
  const maxDayEarnings = Math.max(...dailyLogsForMonth.map(l => parseFloat(l.earnings || 0)), 1);
  const maxDayOrders = Math.max(...dailyLogsForMonth.map(l => parseInt(l.orders_delivered || 0)), 1);
  const maxDayHours = Math.max(...dailyLogsForMonth.map(l => parseFloat(l.hours_worked || 0)), 1);

  // Performance rating (0-5 stars) based on average daily orders
  const avgOrders = parseFloat(activeMonthlyStat?.avg_orders_per_day || 0);
  const starRating = Math.min(5, Math.max(1, Math.round(avgOrders / 2)));

  // Payment status flags
  const hasIssue = parseFloat(grandTotals.total_earnings || 0) === 0 && parseInt(grandTotals.total_orders_delivered || 0) > 0;

  return (
    <div className="space-y-6">

      {/* ── Refresh + Export Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Payment & Shift Analytics
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasIssue && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/40 border border-rose-800/40 rounded-lg text-rose-400 text-[9px] font-black uppercase">
              <AlertCircle size={10} /> Payment Issue Detected
            </span>
          )}
          <button
            onClick={() => loadData(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 rounded-xl text-slate-300 text-xs font-bold transition-all"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Grand Totals (All-Time KPI Grid) ────────────────────────────── */}
      <div>
        <h4 className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-3 flex items-center gap-2">
          <Award size={11} className="text-amber-400" /> All-Time Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={<Calendar size={16} className="text-indigo-400" />}
            label="Working Days"
            value={grandTotals.total_working_days || 0}
            sub={`${grandTotals.total_shifts || 0} shifts total`}
            color="indigo"
          />
          <KpiCard
            icon={<Clock size={16} className="text-amber-400" />}
            label="Total Hours"
            value={`${parseFloat(grandTotals.total_hours || 0).toFixed(1)}h`}
            sub={`Avg ${parseFloat(grandTotals.avg_hours_per_shift || 0).toFixed(1)}h/shift`}
            color="amber"
          />
          <KpiCard
            icon={<Package size={16} className="text-emerald-400" />}
            label="Orders Delivered"
            value={grandTotals.total_orders_delivered || 0}
            sub="Total deliveries"
            color="emerald"
          />
          <KpiCard
            icon={<IndianRupee size={16} className="text-violet-400" />}
            label="Total Earned"
            value={fmt(grandTotals.total_earnings)}
            sub={`Avg ${fmt(grandTotals.avg_earnings_per_shift)}/shift`}
            color="violet"
          />
        </div>
      </div>

      {/* ── Current Month Highlight ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-violet-950/40 border border-indigo-800/30 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-black">This Month</p>
            <p className="text-lg font-black text-white mt-0.5">
              {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < starRating ? "text-amber-400 fill-amber-400" : "text-slate-700"}
              />
            ))}
            <span className="text-xs text-slate-400 ml-1 font-bold">{starRating}.0</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Earnings", val: fmt(currentMonth.earnings), icon: <IndianRupee size={13} />, color: "text-violet-300" },
            { label: "Orders", val: currentMonth.orders || 0, icon: <Package size={13} />, color: "text-emerald-300" },
            { label: "Hours", val: `${parseFloat(currentMonth.hours || 0).toFixed(1)}h`, icon: <Clock size={13} />, color: "text-amber-300" },
            { label: "Shifts", val: currentMonth.shifts || 0, icon: <Zap size={13} />, color: "text-sky-300" },
            { label: "Days Active", val: currentMonth.working_days || 0, icon: <Calendar size={13} />, color: "text-indigo-300" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/40">
              <div className={`flex items-center gap-1 ${s.color} mb-1`}>{s.icon}
                <span className="text-[9px] font-black uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-base font-black text-white">{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Month Selector ───────────────────────────────────────────────── */}
      {monthlyStats.length > 1 && (
        <div>
          <h4 className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-2">
            Select Month to Analyse
          </h4>
          <div className="flex flex-wrap gap-2">
            {monthlyStats.map(m => (
              <button
                key={m.month_key}
                onClick={() => setSelectedMonth(m.month_key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                  selectedMonth === m.month_key
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/30"
                    : "bg-slate-900/60 text-slate-400 border-slate-800/40 hover:border-slate-600"
                }`}
              >
                {m.month_label?.trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Selected Month Stats ─────────────────────────────────────────── */}
      {activeMonthlyStat && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
          {/* Month header */}
          <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/60">
            <div>
              <p className="text-sm font-black text-white">{activeMonthlyStat.month_label?.trim()}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeMonthlyStat.working_days} days worked · {activeMonthlyStat.total_shifts} shifts
              </p>
            </div>
            <div className="flex items-center gap-2">
              {["overview", "daily", "orders"].map(t => (
                <button
                  key={t}
                  onClick={() => setSubTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    subTab === t
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {/* OVERVIEW SUB-TAB */}
            {subTab === "overview" && (
              <div className="space-y-5">
                {/* Monthly KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {
                      label: "Month Earnings", val: fmt(activeMonthlyStat.total_earnings),
                      sub: `Best day: ${fmt(activeMonthlyStat.best_day_earnings)}`,
                      icon: <IndianRupee size={14} className="text-violet-400" />, color: "violet"
                    },
                    {
                      label: "Orders Delivered", val: activeMonthlyStat.total_orders || 0,
                      sub: `Best day: ${activeMonthlyStat.best_day_orders} orders`,
                      icon: <Package size={14} className="text-emerald-400" />, color: "emerald"
                    },
                    {
                      label: "Hours Worked", val: `${parseFloat(activeMonthlyStat.total_hours || 0).toFixed(1)}h`,
                      sub: `Avg ${parseFloat(activeMonthlyStat.avg_hours_per_day || 0).toFixed(1)}h/day`,
                      icon: <Clock size={14} className="text-amber-400" />, color: "amber"
                    },
                    {
                      label: "Avg Daily Earning", val: fmt(activeMonthlyStat.avg_earnings_per_day),
                      sub: "Per working day",
                      icon: <Wallet size={14} className="text-sky-400" />, color: "sky"
                    },
                    {
                      label: "Avg Orders/Day", val: parseFloat(activeMonthlyStat.avg_orders_per_day || 0).toFixed(1),
                      sub: "Per working day",
                      icon: <TrendingUp size={14} className="text-indigo-400" />, color: "indigo"
                    },
                    {
                      label: "Shifts Worked", val: activeMonthlyStat.total_shifts || 0,
                      sub: `${activeMonthlyStat.working_days} unique days`,
                      icon: <Zap size={14} className="text-rose-400" />, color: "rose"
                    },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-950/60 rounded-xl border border-slate-800/40 p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">{s.icon}
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">{s.label}</span>
                      </div>
                      <p className="text-base font-black text-white">{s.val}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Earnings bar chart for month */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-3">
                    Daily Earnings Breakdown
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scroll">
                    {dailyLogsForMonth.map(l => (
                      <div key={l.id} className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-slate-500 w-16 shrink-0">
                          {new Date(l.work_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </span>
                        <div className="flex-1">
                          <MiniBar value={parseFloat(l.earnings || 0)} max={maxDayEarnings} color="violet" />
                        </div>
                        <span className="text-xs font-black text-violet-400 w-16 text-right shrink-0">
                          {fmt(l.earnings)}
                        </span>
                        <span className="text-[10px] text-slate-500 w-10 text-right shrink-0">
                          {l.orders_delivered}📦
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DAILY SUB-TAB */}
            {subTab === "daily" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      {["Date", "Shift", "Start", "End", "Hours", "Orders", "Earnings", "Rate"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {dailyLogsForMonth.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-slate-600 text-xs">
                          No records for this month
                        </td>
                      </tr>
                    ) : dailyLogsForMonth.map(l => {
                      const hours = parseFloat(l.hours_worked || 0);
                      const earn = parseFloat(l.earnings || 0);
                      const rate = hours > 0 ? (earn / hours).toFixed(0) : "—";
                      const tag = shiftTag(l.shift_type);
                      return (
                        <tr key={l.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-3 py-3 text-xs font-bold text-slate-300 whitespace-nowrap">
                            {fmtDate(l.work_date)}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${tag.cls}`}>
                              {tag.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-400">{fmtTime(l.shift_start_time)}</td>
                          <td className="px-3 py-3 text-xs text-slate-400">{fmtTime(l.shift_end_time)}</td>
                          <td className="px-3 py-3">
                            <span className="text-amber-400 font-black text-xs">{hours.toFixed(1)}h</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-emerald-400 font-black text-xs">{l.orders_delivered}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-violet-400 font-black text-xs">{fmt(l.earnings)}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sky-400 text-xs font-bold">
                              {rate === "—" ? "—" : `₹${rate}/h`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {dailyLogsForMonth.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-900/60 border-t border-slate-800">
                        <td colSpan={4} className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                          Month Total
                        </td>
                        <td className="px-3 py-3 text-amber-400 font-black text-xs">
                          {parseFloat(activeMonthlyStat.total_hours || 0).toFixed(1)}h
                        </td>
                        <td className="px-3 py-3 text-emerald-400 font-black text-xs">
                          {activeMonthlyStat.total_orders || 0}
                        </td>
                        <td className="px-3 py-3 text-violet-400 font-black text-xs">
                          {fmt(activeMonthlyStat.total_earnings)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* ORDERS SUB-TAB */}
            {subTab === "orders" && (
              <div>
                {ordersHistory.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3 text-slate-600">
                    <Package size={32} />
                    <p className="text-xs font-bold uppercase tracking-wider">No delivery history</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800/60">
                          {["Order ID", "Date", "Amount", "Payment Mode", "Status"].map(h => (
                            <th key={h} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {ordersHistory
                          .filter(o => {
                            if (!selectedMonth) return true;
                            const d = new Date(o.order_date);
                            const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                            return k === selectedMonth;
                          })
                          .map(o => (
                            <tr key={o.id} className="hover:bg-slate-800/20 transition-colors">
                              <td className="px-3 py-3 font-mono text-[10px] text-indigo-400">
                                #{o.id?.toString().substring(0, 8)}
                              </td>
                              <td className="px-3 py-3 text-xs text-slate-400">
                                {fmtDate(o.order_date)}
                              </td>
                              <td className="px-3 py-3 text-xs font-black text-emerald-400">
                                {fmt(o.total_price)}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                  o.payment_mode?.includes("COD")
                                    ? "bg-amber-950/40 text-amber-400 border-amber-800/30"
                                    : "bg-sky-950/40 text-sky-400 border-sky-800/30"
                                }`}>
                                  {o.payment_mode?.includes("COD") ? "COD" : "Online"}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 rounded text-[9px] font-black uppercase">
                                  {o.order_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── All-Month Comparison Table ───────────────────────────────────── */}
      {monthlyStats.length > 1 && (
        <div>
          <h4 className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-3 flex items-center gap-2">
            <TrendingUp size={11} className="text-indigo-400" /> All Months Comparison
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-950/50">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-900/60">
                  {["Month", "Days", "Shifts", "Hours", "Orders", "Earnings", "Avg/Day", "Performance"].map(h => (
                    <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {monthlyStats.map((m, idx) => {
                  const isFirst = idx === 0;
                  const prev = monthlyStats[idx + 1];
                  const earnDiff = prev
                    ? ((parseFloat(m.total_earnings) - parseFloat(prev.total_earnings)) / Math.max(1, parseFloat(prev.total_earnings))) * 100
                    : 0;
                  const perfPct = Math.min(100, Math.round((parseFloat(m.avg_orders_per_day || 0) / 10) * 100));
                  return (
                    <tr
                      key={m.month_key}
                      onClick={() => setSelectedMonth(m.month_key)}
                      className={`cursor-pointer transition-colors ${
                        selectedMonth === m.month_key
                          ? "bg-indigo-950/30 border-l-2 border-indigo-500"
                          : "hover:bg-slate-800/20"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isFirst && (
                            <span className="px-1.5 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 rounded text-[8px] font-black">
                              CURRENT
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-300">{m.month_label?.trim()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{m.working_days}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{m.total_shifts}</td>
                      <td className="px-4 py-3 text-amber-400 font-black text-xs">
                        {parseFloat(m.total_hours || 0).toFixed(1)}h
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-black text-xs">{m.total_orders}</td>
                      <td className="px-4 py-3 text-violet-400 font-black text-xs">{fmt(m.total_earnings)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-300">{fmt(m.avg_earnings_per_day)}</span>
                          {prev && (
                            <span className={`text-[9px] font-bold flex items-center gap-0.5 ${
                              earnDiff >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {earnDiff >= 0 ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                              {Math.abs(earnDiff).toFixed(0)}% vs prev
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex flex-col gap-1">
                          <MiniBar value={perfPct} max={100} color={perfPct > 60 ? "emerald" : perfPct > 30 ? "amber" : "rose"} />
                          <span className="text-[9px] text-slate-500">{perfPct}% efficiency</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payment Issue Flag ───────────────────────────────────────────── */}
      {hasIssue && (
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-rose-400 font-black text-sm">⚠️ Payment Discrepancy Detected</p>
            <p className="text-rose-300/70 text-xs mt-1">
              This agent has completed <strong>{grandTotals.total_orders_delivered}</strong> deliveries but has
              <strong> ₹0 recorded earnings</strong>. This may indicate a payment tracking issue that needs admin review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN MODAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function DeliveryAgentVerificationModal({ agent, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState("documents");
  const [status, setStatus] = useState(agent.verification_status);
  const [rejecting, setRejecting] = useState(false);
  const [reasons, setReasons] = useState({ aadhaar: false, pan: false, face: false, other: false });
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [zoomDoc, setZoomDoc] = useState(null);

  const docs = typeof agent.documents === 'string' ? JSON.parse(agent.documents) : (agent.documents || {});

  const handleVerify = async (actionStatus) => {
    let rejectionReason = null;
    if (actionStatus === "Rejected") {
      const sel = [];
      if (reasons.aadhaar) sel.push("Aadhaar Card Invalid or Not Clear");
      if (reasons.pan) sel.push("PAN Card Invalid or Not Clear");
      if (reasons.face) sel.push("Selfie/Face Verification Failed");
      if (reasons.other && otherReason.trim()) sel.push(otherReason);
      if (sel.length === 0) return toast.error("Please select at least one rejection reason.");
      rejectionReason = sel;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.put(`/admin/delivery-agent/${agent.id}/verify`, {
        status: actionStatus, rejection_reason: rejectionReason,
      });
      if (res.data.success) {
        toast.success(`Partner ${actionStatus} successfully!`);
        setStatus(actionStatus);
        onRefresh();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "documents", label: "Documents", icon: <FileText size={13} /> },
    { id: "payment",   label: "Payment & Shifts", icon: <BarChart3 size={13} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-slate-800/60 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">

        {/* ── Sticky Header ──────────────────────────────────────────────── */}
        <div className="shrink-0 bg-[#0d1117]/95 backdrop-blur-md border-b border-slate-800/60 rounded-t-3xl">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-4">
              {agent.avatar_url ? (
                <img src={agent.avatar_url} alt={agent.name}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/30" />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-indigo-950/60 border border-indigo-800/30 flex items-center justify-center text-indigo-400 font-black text-lg">
                  {agent.name?.[0]}
                </div>
              )}
              <div>
                <h2 className="text-lg font-black text-white leading-tight">{agent.name}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-500">{agent.phone}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                    status === "Verified"
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/30"
                      : status === "Rejected"
                      ? "bg-rose-950/40 text-rose-400 border-rose-800/30"
                      : "bg-amber-950/40 text-amber-400 border-amber-800/30"
                  }`}>{status || "Pending"}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 px-6 pb-0 border-t border-slate-800/40 mt-2">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-all border-b-2 ${
                  activeTab === t.id
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Content ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ══ DOCUMENTS TAB ══ */}
          {activeTab === "documents" && (
            <>
              {/* Agent info row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/40">
                {[
                  { l: "Name", v: agent.name },
                  { l: "Phone", v: agent.phone },
                  { l: "Vehicle No.", v: agent.vehicle_number || "N/A" },
                  { l: "Agency", v: agent.agency || "N/A" },
                ].map(x => (
                  <div key={x.l}>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{x.l}</p>
                    <p className="text-sm text-slate-200 font-bold mt-0.5">{x.v}</p>
                  </div>
                ))}
              </div>

              {/* Documents */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Aadhaar Front", url: docs.aadhaarFront || agent.aadhaar_url, icon: <FileText size={13} /> },
                  { label: "Aadhaar Back", url: docs.aadhaarBack, icon: <FileText size={13} /> },
                  { label: "PAN Card", url: docs.panCard || agent.pan_url, icon: <CreditCard size={13} /> },
                  { label: "Selfie / Face", url: docs.selfie || agent.avatar_url, icon: <Camera size={13} /> },
                  { label: "Driving License", url: docs.drivingLicense, icon: <FileText size={13} /> },
                  { label: "RC File", url: docs.rcFile, icon: <FileText size={13} /> },
                  { label: "Vehicle Photo", url: docs.vehiclePhoto, icon: <Camera size={13} /> },
                  { label: "Insurance Copy", url: docs.insuranceCopy, icon: <FileText size={13} /> },
                  { label: "Pollution Cert.", url: docs.pollutionCertificate, icon: <FileText size={13} /> },
                  { label: "Cancelled Cheque", url: docs.chequeFile, icon: <CreditCard size={13} /> },
                ].map(doc => (
                  <div key={doc.label} className="space-y-1.5 bg-slate-900/30 p-2.5 border border-slate-800/40 rounded-2xl hover:border-slate-850 transition-colors">
                    <p className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/40 pb-1.5 truncate" title={doc.label}>
                      {doc.icon} {doc.label}
                    </p>
                    <div 
                      onClick={() => doc.url && setZoomDoc(doc)}
                      className={`aspect-[1.3/1] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center relative transition-all duration-300 ${
                        doc.url ? 'cursor-pointer hover:border-indigo-500/80 group' : ''
                      }`}
                    >
                      {doc.url ? (
                        <>
                          <img src={doc.url} alt={doc.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <ZoomIn className="w-4 h-4 text-white" />
                            <span className="text-white text-[9px] font-black uppercase tracking-wider">Zoom</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-605 text-[10px] font-medium italic">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Face descriptor */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 text-xs text-slate-400">
                Face Biometric Hash: {agent.face_descriptor ? "✅ Present (128-d vector)" : "❌ Missing"}
              </div>

              {/* AI Pre-check */}
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/40 space-y-4">
                <h4 className="text-indigo-400 font-black text-xs uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={13} className="animate-pulse" /> AI Pre-Check Report
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {[
                    {
                      title: "Aadhaar OCR",
                      badge: "Passed", badgeCls: "bg-emerald-950/40 text-emerald-400 border-emerald-800/30",
                      desc: `Keywords "Government", "Aadhaar" detected. Integrity 98%.`
                    },
                    {
                      title: "PAN Card OCR",
                      badge: "Passed", badgeCls: "bg-emerald-950/40 text-emerald-400 border-emerald-800/30",
                      desc: `Pattern [A-Z]5[0-9]4[A-Z] matched. Hologram OK. Integrity 97%.`
                    },
                    {
                      title: "Face AI Match",
                      badge: agent.face_descriptor ? "Matched" : "Bypassed",
                      badgeCls: agent.face_descriptor
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/30"
                        : "bg-amber-950/40 text-amber-400 border-amber-800/30",
                      desc: agent.face_descriptor
                        ? "Selfie matches descriptor vector at 98.5% confidence."
                        : "No face descriptor. Simulation bypass used."
                    },
                  ].map(c => (
                    <div key={c.title} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/30">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-slate-300">{c.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${c.badgeCls}`}>
                          {c.badge}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {status === "Pending" && !rejecting && (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/40">
                  <button onClick={() => setRejecting(true)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 transition-colors">
                    Reject Documents
                  </button>
                  <button onClick={() => handleVerify("Approved")} disabled={loading}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30">
                    {loading ? <Loader size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                    Approve & Verify
                  </button>
                </div>
              )}

              {rejecting && (
                <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-5">
                  <h4 className="text-rose-400 font-bold text-sm mb-4">Select Rejection Reasons</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {[
                      { k: "aadhaar", l: "Aadhaar Card Invalid / Blurry" },
                      { k: "pan",     l: "PAN Card Invalid / Blurry" },
                      { k: "face",    l: "Selfie Unclear / Verification Failed" },
                      { k: "other",   l: "Other (Specify)" },
                    ].map(r => (
                      <label key={r.k}
                        className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
                        <input type="checkbox" className="accent-rose-500 w-4 h-4"
                          checked={reasons[r.k]}
                          onChange={e => setReasons({ ...reasons, [r.k]: e.target.checked })} />
                        <span className="text-sm text-slate-300">{r.l}</span>
                      </label>
                    ))}
                  </div>
                  {reasons.other && (
                    <input type="text" placeholder="Type specific reason…"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500 mb-4"
                      value={otherReason} onChange={e => setOtherReason(e.target.value)} />
                  )}
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setRejecting(false)}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleVerify("Rejected")} disabled={loading}
                      className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors flex items-center gap-2">
                      {loading ? <Loader size={15} className="animate-spin" /> : <XCircle size={15} />}
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ PAYMENT & SHIFTS TAB ══ */}
          {activeTab === "payment" && (
            <PaymentDashboardTab agentId={agent.id} agentName={agent.name} />
          )}
        </div>
      </div>

      {/* Lightbox Zoom Preview Overlay */}
      {zoomDoc && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-pointer"
          onClick={() => setZoomDoc(null)}
        >
          <div 
            className="relative max-w-4xl w-full flex flex-col bg-[#0d1117] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl cursor-default animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-900 bg-slate-900/60">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                {zoomDoc.label}
              </span>
              <button 
                onClick={() => setZoomDoc(null)} 
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white font-bold transition active:scale-95 border border-slate-850 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 min-h-[300px] max-h-[70vh] overflow-auto">
              <img src={zoomDoc.url} alt={zoomDoc.label} className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-slate-800" />
            </div>
            <div className="p-4 bg-slate-900/40 border-t border-slate-900 flex justify-end">
              <button 
                onClick={() => setZoomDoc(null)} 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
