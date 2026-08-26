import { useState, useCallback, useEffect } from "react";
import {
  getDashboardStats, getRecentParcels, getParcels, bookParcel, getParcel, updateParcelStatus,
  getCustomers, createCustomer, deleteCustomer,
  getCouriers, createCourier, toggleCourier, deleteCourier,
  getBranches, createBranch, deleteBranch,
  getUsers, createUser, toggleUser, deleteUser,
  trackParcel,
} from "../services/api";

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const C = { primary: "#c0272d", dark: "#0d0d0d" };

// ─── UTILS ────────────────────────────────────────────────────────
function cls(...a) { return a.filter(Boolean).join(" "); }

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  picked_up: "bg-cyan-100 text-cyan-700",
  in_transit: "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-yellow-100 text-yellow-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-gray-200 text-gray-600",
  available: "bg-green-100 text-green-700",
  busy: "bg-yellow-100 text-yellow-700",
  off_duty: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  inactive: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-red-100 text-red-700",
  admin: "bg-purple-100 text-purple-700",
  staff: "bg-blue-100 text-blue-700",
  cashier: "bg-orange-100 text-orange-700",
};

function Badge({ status }) {
  return (
    <span className={cls("inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold", STATUS_COLORS[status] || "bg-gray-100 text-gray-500")}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", size = "md", disabled, className }) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-lg transition-all focus:outline-none";
  const sizes = { sm: "px-2.5 py-1 text-xs", md: "px-3.5 py-1.5 text-sm", lg: "px-5 py-2 text-sm" };
  const variants = {
    primary: "bg-[#c0272d] text-white hover:bg-[#a01f24] disabled:opacity-50",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50",
    ghost: "text-gray-600 hover:bg-gray-100 disabled:opacity-50",
    success: "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
    warning: "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50",
  };
  return <button onClick={onClick} disabled={disabled} className={cls(base, sizes[size], variants[variant], className)}>{children}</button>;
}

function Input({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 outline-none" />
    </label>
  );
}

function Dialog({ open, title, onClose, children, footer, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()}
        className={cls("relative bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, color = "bg-blue-50 text-blue-600" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
      <div className={cls("w-10 h-10 rounded-lg flex items-center justify-center text-lg", color)}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────
function LoginPage({ onSignIn, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await onSignIn(username, password);
    } catch (err) {
      setError(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d0d] via-[#1a0a0a] to-[#3a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">← Back</button>
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[#c0272d] items-center justify-center text-xl mb-2 shadow-lg">📦</div>
          <h2 className="text-xl font-bold text-white">Staff Sign In</h2>
          <p className="text-gray-400 text-sm">Access your courier dashboard</p>
        </div>
        <div className="bg-white/[.07] backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl">
          {error && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs rounded-lg px-3 py-2 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-400 block mb-1">Username</span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="admin"
                className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/10 text-white placeholder:text-gray-500 text-sm outline-none focus:ring-2 focus:ring-[#c0272d]" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-400 block mb-1">Password</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/10 text-white placeholder:text-gray-500 text-sm outline-none focus:ring-2 focus:ring-[#c0272d]" />
            </label>
            <button type="submit" disabled={loading}
              className="w-full h-10 bg-[#c0272d] hover:bg-[#a01f24] disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-all mt-1">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="flex flex-col gap-1 text-xs text-gray-400">
              <p>Admin: <span className="text-gray-300 font-mono">admin / admin123</span></p>
              <p>Cashier: <span className="text-gray-300 font-mono">cashier / cashier123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PUBLIC TRACKING PAGE ─────────────────────────────────────────
function TrackingPage({ onBack }) {
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
      setParcel(res.data.parcel);
      setHistory(res.data.tracking_history);
    } catch {
      setError("Parcel not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-6">← Back to Home</button>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[#0d0d0d] p-6">
            <div className="w-10 h-10 rounded-xl bg-[#c0272d] flex items-center justify-center text-xl mb-3">📦</div>
            <h1 className="text-white text-xl font-bold">Track Your Parcel</h1>
            <p className="text-gray-400 text-sm mt-1">Enter your tracking number to see the status</p>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="flex gap-2">
              <input type="text" value={trackingNo} onChange={e => setTrackingNo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder="e.g. CP20260808-4F92A1"
                className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-red-200" />
              <button onClick={search} disabled={loading || !trackingNo.trim()}
                className="px-4 h-10 bg-[#c0272d] text-white rounded-lg text-sm font-semibold hover:bg-[#a01f24] disabled:opacity-50">
                {loading ? "..." : "Track"}
              </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">❌ {error}</div>}
            {parcel && (
              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2">
                  {[
                    ["Tracking No.", parcel.tracking_no],
                    ["Status", parcel.status?.replace(/_/g, " ")],
                    ["Receiver", parcel.receiver_name],
                    ["Type", parcel.parcel_type],
                    ["Booked", parcel.booking_date],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs">
                      <span className="text-gray-400">{l}</span>
                      <span className="font-semibold text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tracking History</h3>
                  <div className="space-y-3">
                    {history.map((h, i) => (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cls("w-3 h-3 rounded-full border-2", i === 0 ? "bg-[#c0272d] border-[#c0272d]" : "bg-gray-300 border-gray-300")} />
                          {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="pb-3">
                          <p className="text-xs font-semibold text-gray-800">{h.status?.replace(/_/g, " ")}</p>
                          {h.location && <p className="text-[11px] text-gray-500">{h.location}</p>}
                          {h.remarks && <p className="text-[11px] text-gray-400">{h.remarks}</p>}
                          <p className="text-[10px] text-gray-400 mt-0.5">{h.updated_at}</p>
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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Live overview · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Parcels" value={stats.total_parcels} icon="📦" color="bg-gray-100 text-gray-700" />
        <Kpi label="Pending" value={stats.pending} icon="⏳" color="bg-orange-50 text-orange-600" />
        <Kpi label="In Transit" value={stats.in_transit} icon="🚚" color="bg-blue-50 text-blue-600" />
        <Kpi label="Delivered" value={stats.delivered} icon="✅" color="bg-green-50 text-green-600" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Out for Delivery" value={stats.out_for_delivery} icon="📍" color="bg-yellow-50 text-yellow-600" />
        <Kpi label="Customers" value={stats.customers} icon="👤" color="bg-purple-50 text-purple-600" />
        <Kpi label="Couriers" icon="🚴" value={stats.couriers} color="bg-emerald-50 text-emerald-600" />
        <Kpi label="Revenue" value={`₱${Number(stats.revenue).toLocaleString()}`} icon="💰" color="bg-amber-50 text-amber-600" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Recent Parcels</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3">Tracking No</th><th className="px-4 py-3">Sender</th><th className="px-4 py-3">Receiver</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th>
            </tr></thead>
            <tbody>
              {recentParcels.map(p => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#c0272d]">{p.tracking_no}</td>
                  <td className="px-4 py-3 text-gray-700">{p.sender_name}</td>
                  <td className="px-4 py-3 text-gray-700">{p.receiver_name}</td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.booking_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PARCELS LIST ─────────────────────────────────────────────────
function ParcelsList({ parcels, setParcels, apiMode, onRefresh }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [detailParcel, setDetailParcel] = useState(null);
  const [detailHistory, setDetailHistory] = useState([]);
  const [statusForm, setStatusForm] = useState({ status: "pending", location: "", remarks: "" });
  const [updating, setUpdating] = useState(false);

  const filtered = parcels.filter(p => {
    const matchQ = !q || p.tracking_no?.toLowerCase().includes(q.toLowerCase()) || p.receiver_name?.toLowerCase().includes(q.toLowerCase()) || p.sender_name?.toLowerCase().includes(q.toLowerCase());
    const matchS = !statusFilter || p.status === statusFilter;
    return matchQ && matchS;
  });

  async function loadDetail(id) {
    try {
      const res = await getParcel(id);
      setDetailParcel(res.data.parcel);
      setDetailHistory(res.data.tracking_history);
    } catch { /* ignore */ }
  }

  async function handleStatusUpdate() {
    if (!detailParcel) return;
    setUpdating(true);
    try {
      await updateParcelStatus(detailParcel.id, statusForm);
      await loadDetail(detailParcel.id);
      if (onRefresh) await onRefresh();
    } catch { /* ignore */ }
    setUpdating(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl font-bold text-gray-900">Parcels</h1><p className="text-sm text-gray-500">All shipments</p></div>
      <div className="flex gap-2 flex-wrap">
        <div className="bg-white rounded-xl border border-gray-200 p-2 flex-1 min-w-[200px]">
          <input className="w-full h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-red-200"
            placeholder="Search tracking, receiver, sender..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="">All Status</option>
          {["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "cancelled", "returned"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3">Tracking No</th><th className="px-4 py-3">Sender</th><th className="px-4 py-3">Receiver</th>
            <th className="px-4 py-3">Courier</th><th className="px-4 py-3">Weight</th><th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th><th className="px-4 py-3">Action</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No parcels found</td></tr>}
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-[#c0272d]">{p.tracking_no}</td>
                <td className="px-4 py-3 text-gray-700">{p.sender_name}</td>
                <td className="px-4 py-3 text-gray-700">{p.receiver_name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.courier_name || "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.weight_kg} kg</td>
                <td className="px-4 py-3"><Badge status={p.status} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.booking_date}</td>
                <td className="px-4 py-3">
                  <Btn size="sm" variant="outline" onClick={() => loadDetail(p.id)}>View</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!detailParcel} title={`Parcel — ${detailParcel?.tracking_no || ""}`} onClose={() => setDetailParcel(null)} wide>
        {detailParcel && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase">Sender</p>
                <p className="text-sm font-medium">{detailParcel.sender_name}</p>
                <p className="text-xs text-gray-500">{detailParcel.sender_phone}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase">Receiver</p>
                <p className="text-sm font-medium">{detailParcel.receiver_name}</p>
                <p className="text-xs text-gray-500">{detailParcel.receiver_phone}</p>
                <p className="text-xs text-gray-400">{detailParcel.receiver_address}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><span className="text-gray-400">Type:</span> <span className="font-medium">{detailParcel.parcel_type}</span></div>
              <div><span className="text-gray-400">Weight:</span> <span className="font-medium">{detailParcel.weight_kg} kg</span></div>
              <div><span className="text-gray-400">Cost:</span> <span className="font-medium">₱{Number(detailParcel.cost).toLocaleString()}</span></div>
              <div><span className="text-gray-400">Payment:</span> <Badge status={detailParcel.payment_status} /></div>
              <div><span className="text-gray-400">Pickup:</span> <span className="font-medium">{detailParcel.pickup_branch_name || "—"}</span></div>
              <div><span className="text-gray-400">Delivery:</span> <span className="font-medium">{detailParcel.delivery_branch_name || "—"}</span></div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Update Status</p>
              <div className="flex gap-2 items-end">
                <label className="block text-xs font-semibold text-gray-600 flex-1">
                  Status
                  <select value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}
                    className="mt-1 w-full h-8 px-2 rounded-lg border border-gray-200 text-sm">
                    {["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "cancelled", "returned"].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </label>
                <Input label="Location" value={statusForm.location} onChange={e => setStatusForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Manila Hub" />
                <Input label="Remarks" value={statusForm.remarks} onChange={e => setStatusForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional" />
                <Btn onClick={handleStatusUpdate} disabled={updating}>{updating ? "..." : "Update"}</Btn>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Tracking History</p>
              <div className="space-y-2">
                {detailHistory.map((h, i) => (
                  <div key={h.id} className="flex gap-3 items-start">
                    <div className={cls("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", i === 0 ? "bg-[#c0272d]" : "bg-gray-300")} />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{h.status?.replace(/_/g, " ")}</p>
                      {h.location && <p className="text-[11px] text-gray-500">{h.location}</p>}
                      {h.remarks && <p className="text-[11px] text-gray-400">{h.remarks}</p>}
                      <p className="text-[10px] text-gray-400">{h.updated_by_name} · {h.updated_at}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    if (!form.sender_id || !form.receiver_name || !form.receiver_phone || !form.receiver_address) {
      setError("Please fill all required fields");
      return;
    }
    setSaving(true); setError("");
    try {
      await bookParcel({
        ...form,
        sender_id: parseInt(form.sender_id),
        pickup_branch_id: form.pickup_branch_id ? parseInt(form.pickup_branch_id) : null,
        delivery_branch_id: form.delivery_branch_id ? parseInt(form.delivery_branch_id) : null,
        courier_id: form.courier_id ? parseInt(form.courier_id) : null,
        weight_kg: parseFloat(form.weight_kg) || 1,
        cost: parseFloat(form.cost) || 0,
      });
      if (onSuccess) onSuccess();
      setForm({ ...form, receiver_name: "", receiver_phone: "", receiver_address: "", weight_kg: "1", cost: "0", expected_delivery_date: "" });
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to book parcel");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl font-bold text-gray-900">Book Parcel</h1><p className="text-sm text-gray-500">Create a new shipment</p></div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">❌ {error}</div>}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sender</p>
          <label className="block text-xs font-semibold text-gray-600">
            Customer <span className="text-red-500">*</span>
            <select value={form.sender_id} onChange={f("sender_id")} className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 text-sm">
              <option value="">Select sender...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
            </select>
          </label>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Receiver Details</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Receiver Name" value={form.receiver_name} onChange={f("receiver_name")} required placeholder="Full name" />
            <Input label="Receiver Phone" value={form.receiver_phone} onChange={f("receiver_phone")} required placeholder="09xxxxxxxxx" />
            <div className="col-span-2"><Input label="Receiver Address" value={form.receiver_address} onChange={f("receiver_address")} required placeholder="Full address" /></div>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Shipment Details</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-600">
              Pickup Branch
              <select value={form.pickup_branch_id} onChange={f("pickup_branch_id")} className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 text-sm">
                <option value="">Select...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.city})</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-gray-600">
              Delivery Branch
              <select value={form.delivery_branch_id} onChange={f("delivery_branch_id")} className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 text-sm">
                <option value="">Select...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.city})</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-gray-600">
              Courier
              <select value={form.courier_id} onChange={f("courier_id")} className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 text-sm">
                <option value="">Select...</option>
                {couriers.filter(c => c.status === "available").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-gray-600">
              Parcel Type
              <select value={form.parcel_type} onChange={f("parcel_type")} className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 text-sm">
                {["document", "box", "fragile", "electronics", "other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <Input label="Weight (kg)" type="number" value={form.weight_kg} onChange={f("weight_kg")} />
            <Input label="Cost (₱)" type="number" value={form.cost} onChange={f("cost")} />
            <label className="block text-xs font-semibold text-gray-600">
              Payment Status
              <select value={form.payment_status} onChange={f("payment_status")} className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 text-sm">
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <Input label="Booking Date" type="date" value={form.booking_date} onChange={f("booking_date")} />
            <Input label="Expected Delivery" type="date" value={form.expected_delivery_date} onChange={f("expected_delivery_date")} />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Btn onClick={submit} disabled={saving}>{saving ? "Booking..." : "Book Parcel"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMERS ────────────────────────────────────────────────────
function CustomersPage({ customers, setCustomers, apiMode, user }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === "admin";
  const filtered = customers.filter(c => c.name?.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q));

  async function add() {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await createCustomer(form);
      const res = await getCustomers();
      setCustomers(res.data);
      setOpen(false); setForm({ name: "", phone: "", email: "", address: "" });
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm("Delete this customer?")) return;
    try {
      await deleteCustomer(id);
      const res = await getCustomers();
      setCustomers(res.data);
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Customers</h1><p className="text-sm text-gray-500">Manage senders</p></div>
        {isAdmin && <Btn onClick={() => setOpen(true)}>+ Add Customer</Btn>}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <input className="w-full h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-red-200"
          placeholder="Search by name or phone..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 bg-gray-50">
            <th className="px-5 py-3">#</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Phone</th>
            <th className="px-5 py-3">Email</th><th className="px-5 py-3">Address</th>
            {isAdmin && <th className="px-5 py-3">Action</th>}
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No customers found</td></tr>}
            {filtered.map((c, i) => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-5 py-3 text-gray-500">{c.phone}</td>
                <td className="px-5 py-3 text-gray-500">{c.email || "—"}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{c.address || "—"}</td>
                {isAdmin && <td className="px-5 py-3"><Btn size="sm" variant="danger" onClick={() => remove(c.id)}>Delete</Btn></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} title="Add Customer" onClose={() => setOpen(false)}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={add} disabled={saving}>{saving ? "..." : "Save"}</Btn></>}>
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
    try {
      await createCourier({ ...form, branch_id: form.branch_id ? parseInt(form.branch_id) : null });
      const res = await getCouriers();
      setCouriers(res.data);
      setOpen(false); setForm({ name: "", phone: "", email: "", vehicle_no: "", branch_id: "" });
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function toggle(id) {
    try {
      await toggleCourier(id);
      const res = await getCouriers();
      setCouriers(res.data);
    } catch { /* ignore */ }
  }

  async function remove(id) {
    if (!confirm("Delete this courier?")) return;
    try {
      await deleteCourier(id);
      const res = await getCouriers();
      setCouriers(res.data);
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Couriers</h1><p className="text-sm text-gray-500">Delivery riders & drivers</p></div>
        <Btn onClick={() => setOpen(true)}>+ Add Courier</Btn>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 bg-gray-50">
            <th className="px-5 py-3">#</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Phone</th>
            <th className="px-5 py-3">Vehicle</th><th className="px-5 py-3">Branch</th>
            <th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {couriers.map((c, i) => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-5 py-3 text-gray-500">{c.phone}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{c.vehicle_no || "—"}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{c.branch_name || "—"}</td>
                <td className="px-5 py-3"><Badge status={c.status} /></td>
                <td className="px-5 py-3 flex gap-1.5">
                  <Btn size="sm" variant="outline" onClick={() => toggle(c.id)}>Toggle</Btn>
                  <Btn size="sm" variant="danger" onClick={() => remove(c.id)}>Delete</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} title="Add Courier" onClose={() => setOpen(false)}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={add} disabled={saving}>{saving ? "..." : "Save"}</Btn></>}>
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
    try {
      await createBranch(form);
      const res = await getBranches();
      setBranches(res.data);
      setOpen(false); setForm({ name: "", city: "", address: "", phone: "" });
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm("Delete this branch?")) return;
    try {
      await deleteBranch(id);
      const res = await getBranches();
      setBranches(res.data);
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Branches</h1><p className="text-sm text-gray-500">Hubs & distribution centers</p></div>
        <Btn onClick={() => setOpen(true)}>+ Add Branch</Btn>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 bg-gray-50">
            <th className="px-5 py-3">#</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">City</th>
            <th className="px-5 py-3">Address</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Action</th>
          </tr></thead>
          <tbody>
            {branches.map((b, i) => (
              <tr key={b.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{b.name}</td>
                <td className="px-5 py-3 text-gray-500">{b.city}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{b.address || "—"}</td>
                <td className="px-5 py-3 text-gray-500">{b.phone || "—"}</td>
                <td className="px-5 py-3"><Btn size="sm" variant="danger" onClick={() => remove(b.id)}>Delete</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} title="Add Branch" onClose={() => setOpen(false)}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={add} disabled={saving}>{saving ? "..." : "Save"}</Btn></>}>
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
    try {
      await createUser(form);
      const res = await getUsers();
      setUsers(res.data);
      setOpen(false); setForm({ full_name: "", username: "", password: "", role: "staff" });
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function toggle(id) {
    try {
      await toggleUser(id);
      const res = await getUsers();
      setUsers(res.data);
    } catch { /* ignore */ }
  }

  async function remove(id) {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      const res = await getUsers();
      setUsers(res.data);
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Users</h1><p className="text-sm text-gray-500">Admin-only user management</p></div>
        <Btn onClick={() => setOpen(true)}>+ Add User</Btn>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 bg-gray-50">
            <th className="px-5 py-3">#</th><th className="px-5 py-3">Username</th><th className="px-5 py-3">Full Name</th>
            <th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{u.username}</td>
                <td className="px-5 py-3 text-gray-700">{u.full_name}</td>
                <td className="px-5 py-3"><Badge status={u.role} /></td>
                <td className="px-5 py-3"><Badge status={u.status} /></td>
                <td className="px-5 py-3 flex gap-1.5">
                  <Btn size="sm" variant="outline" onClick={() => toggle(u.id)}>Toggle</Btn>
                  <Btn size="sm" variant="danger" onClick={() => remove(u.id)}>Delete</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} title="Add User" onClose={() => setOpen(false)}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={add} disabled={saving}>{saving ? "..." : "Save"}</Btn></>}>
        <Input label="Full Name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required />
        <Input label="Username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
        <Input label="Password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
        <label className="block text-xs font-semibold text-gray-600">
          Role
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 text-sm">
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="cashier">Cashier</option>
          </select>
        </label>
      </Dialog>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────
function Sidebar({ page, setPage, user }) {
  const adminNav = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "parcels", label: "Parcels", icon: "📦" },
    { id: "book", label: "Book Parcel", icon: "📝" },
    { id: "customers", label: "Customers", icon: "👤" },
    { id: "couriers", label: "Couriers", icon: "🚴" },
    { id: "branches", label: "Branches", icon: "🏢" },
    { id: "users", label: "Users", icon: "⚙️" },
  ];
  const staffNav = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "parcels", label: "Parcels", icon: "📦" },
    { id: "book", label: "Book Parcel", icon: "📝" },
    { id: "customers", label: "Customers", icon: "👤" },
    { id: "couriers", label: "Couriers", icon: "🚴" },
    { id: "branches", label: "Branches", icon: "🏢" },
  ];
  const nav = user.role === "admin" ? adminNav : staffNav;
  return (
    <aside className="fixed left-0 top-0 w-60 h-screen bg-[#0d0d0d] flex flex-col z-[100]">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/[.06]">
        <div className="w-7 h-7 rounded-lg bg-[#c0272d] flex items-center justify-center text-white text-xs">📦</div>
        <span className="text-white font-bold text-sm">CourierPro</span>
      </div>
      <div className="px-3 py-3 border-b border-white/[.06]">
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-[#c0272d] flex items-center justify-center text-white text-[10px] font-bold">{user.full_name?.charAt(0)}</div>
          <div><p className="text-white text-xs font-semibold">{user.full_name}</p><p className="text-gray-400 text-[10px]">{user.role}</p></div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            className={cls("flex items-center gap-2.5 mx-2 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors text-left w-[calc(100%-16px)]", page === n.id ? "bg-[#c0272d] text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}>
            <span>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      <div className="px-3 py-3 text-[10px] text-gray-500 border-t border-white/[.06]">CourierPro · v1.0</div>
    </aside>
  );
}

function Topbar({ user, onLogout }) {
  const roleColors = { admin: "bg-purple-600", staff: "bg-blue-600", cashier: "bg-orange-600" };
  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-5 z-[50]">
      <div className="flex-1" />
      <div className={cls("px-2.5 py-1 rounded-full text-white text-[11px] font-bold capitalize", roleColors[user.role] || "bg-gray-600")}>{user.role}</div>
      <div className="text-sm font-medium text-gray-700">{user.full_name}</div>
      <button onClick={onLogout} className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Sign Out</button>
    </header>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────
function LandingPage({ onStaff, onTrack }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col" style={{ fontFamily: "system-ui,sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle,rgba(192,39,45,0.18) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-8%", right: "-8%", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle,rgba(192,39,45,0.12) 0%,transparent 70%)" }} />
      </div>
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#c0272d] flex items-center justify-center text-white text-sm shadow-lg">📦</div>
          <span className="text-white font-bold text-sm tracking-tight">CourierPro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-500 text-xs">System online</span>
        </div>
      </header>
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="inline-flex items-center gap-2 bg-white/[.06] border border-white/10 rounded-full px-3.5 py-1.5 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c0272d]" />
          <span className="text-xs text-gray-300 font-medium">Courier & Parcel Management</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white text-center tracking-tight mb-2">CourierPro</h1>
        <p className="text-gray-400 text-sm text-center mb-10 max-w-xs">Manage parcels, track shipments, and coordinate deliveries across branches.</p>
        <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={onStaff}
            className="group relative bg-[#c0272d] hover:bg-[#a01f24] text-white rounded-2xl p-6 flex flex-col items-start gap-4 transition-all duration-200 shadow-xl overflow-hidden text-left">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg,rgba(255,255,255,0.08) 0%,transparent 100%)", borderRadius: "16px 16px 0 0", pointerEvents: "none" }} />
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">🛡️</div>
            <div>
              <div className="text-lg font-bold leading-tight mb-1">Staff Sign In</div>
              <div className="text-sm text-red-100 leading-snug">Access your dashboard to manage parcels, couriers, and branches.</div>
            </div>
          </button>
          <button onClick={onTrack}
            className="group relative bg-white/[.07] hover:bg-white/[.12] border border-white/10 text-white rounded-2xl p-6 flex flex-col items-start gap-4 transition-all duration-200 overflow-hidden text-left">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg,rgba(255,255,255,0.04) 0%,transparent 100%)", borderRadius: "16px 16px 0 0", pointerEvents: "none" }} />
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">🔍</div>
            <div>
              <div className="text-lg font-bold leading-tight mb-1">Track Parcel</div>
              <div className="text-sm text-gray-400 leading-snug">Enter your tracking number to check shipment status.</div>
            </div>
          </button>
        </div>
      </main>
      <footer className="relative z-10 text-center py-4 border-t border-white/[.05]">
        <span className="text-gray-600 text-xs">CourierPro · v1.0 · Powered by FastAPI + PostgreSQL</span>
      </footer>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────
export default function CourierSystem({ apiMode = false, authUser = null, onSignIn = null, onLogout = null }) {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

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
      const [s, rp, p, c, co, b] = await Promise.all([
        getDashboardStats(), getRecentParcels(), getParcels(), getCustomers(), getCouriers(), getBranches(),
      ]);
      setStats(s.data); setRecentParcels(rp.data); setParcels(p.data);
      setCustomers(c.data); setCouriers(co.data); setBranchesList(b.data);
      if (authUser?.role === "admin") {
        const u = await getUsers();
        setUsersList(u.data);
      }
    } catch { /* ignore */ }
  }, [apiMode, authUser]);

  useEffect(() => {
    if (apiMode && screen === "app") refreshData();
  }, [apiMode, screen, refreshData]);

  const handleLogin = async (username, password) => {
    const userData = await onSignIn(username, password);
    setUser(userData); setPage("dashboard"); setScreen("app");
  };

  const handleLogout = async () => {
    if (onLogout) await onLogout();
    setUser(null); setScreen("landing");
  };

  if (screen === "landing") return <LandingPage onStaff={() => setScreen("login")} onTrack={() => setScreen("tracking")} />;
  if (screen === "tracking") return <TrackingPage onBack={() => setScreen("landing")} />;
  if (screen === "login") return <LoginPage onSignIn={handleLogin} onBack={() => setScreen("landing")} />;

  if (screen === "app" && !user) return <LandingPage onStaff={() => setScreen("login")} onTrack={() => setScreen("tracking")} />;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Sidebar page={page} setPage={setPage} user={user} />
      <Topbar user={user} onLogout={handleLogout} />
      <main className="ml-60 mt-14 min-h-[calc(100vh-3.5rem)] p-6">
        {page === "dashboard" && <Dashboard stats={stats} recentParcels={recentParcels} />}
        {page === "parcels" && <ParcelsList parcels={parcels} setParcels={setParcels} apiMode={apiMode} onRefresh={refreshData} />}
        {page === "book" && <BookParcel customers={customers} branches={branchesList} couriers={couriers} onSuccess={refreshData} />}
        {page === "customers" && <CustomersPage customers={customers} setCustomers={setCustomers} apiMode={apiMode} user={user} />}
        {page === "couriers" && <CouriersPage couriers={couriers} setCouriers={setCouriers} />}
        {page === "branches" && <BranchesPage branches={branchesList} setBranches={setBranchesList} />}
        {page === "users" && user.role === "admin" && <UsersPage users={usersList} setUsers={setUsersList} />}
      </main>
    </div>
  );
}
