import { useState, useCallback, useEffect, useRef } from "react";
import {
  Package, BarChart3, Users, Truck, Building2, Search, Plus, Eye, Trash2, RefreshCw,
  ArrowUpDown, Download, Mail, FileText, Calculator, Moon, Sun, LogOut, Menu, X,
  ChevronRight, TrendingUp, Clock, CheckCircle2, AlertCircle, MapPin, DollarSign,
  Edit3, Send, ClipboardList, Filter, DownloadCloud
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  getDashboardStats, getRecentParcels, getParcels, bookParcel, getParcel, updateParcelStatus,
  getCustomers, createCustomer, deleteCustomer,
  getCouriers, createCourier, toggleCourier, deleteCourier,
  getBranches, createBranch, deleteBranch,
  getUsers, createUser, toggleUser, deleteUser,
  trackParcel, getAnalyticsSummary, getAnalyticsWeekly, getAnalyticsMonthly,
  getBranchPerformance, getRevenueData, estimateCost,
  getParcelReceipt, resendEmail, bulkUpdateStatus,
} from "../services/api";

const CHART_COLORS = ["#c0272d", "#0d0d0d", "#2563eb", "#16a34a", "#f59e0b", "#8b5cf6", "#06b6d4"];

function cls(...a) { return a.filter(Boolean).join(" "); }

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  picked_up: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  in_transit: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  out_for_delivery: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  returned: "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400",
  available: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  busy: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  off_duty: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  inactive: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  unpaid: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  staff: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  cashier: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

function Badge({ status }) {
  return (
    <span className={cls("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize", STATUS_COLORS[status] || "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400")}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled, className, icon: Icon }) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1";
  const sizes = { sm: "px-2.5 py-1 text-xs", md: "px-3.5 py-1.5 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary: "bg-[#c0272d] text-white hover:bg-[#a01f24] focus:ring-[#c0272d] disabled:opacity-50 shadow-sm",
    outline: "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
    ghost: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:opacity-50 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 shadow-sm",
    warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 disabled:opacity-50 shadow-sm",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={cls(base, sizes[size], variants[variant], className)}>
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required, className }) {
  return (
    <label className={cls("block text-xs font-semibold text-gray-600 dark:text-gray-400", className)}>
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#c0272d]/30 focus:border-[#c0272d] outline-none transition-all" />
    </label>
  );
}

function Select({ label, value, onChange, options, placeholder, className }) {
  return (
    <label className={cls("block text-xs font-semibold text-gray-600 dark:text-gray-400", className)}>
      {label}
      <select value={value} onChange={onChange} className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#c0272d]/30 outline-none transition-all">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </label>
  );
}

function Dialog({ open, title, onClose, children, footer, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()}
        className={cls("relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-700", wide ? "max-w-3xl" : "max-w-md")}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, color = "bg-blue-50 text-blue-600", trend }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={cls("w-11 h-11 rounded-xl flex items-center justify-center", color)}><Icon size={20} /></div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</div>
        {trend !== undefined && (
          <div className={cls("text-[11px] font-medium mt-0.5 flex items-center gap-0.5", trend >= 0 ? "text-green-600" : "text-red-500")}>
            {trend >= 0 ? <TrendingUp size={12} /> : <AlertCircle size={12} />}
            {Math.abs(trend)}% vs last week
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"><Icon size={28} className="text-gray-400" /></div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
    </div>
  );
}

function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map(row => headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── LOGIN ────────────────────────────────────────────────────────
function LoginPage({ onSignIn, onBack, dark, setDark }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError("");
    try { await onSignIn(username, password); }
    catch (err) { setError(err?.response?.data?.detail || "Invalid credentials"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-[#3a0a0a] flex items-center justify-center p-4 relative">
      <button onClick={() => setDark(!dark)} className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors"><ChevronRight size={14} className="rotate-180" /> Back</button>
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#c0272d] items-center justify-center mb-3 shadow-lg shadow-[#c0272d]/30"><Package size={28} className="text-white" /></div>
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-gray-400 text-sm mt-1">Sign in to CourierPro</p>
        </div>
        <div className="bg-white/[.07] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          {error && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} required placeholder="admin" className="[&_input]:!bg-white/10 [&_input]:!border-white/10 [&_input]:!text-white [&_input]:!placeholder-gray-500 [&_input]:focus:!ring-[#c0272d]/50 [&_input]:focus:!border-[#c0272d]" />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="[&_input]:!bg-white/10 [&_input]:!border-white/10 [&_input]:!text-white [&_input]:!placeholder-gray-500 [&_input]:focus:!ring-[#c0272d]/50 [&_input]:focus:!border-[#c0272d]" />
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-[#c0272d] hover:bg-[#a01f24] disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-[#c0272d]/25 mt-1">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Demo Accounts</p>
            <div className="space-y-1">
              {[{ u: "admin", p: "admin123", role: "Admin" }, { u: "cashier", p: "cashier123", role: "Cashier" }].map(a => (
                <button key={a.u} onClick={() => { setUsername(a.u); setPassword(a.p); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                  <div className="w-7 h-7 rounded-full bg-[#c0272d]/20 text-[#c0272d] text-[10px] font-bold flex items-center justify-center">{a.role[0]}</div>
                  <div className="flex-1"><p className="text-gray-300 text-xs font-medium">{a.role}</p><p className="text-gray-500 text-[10px] font-mono">{a.u} / {a.p}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PUBLIC TRACKING ──────────────────────────────────────────────
function TrackingPage({ onBack, dark, setDark }) {
  const [trackingNo, setTrackingNo] = useState("");
  const [parcel, setParcel] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    if (!trackingNo.trim()) return;
    setLoading(true); setError(""); setParcel(null);
    try {
      const res = await trackParcel(trackingNo.trim());
      setParcel(res.data.parcel); setHistory(res.data.tracking_history);
    } catch { setError("Parcel not found. Please check your tracking number."); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <button onClick={() => setDark(!dark)} className="fixed top-4 right-4 w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm z-10">
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors"><ChevronRight size={14} className="rotate-180" /> Back to Home</button>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-[#0d0d0d] to-[#1a0a0a] p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#c0272d] flex items-center justify-center mb-4 shadow-lg shadow-[#c0272d]/30"><Package size={24} className="text-white" /></div>
            <h1 className="text-white text-2xl font-bold">Track Your Parcel</h1>
            <p className="text-gray-400 text-sm mt-1">Enter your tracking number to see real-time status</p>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="flex gap-2">
              <input type="text" value={trackingNo} onChange={e => setTrackingNo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder="e.g. CP20260808-4F92A1"
                className="flex-1 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#c0272d]/30 focus:border-[#c0272d] transition-all" />
              <button onClick={search} disabled={loading || !trackingNo.trim()}
                className="px-5 h-11 bg-[#c0272d] text-white rounded-xl text-sm font-semibold hover:bg-[#a01f24] disabled:opacity-50 transition-all shadow-sm flex items-center gap-2">
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />} Track
              </button>
            </div>
            {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
            {parcel && (
              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-bold text-[#c0272d]">{parcel.tracking_no}</span>
                    <Badge status={parcel.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-gray-400">Receiver:</span> <span className="font-medium text-gray-900 dark:text-white">{parcel.receiver_name}</span></div>
                    <div><span className="text-gray-400">Type:</span> <span className="font-medium text-gray-900 dark:text-white capitalize">{parcel.parcel_type}</span></div>
                    <div><span className="text-gray-400">Booked:</span> <span className="font-medium text-gray-900 dark:text-white">{parcel.booking_date}</span></div>
                    <div><span className="text-gray-400">Weight:</span> <span className="font-medium text-gray-900 dark:text-white">{parcel.weight_kg} kg</span></div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Tracking History</h3>
                  <div className="space-y-0">
                    {history.map((h, i) => (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cls("w-3 h-3 rounded-full border-2 flex-shrink-0", i === 0 ? "bg-[#c0272d] border-[#c0272d] shadow-md shadow-[#c0272d]/30" : "bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600")} />
                          {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{h.status?.replace(/_/g, " ")}</p>
                          {h.location && <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={11} /> {h.location}</p>}
                          {h.remarks && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{h.remarks}</p>}
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{h.updated_at}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────
function Dashboard({ stats, recentParcels }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Live overview of your courier operations</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Parcels" value={stats.total_parcels} icon={Package} color="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" />
        <Kpi label="Pending" value={stats.pending} icon={Clock} color="bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
        <Kpi label="In Transit" value={stats.in_transit} icon={Truck} color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <Kpi label="Delivered" value={stats.delivered} icon={CheckCircle2} color="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Out for Delivery" value={stats.out_for_delivery} icon={MapPin} color="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" />
        <Kpi label="Customers" value={stats.customers} icon={Users} color="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <Kpi label="Couriers" value={stats.couriers} icon={Truck} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <Kpi label="Revenue" value={`₱${Number(stats.revenue).toLocaleString()}`} icon={DollarSign} color="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recent Parcels</h3>
          <span className="text-xs text-gray-400">{recentParcels.length} latest</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-5 py-3 font-semibold">Tracking No</th><th className="px-5 py-3 font-semibold">Sender</th><th className="px-5 py-3 font-semibold">Receiver</th>
              <th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Date</th>
            </tr></thead>
            <tbody>
              {recentParcels.map(p => (
                <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-[#c0272d]">{p.tracking_no}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{p.sender_name}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{p.receiver_name}</td>
                  <td className="px-5 py-3"><Badge status={p.status} /></td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{p.booking_date}</td>
                </tr>
              ))}
              {recentParcels.length === 0 && <tr><td colSpan={5}><EmptyState icon={Package} title="No parcels yet" description="Book your first parcel to see it here" /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────
function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [branchPerf, setBranchPerf] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, w, m, b, r] = await Promise.all([
          getAnalyticsSummary(), getAnalyticsWeekly(), getAnalyticsMonthly(),
          getBranchPerformance(), getRevenueData(),
        ]);
        setSummary(s.data); setWeekly(w.data); setMonthly(m.data);
        setBranchPerf(b.data); setRevenue(r.data);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw size={24} className="animate-spin text-gray-400" /></div>;

  const deliveryRate = summary ? Math.round((summary.delivered_count / (summary.total_parcels || 1)) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Performance insights and trends</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Today's Parcels" value={summary?.parcels_today || 0} icon={Package} color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <Kpi label="This Week" value={summary?.parcels_this_week || 0} icon={BarChart3} color="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <Kpi label="Delivery Rate" value={`${deliveryRate}%`} icon={CheckCircle2} color="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <Kpi label="Total Revenue" value={`₱${Number(summary?.total_revenue || 0).toLocaleString()}`} icon={DollarSign} color="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Weekly Parcels</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#c0272d" radius={[4, 4, 0, 0]} name="Parcels" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#c0272d" strokeWidth={2} dot={{ r: 3, fill: "#c0272d" }} name="Parcels" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Revenue (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={v => [`₱${v}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[2, 2, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Status Breakdown</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={[
                  { name: "Delivered", value: summary?.delivered_count || 0, color: "#16a34a" },
                  { name: "In Transit", value: summary?.in_transit_count || 0, color: "#2563eb" },
                  { name: "Pending", value: summary?.pending_count || 0, color: "#f59e0b" },
                  { name: "Cancelled", value: summary?.cancelled_count || 0, color: "#ef4444" },
                ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {[{ label: "Delivered", value: summary?.delivered_count || 0, color: "bg-green-500" }, { label: "In Transit", value: summary?.in_transit_count || 0, color: "bg-blue-500" }, { label: "Pending", value: summary?.pending_count || 0, color: "bg-yellow-500" }, { label: "Cancelled", value: summary?.cancelled_count || 0, color: "bg-red-500" }].map(d => (
                <div key={d.label} className="flex items-center gap-2 text-xs">
                  <div className={cls("w-2.5 h-2.5 rounded-sm", d.color)} />
                  <span className="text-gray-600 dark:text-gray-400">{d.label}</span>
                  <span className="font-bold text-gray-900 dark:text-white ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {branchPerf.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Branch Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-5 py-3 font-semibold">Branch</th><th className="px-5 py-3 font-semibold">Total Parcels</th><th className="px-5 py-3 font-semibold">Delivered</th><th className="px-5 py-3 font-semibold">Rate</th>
              </tr></thead>
              <tbody>
                {branchPerf.map((b, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{b.branch_name}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{b.parcels_handled}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{b.delivered}</td>
                    <td className="px-5 py-3"><Badge status={b.parcels_handled > 0 && (b.delivered / b.parcels_handled) >= 0.8 ? "active" : "pending"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PARCELS LIST ─────────────────────────────────────────────────
function ParcelsList({ parcels, setParcels, apiMode, onRefresh }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailParcel, setDetailParcel] = useState(null);
  const [detailHistory, setDetailHistory] = useState([]);
  const [statusForm, setStatusForm] = useState({ status: "pending", location: "", remarks: "" });
  const [updating, setUpdating] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("in_transit");
  const [costEstimate, setCostEstimate] = useState(null);
  const [showCost, setShowCost] = useState(false);
  const [costForm, setCostForm] = useState({ weight_kg: 1, parcel_type: "box", distance_km: "" });

  const filtered = parcels.filter(p => {
    const matchQ = !q || p.tracking_no?.toLowerCase().includes(q.toLowerCase()) || p.receiver_name?.toLowerCase().includes(q.toLowerCase()) || p.sender_name?.toLowerCase().includes(q.toLowerCase());
    const matchS = !statusFilter || p.status === statusFilter;
    return matchQ && matchS;
  });

  async function loadDetail(id) {
    try { const res = await getParcel(id); setDetailParcel(res.data.parcel); setDetailHistory(res.data.tracking_history); } catch { /* */ }
  }

  async function handleStatusUpdate() {
    if (!detailParcel) return;
    setUpdating(true);
    try { await updateParcelStatus(detailParcel.id, statusForm); await loadDetail(detailParcel.id); if (onRefresh) await onRefresh(); } catch { /* */ }
    setUpdating(false);
  }

  async function handleBulk() {
    if (!selectedIds.length) return;
    try { await bulkUpdateStatus({ parcel_ids: selectedIds, status: bulkStatus }); setSelectedIds([]); setShowBulk(false); if (onRefresh) await onRefresh(); } catch { /* */ }
  }

  async function handleCost() {
    try {
      const res = await estimateCost({ ...costForm, weight_kg: parseFloat(costForm.weight_kg), distance_km: costForm.distance_km ? parseFloat(costForm.distance_km) : null });
      setCostEstimate(res.data);
    } catch { /* */ }
  }

  async function downloadReceipt(id) {
    try {
      const res = await getParcelReceipt(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url; a.download = `receipt-${id}.pdf`; a.click();
    } catch { /* */ }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(p => p.id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parcels</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} shipment{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && <Btn variant="warning" icon={RefreshCw} onClick={() => setShowBulk(true)}>Bulk Update ({selectedIds.length})</Btn>}
          <Btn variant="outline" icon={Calculator} onClick={() => setShowCost(true)}>Cost Calculator</Btn>
          <Btn variant="outline" icon={DownloadCloud} onClick={() => exportCSV(filtered.map(p => ({ tracking_no: p.tracking_no, sender: p.sender_name, receiver: p.receiver_name, status: p.status, weight_kg: p.weight_kg, cost: p.cost, date: p.booking_date })), "parcels.csv")}>Export CSV</Btn>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#c0272d]/30 transition-all"
            placeholder="Search by tracking, receiver, or sender..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Select label="" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={["", "pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "cancelled", "returned"].map(s => ({ value: s, label: s ? s.replace(/_/g, " ") : "All Status" }))} className="w-40" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3"><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
              <th className="px-4 py-3 font-semibold">Tracking</th><th className="px-4 py-3 font-semibold">Sender</th><th className="px-4 py-3 font-semibold">Receiver</th>
              <th className="px-4 py-3 font-semibold">Courier</th><th className="px-4 py-3 font-semibold">Weight</th><th className="px-4 py-3 font-semibold">Cost</th>
              <th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={9}><EmptyState icon={Package} title="No parcels found" description="Try adjusting your search or filters" /></td></tr>}
              {filtered.map(p => (
                <tr key={p.id} className={cls("border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", selectedIds.includes(p.id) && "bg-blue-50 dark:bg-blue-900/10")}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" /></td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#c0272d]">{p.tracking_no}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.sender_name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.receiver_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.courier_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.weight_kg} kg</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs font-medium">₱{Number(p.cost).toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Btn size="sm" variant="ghost" icon={Eye} onClick={() => loadDetail(p.id)} />
                      <Btn size="sm" variant="ghost" icon={FileText} onClick={() => downloadReceipt(p.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!detailParcel} title={`Parcel — ${detailParcel?.tracking_no || ""}`} onClose={() => setDetailParcel(null)} wide>
        {detailParcel && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sender</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{detailParcel.sender_name}</p>
                <p className="text-xs text-gray-500">{detailParcel.sender_phone}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Receiver</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{detailParcel.receiver_name}</p>
                <p className="text-xs text-gray-500">{detailParcel.receiver_phone}</p>
                <p className="text-xs text-gray-400">{detailParcel.receiver_address}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div><span className="text-gray-400">Type:</span> <span className="font-medium text-gray-900 dark:text-white capitalize">{detailParcel.parcel_type}</span></div>
              <div><span className="text-gray-400">Weight:</span> <span className="font-medium text-gray-900 dark:text-white">{detailParcel.weight_kg} kg</span></div>
              <div><span className="text-gray-400">Cost:</span> <span className="font-medium text-gray-900 dark:text-white">₱{Number(detailParcel.cost).toLocaleString()}</span></div>
              <div><span className="text-gray-400">Payment:</span> <Badge status={detailParcel.payment_status} /></div>
              <div><span className="text-gray-400">Pickup:</span> <span className="font-medium text-gray-900 dark:text-white">{detailParcel.pickup_branch_name || "—"}</span></div>
              <div><span className="text-gray-400">Delivery:</span> <span className="font-medium text-gray-900 dark:text-white">{detailParcel.delivery_branch_name || "—"}</span></div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Update Status</p>
              <div className="flex gap-2 items-end flex-wrap">
                <Select label="Status" value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))} options={["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "cancelled", "returned"].map(s => ({ value: s, label: s.replace(/_/g, " ") }))} className="w-40" />
                <Input label="Location" value={statusForm.location} onChange={e => setStatusForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Manila Hub" className="w-40" />
                <Input label="Remarks" value={statusForm.remarks} onChange={e => setStatusForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional" className="flex-1" />
                <Btn onClick={handleStatusUpdate} disabled={updating} icon={updating ? RefreshCw : Send}>{updating ? "..." : "Update"}</Btn>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Tracking History</p>
              <div className="space-y-3">
                {detailHistory.map((h, i) => (
                  <div key={h.id} className="flex gap-3 items-start">
                    <div className={cls("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", i === 0 ? "bg-[#c0272d] shadow-sm shadow-[#c0272d]/30" : "bg-gray-300 dark:bg-gray-600")} />
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white capitalize">{h.status?.replace(/_/g, " ")}</p>
                      {h.location && <p className="text-[11px] text-gray-500 flex items-center gap-1"><MapPin size={10} /> {h.location}</p>}
                      {h.remarks && <p className="text-[11px] text-gray-400">{h.remarks}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{h.updated_by_name} · {h.updated_at}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={showBulk} title="Bulk Status Update" onClose={() => setShowBulk(false)} footer={<><Btn variant="ghost" onClick={() => setShowBulk(false)}>Cancel</Btn><Btn onClick={handleBulk} icon={Send}>Update {selectedIds.length} Parcels</Btn></>}>
        <p className="text-sm text-gray-600 dark:text-gray-400">Update {selectedIds.length} selected parcels to:</p>
        <Select label="New Status" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} options={["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "cancelled", "returned"].map(s => ({ value: s, label: s.replace(/_/g, " ") }))} />
      </Dialog>

      <Dialog open={showCost} title="Cost Calculator" onClose={() => { setShowCost(false); setCostEstimate(null); }}>
        <Select label="Parcel Type" value={costForm.parcel_type} onChange={e => setCostForm(p => ({ ...p, parcel_type: e.target.value }))} options={["document", "box", "fragile", "electronics", "other"].map(t => ({ value: t, label: t }))} />
        <Input label="Weight (kg)" type="number" value={costForm.weight_kg} onChange={e => setCostForm(p => ({ ...p, weight_kg: e.target.value }))} />
        <Input label="Distance (km)" type="number" value={costForm.distance_km} onChange={e => setCostForm(p => ({ ...p, distance_km: e.target.value }))} placeholder="Optional" />
        <Btn onClick={handleCost} icon={Calculator} className="mt-2">Calculate</Btn>
        {costEstimate && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-3 flex flex-col gap-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Base Rate</span><span className="font-medium text-gray-900 dark:text-white">₱{costEstimate.base_rate}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Weight Cost</span><span className="font-medium text-gray-900 dark:text-white">₱{costEstimate.weight_cost}</span></div>
            {costEstimate.distance_cost > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Distance Cost</span><span className="font-medium text-gray-900 dark:text-white">₱{costEstimate.distance_cost}</span></div>}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between"><span className="font-bold text-gray-900 dark:text-white">Total</span><span className="font-bold text-[#c0272d] text-lg">₱{costEstimate.total}</span></div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

// ─── BOOK PARCEL ──────────────────────────────────────────────────
function BookParcel({ customers, branches, couriers, onSuccess }) {
  const [form, setForm] = useState({
    sender_id: "", receiver_name: "", receiver_phone: "", receiver_address: "",
    pickup_branch_id: "", delivery_branch_id: "", courier_id: "",
    parcel_type: "box", weight_kg: "1", cost: "0", payment_status: "unpaid",
    booking_date: new Date().toISOString().split("T")[0], expected_delivery_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    if (!form.sender_id || !form.receiver_name || !form.receiver_phone || !form.receiver_address) { setError("Please fill all required fields"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await bookParcel({ ...form, sender_id: parseInt(form.sender_id), pickup_branch_id: form.pickup_branch_id ? parseInt(form.pickup_branch_id) : null, delivery_branch_id: form.delivery_branch_id ? parseInt(form.delivery_branch_id) : null, courier_id: form.courier_id ? parseInt(form.courier_id) : null, weight_kg: parseFloat(form.weight_kg) || 1, cost: parseFloat(form.cost) || 0 });
      setSuccess(`Parcel booked! Tracking: ${res.data.tracking_no}`);
      if (onSuccess) onSuccess();
    } catch (err) { setError(err?.response?.data?.detail || "Failed to book parcel"); }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book Parcel</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Create a new shipment</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-5">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
        {success && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2"><CheckCircle2 size={16} /> {success}</div>}

        <Section title="Sender Information">
          <Select label="Customer *" value={form.sender_id} onChange={f("sender_id")} placeholder="Select sender..." options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }))} />
        </Section>

        <Section title="Receiver Details">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Receiver Name *" value={form.receiver_name} onChange={f("receiver_name")} placeholder="Full name" />
            <Input label="Receiver Phone *" value={form.receiver_phone} onChange={f("receiver_phone")} placeholder="09xxxxxxxxx" />
          </div>
          <Input label="Receiver Address *" value={form.receiver_address} onChange={f("receiver_address")} placeholder="Full delivery address" />
        </Section>

        <Section title="Shipment Details">
          <div className="grid grid-cols-3 gap-3">
            <Select label="Pickup Branch" value={form.pickup_branch_id} onChange={f("pickup_branch_id")} placeholder="Select..." options={branches.map(b => ({ value: b.id, label: `${b.name} (${b.city})` }))} />
            <Select label="Delivery Branch" value={form.delivery_branch_id} onChange={f("delivery_branch_id")} placeholder="Select..." options={branches.map(b => ({ value: b.id, label: `${b.name} (${b.city})` }))} />
            <Select label="Courier" value={form.courier_id} onChange={f("courier_id")} placeholder="Select..." options={couriers.filter(c => c.status === "available").map(c => ({ value: c.id, label: c.name }))} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Select label="Parcel Type" value={form.parcel_type} onChange={f("parcel_type")} options={["document", "box", "fragile", "electronics", "other"].map(t => ({ value: t, label: t }))} />
            <Input label="Weight (kg)" type="number" value={form.weight_kg} onChange={f("weight_kg")} />
            <Input label="Cost (₱)" type="number" value={form.cost} onChange={f("cost")} />
            <Select label="Payment" value={form.payment_status} onChange={f("payment_status")} options={[{ value: "unpaid", label: "Unpaid" }, { value: "paid", label: "Paid" }]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Booking Date" type="date" value={form.booking_date} onChange={f("booking_date")} />
            <Input label="Expected Delivery" type="date" value={form.expected_delivery_date} onChange={f("expected_delivery_date")} />
          </div>
        </Section>

        <div className="flex gap-2 pt-2">
          <Btn onClick={submit} disabled={saving} icon={saving ? RefreshCw : Package}>{saving ? "Booking..." : "Book Parcel"}</Btn>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

// ─── CUSTOMERS ────────────────────────────────────────────────────
function CustomersPage({ customers, setCustomers, user }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === "admin";
  const filtered = customers.filter(c => c.name?.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q));

  async function add() {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try { await createCustomer(form); const res = await getCustomers(); setCustomers(res.data); setOpen(false); setForm({ name: "", phone: "", email: "", address: "" }); } catch { /* */ }
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm("Delete this customer?")) return;
    try { await deleteCustomer(id); const res = await getCustomers(); setCustomers(res.data); } catch { /* */ }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1><p className="text-sm text-gray-500 dark:text-gray-400">Manage sender accounts</p></div>
        <div className="flex gap-2">
          <Btn variant="outline" icon={DownloadCloud} onClick={() => exportCSV(filtered.map(c => ({ name: c.name, phone: c.phone, email: c.email, address: c.address })), "customers.csv")}>Export</Btn>
          {isAdmin && <Btn icon={Plus} onClick={() => setOpen(true)}>Add Customer</Btn>}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#c0272d]/30 transition-all"
          placeholder="Search by name or phone..." value={q} onChange={e => setQ(e.target.value)} /></div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-5 py-3 font-semibold">#</th><th className="px-5 py-3 font-semibold">Name</th><th className="px-5 py-3 font-semibold">Phone</th>
              <th className="px-5 py-3 font-semibold">Email</th><th className="px-5 py-3 font-semibold">Address</th>
              {isAdmin && <th className="px-5 py-3 font-semibold">Action</th>}
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6}><EmptyState icon={Users} title="No customers found" description="Add your first customer to get started" /></td></tr>}
              {filtered.map((c, i) => (
                <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                  <td className="px-5 py-3 text-gray-500">{c.phone}</td>
                  <td className="px-5 py-3 text-gray-500">{c.email || "—"}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs max-w-[150px] truncate">{c.address || "—"}</td>
                  {isAdmin && <td className="px-5 py-3"><Btn size="sm" variant="ghost" icon={Trash2} onClick={() => remove(c.id)} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={open} title="Add Customer" onClose={() => setOpen(false)}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={add} disabled={saving} icon={saving ? RefreshCw : null}>{saving ? "..." : "Save Customer"}</Btn></>}>
        <Input label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
        <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
        <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <Input label="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
      </Dialog>
    </div>
  );
}

// ─── COURIERS ─────────────────────────────────────────────────────
function CouriersPage({ couriers, setCouriers }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", vehicle_no: "", branch_id: "" });
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try { await createCourier({ ...form, branch_id: form.branch_id ? parseInt(form.branch_id) : null }); const res = await getCouriers(); setCouriers(res.data); setOpen(false); setForm({ name: "", phone: "", email: "", vehicle_no: "", branch_id: "" }); } catch { /* */ }
    setSaving(false);
  }
  async function toggle(id) { try { await toggleCourier(id); const res = await getCouriers(); setCouriers(res.data); } catch { /* */ } }
  async function remove(id) { if (!confirm("Delete this courier?")) return; try { await deleteCourier(id); const res = await getCouriers(); setCouriers(res.data); } catch { /* */ } }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Couriers</h1><p className="text-sm text-gray-500 dark:text-gray-400">Delivery riders & drivers</p></div>
        <Btn icon={Plus} onClick={() => setOpen(true)}>Add Courier</Btn>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-5 py-3 font-semibold">#</th><th className="px-5 py-3 font-semibold">Name</th><th className="px-5 py-3 font-semibold">Phone</th>
              <th className="px-5 py-3 font-semibold">Vehicle</th><th className="px-5 py-3 font-semibold">Branch</th>
              <th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {couriers.map((c, i) => (
                <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                  <td className="px-5 py-3 text-gray-500">{c.phone}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs font-mono">{c.vehicle_no || "—"}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{c.branch_name || "—"}</td>
                  <td className="px-5 py-3"><Badge status={c.status} /></td>
                  <td className="px-5 py-3 flex gap-1">
                    <Btn size="sm" variant="ghost" icon={ArrowUpDown} onClick={() => toggle(c.id)} />
                    <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => remove(c.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={open} title="Add Courier" onClose={() => setOpen(false)}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={add} disabled={saving}>{saving ? "..." : "Save Courier"}</Btn></>}>
        <Input label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
        <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
        <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <Input label="Vehicle No." value={form.vehicle_no} onChange={e => setForm(p => ({ ...p, vehicle_no: e.target.value }))} />
      </Dialog>
    </div>
  );
}

// ─── BRANCHES ─────────────────────────────────────────────────────
function BranchesPage({ branches, setBranches }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", address: "", phone: "" });
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!form.name || !form.city) return;
    setSaving(true);
    try { await createBranch(form); const res = await getBranches(); setBranches(res.data); setOpen(false); setForm({ name: "", city: "", address: "", phone: "" }); } catch { /* */ }
    setSaving(false);
  }
  async function remove(id) { if (!confirm("Delete this branch?")) return; try { await deleteBranch(id); const res = await getBranches(); setBranches(res.data); } catch { /* */ } }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branches</h1><p className="text-sm text-gray-500 dark:text-gray-400">Hubs & distribution centers</p></div>
        <Btn icon={Plus} onClick={() => setOpen(true)}>Add Branch</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(b => (
          <div key={b.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#c0272d]/10 flex items-center justify-center"><Building2 size={18} className="text-[#c0272d]" /></div>
              <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => remove(b.id)} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{b.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{b.city}</p>
            {b.address && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{b.address}</p>}
            {b.phone && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{b.phone}</p>}
          </div>
        ))}
      </div>
      {branches.length === 0 && <EmptyState icon={Building2} title="No branches" description="Add your first branch hub" />}
      <Dialog open={open} title="Add Branch" onClose={() => setOpen(false)}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={add} disabled={saving}>{saving ? "..." : "Save Branch"}</Btn></>}>
        <Input label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
        <Input label="City" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required />
        <Input label="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
        <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
      </Dialog>
    </div>
  );
}

// ─── USERS (ADMIN) ───────────────────────────────────────────────
function UsersPage({ users, setUsers }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", username: "", password: "", role: "staff" });
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!form.full_name || !form.username || !form.password) return;
    setSaving(true);
    try { await createUser(form); const res = await getUsers(); setUsers(res.data); setOpen(false); setForm({ full_name: "", username: "", password: "", role: "staff" }); } catch { /* */ }
    setSaving(false);
  }
  async function toggle(id) { try { await toggleUser(id); const res = await getUsers(); setUsers(res.data); } catch { /* */ } }
  async function remove(id) { if (!confirm("Delete this user?")) return; try { await deleteUser(id); const res = await getUsers(); setUsers(res.data); } catch { /* */ } }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1><p className="text-sm text-gray-500 dark:text-gray-400">Admin-only user management</p></div>
        <Btn icon={Plus} onClick={() => setOpen(true)}>Add User</Btn>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-5 py-3 font-semibold">#</th><th className="px-5 py-3 font-semibold">Username</th><th className="px-5 py-3 font-semibold">Full Name</th>
              <th className="px-5 py-3 font-semibold">Role</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white font-mono text-xs">{u.username}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{u.full_name}</td>
                  <td className="px-5 py-3"><Badge status={u.role} /></td>
                  <td className="px-5 py-3"><Badge status={u.status} /></td>
                  <td className="px-5 py-3 flex gap-1">
                    <Btn size="sm" variant="ghost" icon={ArrowUpDown} onClick={() => toggle(u.id)} />
                    <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => remove(u.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={open} title="Add User" onClose={() => setOpen(false)}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={add} disabled={saving}>{saving ? "..." : "Save User"}</Btn></>}>
        <Input label="Full Name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required />
        <Input label="Username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
        <Input label="Password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
        <Select label="Role" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} options={[{ value: "admin", label: "Admin" }, { value: "staff", label: "Staff" }, { value: "cashier", label: "Cashier" }]} />
      </Dialog>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, collapsed, setCollapsed }) {
  const adminNav = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "parcels", label: "Parcels", icon: Package },
    { id: "book", label: "Book Parcel", icon: ClipboardList },
    { id: "customers", label: "Customers", icon: Users },
    { id: "couriers", label: "Couriers", icon: Truck },
    { id: "branches", label: "Branches", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
  ];
  const staffNav = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "parcels", label: "Parcels", icon: Package },
    { id: "book", label: "Book Parcel", icon: ClipboardList },
    { id: "customers", label: "Customers", icon: Users },
    { id: "couriers", label: "Couriers", icon: Truck },
    { id: "branches", label: "Branches", icon: Building2 },
  ];
  const nav = user.role === "admin" ? adminNav : staffNav;

  return (
    <aside className={cls("fixed left-0 top-0 h-screen bg-[#0d0d0d] flex flex-col z-[100] transition-all duration-300", collapsed ? "w-[68px]" : "w-60")}>
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/[.06]">
        <button onClick={() => setCollapsed(!collapsed)} className="w-8 h-8 rounded-lg bg-[#c0272d] flex items-center justify-center text-white flex-shrink-0">
          {collapsed ? <Menu size={16} /> : <Package size={16} />}
        </button>
        {!collapsed && <span className="text-white font-bold text-sm">CourierPro</span>}
      </div>
      {!collapsed && (
        <div className="px-3 py-3 border-b border-white/[.06]">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-[#c0272d] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{user.full_name?.charAt(0)}</div>
            <div className="min-w-0"><p className="text-white text-xs font-semibold truncate">{user.full_name}</p><p className="text-gray-400 text-[10px] capitalize">{user.role}</p></div>
          </div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto py-2">
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            title={collapsed ? n.label : undefined}
            className={cls("flex items-center gap-2.5 mx-2 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all text-left", collapsed ? "justify-center mx-1 px-0" : "w-[calc(100%-16px)]", page === n.id ? "bg-[#c0272d] text-white shadow-lg shadow-[#c0272d]/20" : "text-gray-400 hover:bg-white/5 hover:text-white")}>
            <n.icon size={18} />
            {!collapsed && n.label}
          </button>
        ))}
      </nav>
      {!collapsed && <div className="px-3 py-3 text-[10px] text-gray-600 border-t border-white/[.06]">CourierPro v2.0</div>}
    </aside>
  );
}

function Topbar({ user, onLogout, dark, setDark }) {
  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 px-5 z-[50]">
      <div className="flex-1" />
      <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className={cls("px-2.5 py-1 rounded-full text-white text-[11px] font-bold capitalize", user.role === "admin" ? "bg-purple-600" : user.role === "cashier" ? "bg-orange-600" : "bg-blue-600")}>{user.role}</div>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.full_name}</div>
      <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><LogOut size={14} /> Sign Out</button>
    </header>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────
function LandingPage({ onStaff, onTrack, dark, setDark }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col" style={{ fontFamily: "system-ui,sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(192,39,45,0.15) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-8%", right: "-8%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle,rgba(192,39,45,0.1) 0%,transparent 70%)" }} />
      </div>
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/[.05]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c0272d] flex items-center justify-center shadow-lg shadow-[#c0272d]/30"><Package size={20} className="text-white" /></div>
          <span className="text-white font-bold text-base tracking-tight">CourierPro</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-gray-500 text-xs">System online</span></div>
          <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="inline-flex items-center gap-2 bg-white/[.05] border border-white/10 rounded-full px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c0272d]" />
          <span className="text-xs text-gray-400 font-medium">Courier & Parcel Management System</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white text-center tracking-tight mb-3">CourierPro</h1>
        <p className="text-gray-400 text-sm text-center mb-12 max-w-md leading-relaxed">Manage parcels, track shipments, and coordinate deliveries across multiple branches — all in one place.</p>
        <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={onStaff}
            className="group relative bg-[#c0272d] hover:bg-[#a01f24] text-white rounded-2xl p-6 flex flex-col items-start gap-5 transition-all duration-200 shadow-xl shadow-[#c0272d]/20 overflow-hidden text-left">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg,rgba(255,255,255,0.1) 0%,transparent 100%)", borderRadius: "16px 16px 0 0", pointerEvents: "none" }} />
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform"><Users size={24} /></div>
            <div>
              <div className="text-lg font-bold mb-1">Staff Sign In</div>
              <div className="text-sm text-red-100 leading-snug">Access your dashboard to manage parcels, couriers, and branches.</div>
            </div>
          </button>
          <button onClick={onTrack}
            className="group relative bg-white/[.05] hover:bg-white/[.1] border border-white/10 text-white rounded-2xl p-6 flex flex-col items-start gap-5 transition-all duration-200 overflow-hidden text-left">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg,rgba(255,255,255,0.03) 0%,transparent 100%)", borderRadius: "16px 16px 0 0", pointerEvents: "none" }} />
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform"><Search size={24} /></div>
            <div>
              <div className="text-lg font-bold mb-1">Track Parcel</div>
              <div className="text-sm text-gray-400 leading-snug">Enter your tracking number to check real-time shipment status.</div>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-3 mt-10">
          {[{ label: "FastAPI", color: "bg-green-500/20 text-green-300" }, { label: "PostgreSQL", color: "bg-blue-500/20 text-blue-300" }, { label: "React", color: "bg-cyan-500/20 text-cyan-300" }].map(r => (
            <span key={r.label} className={cls("text-[11px] font-semibold px-3 py-1 rounded-full", r.color)}>{r.label}</span>
          ))}
        </div>
      </main>
      <footer className="relative z-10 text-center py-5 border-t border-white/[.05]">
        <span className="text-gray-600 text-xs">CourierPro v2.0 · Powered by FastAPI + PostgreSQL + React</span>
      </footer>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────
export default function CourierSystem({ apiMode = false, authUser = null, onSignIn = null, onLogout = null }) {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("courier_dark") === "true" } catch { return false } });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("courier_dark", dark);
  }, [dark]);

  const [stats, setStats] = useState({ total_parcels: 0, pending: 0, in_transit: 0, out_for_delivery: 0, delivered: 0, customers: 0, couriers: 0, revenue: 0 });
  const [recentParcels, setRecentParcels] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const refreshData = useCallback(async () => {
    if (!apiMode) return;
    try {
      const [s, rp, p, c, co, b] = await Promise.all([getDashboardStats(), getRecentParcels(), getParcels(), getCustomers(), getCouriers(), getBranches()]);
      setStats(s.data); setRecentParcels(rp.data); setParcels(p.data); setCustomers(c.data); setCouriers(co.data); setBranchesList(b.data);
      if (authUser?.role === "admin") { const u = await getUsers(); setUsersList(u.data); }
    } catch { /* */ }
  }, [apiMode, authUser]);

  useEffect(() => { if (apiMode && screen === "app") refreshData(); }, [apiMode, screen, refreshData]);

  const handleLogin = async (username, password) => { const userData = await onSignIn(username, password); setUser(userData); setPage("dashboard"); setScreen("app"); };
  const handleLogout = async () => { if (onLogout) await onLogout(); setUser(null); setScreen("landing"); };

  if (screen === "landing") return <LandingPage onStaff={() => setScreen("login")} onTrack={() => setScreen("tracking")} dark={dark} setDark={setDark} />;
  if (screen === "tracking") return <TrackingPage onBack={() => setScreen("landing")} dark={dark} setDark={setDark} />;
  if (screen === "login") return <LoginPage onSignIn={handleLogin} onBack={() => setScreen("landing")} dark={dark} setDark={setDark} />;
  if (screen === "app" && !user) return <LandingPage onStaff={() => setScreen("login")} onTrack={() => setScreen("tracking")} dark={dark} setDark={setDark} />;

  return (
    <div className={cls("min-h-screen font-sans transition-colors", dark ? "bg-gray-950" : "bg-gray-100")}>
      <Sidebar page={page} setPage={setPage} user={user} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className={cls("transition-all duration-300", sidebarCollapsed ? "ml-[68px]" : "ml-60")}>
        <Topbar user={user} onLogout={handleLogout} dark={dark} setDark={setDark} />
        <main className="pt-14 min-h-screen p-6">
          {page === "dashboard" && <Dashboard stats={stats} recentParcels={recentParcels} />}
          {page === "analytics" && <AnalyticsPage />}
          {page === "parcels" && <ParcelsList parcels={parcels} setParcels={setParcels} apiMode={apiMode} onRefresh={refreshData} />}
          {page === "book" && <BookParcel customers={customers} branches={branchesList} couriers={couriers} onSuccess={refreshData} />}
          {page === "customers" && <CustomersPage customers={customers} setCustomers={setCustomers} user={user} />}
          {page === "couriers" && <CouriersPage couriers={couriers} setCouriers={setCouriers} />}
          {page === "branches" && <BranchesPage branches={branchesList} setBranches={setBranchesList} />}
          {page === "users" && user.role === "admin" && <UsersPage users={usersList} setUsers={setUsersList} />}
        </main>
      </div>
    </div>
  );
}
