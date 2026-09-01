"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ward {
  id: string;
  name: string;
  totalBeds: number;
  ratePerDay: number;
}

interface Doctor {
  id: string;
  name: string;
  prefix: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  rate: number;
  taxable: boolean;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "hospital", label: "Hospital Info", icon: "🏥" },
  { id: "wards", label: "Wards & Beds", icon: "🛏" },
  { id: "doctors", label: "Doctors", icon: "👨‍⚕️" },
  { id: "services", label: "Services & Tariff", icon: "🧾" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Badge = ({ children, color = "neutral" }: { children: React.ReactNode; color?: "blue" | "green" | "red" | "neutral" | "amber" }) => {
  const cls: Record<string, string> = {
    blue: "bg-blue-950/60 border-blue-800/50 text-blue-300",
    green: "bg-emerald-950/60 border-emerald-800/50 text-emerald-300",
    red: "bg-red-950/60 border-red-800/50 text-red-300",
    neutral: "bg-neutral-800 border-neutral-700 text-neutral-400",
    amber: "bg-amber-950/60 border-amber-800/50 text-amber-300",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls[color]}`}>{children}</span>;
};

const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-base font-semibold text-white">{title}</h3>
    {action}
  </div>
);

const AddBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm font-medium text-white transition-colors">
    <span className="text-base leading-none">+</span> {label}
  </button>
);

const EditBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 text-xs text-neutral-300 transition-colors">Edit</button>
);

const DeleteBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="rounded-lg border border-red-900/60 bg-red-950/40 hover:bg-red-900/40 px-2.5 py-1 text-xs text-red-400 transition-colors">Delete</button>
);

const inputCls = "w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-colors";
const labelCls = "block text-xs font-medium text-neutral-400 mb-1";

// ─── Hospital Info Tab ────────────────────────────────────────────────────────

function HospitalInfoTab({ companyId }: { companyId: string }) {
  const [form, setForm] = useState({
    name: "", tagline: "", regNo: "", type: "Multi-Specialty", beds: "", phone: "",
    altPhone: "", email: "", address: "", city: "", state: "", pincode: "",
    gstin: "", panNo: "", website: "", emergencyPhone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/ipd/hospital-info?companyId=${companyId}`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setForm({
            name: data.name || "", tagline: data.tagline || "", regNo: data.regNo || "",
            type: data.type || "Multi-Specialty", beds: data.beds?.toString() || "", phone: data.phone || "",
            altPhone: data.altPhone || "", email: data.email || "", address: data.address || "",
            city: data.city || "", state: data.state || "", pincode: data.pincode || "",
            gstin: data.gstin || "", panNo: data.panNo || "", website: data.website || "",
            emergencyPhone: data.emergencyPhone || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/ipd/hospital-info?companyId=${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      alert("Hospital Info Saved");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-neutral-500">Loading hospital info...</div>;

  return (
    <div className="space-y-8">
      {/* Identity */}
      <div>
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Hospital Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Hospital Name</label>
            <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Hospital full name" />
          </div>
          <div>
            <label className={labelCls}>Tagline / Motto</label>
            <input name="tagline" value={form.tagline} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Registration No.</label>
            <input name="regNo" value={form.regNo} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Hospital Type</label>
            <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
              <option>Multi-Specialty</option>
              <option>Super Specialty</option>
              <option>General</option>
              <option>Nursing Home</option>
              <option>Clinic</option>
              <option>Maternity</option>
              <option>Ayurvedic</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Total Beds</label>
            <input name="beds" type="number" value={form.beds} onChange={handleChange} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="border-t border-neutral-800 pt-6">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Contact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Primary Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Alternate Phone</label>
            <input name="altPhone" value={form.altPhone} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Emergency Helpline</label>
            <input name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input name="website" value={form.website} onChange={handleChange} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="border-t border-neutral-800 pt-6">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Street Address</label>
            <input name="address" value={form.address} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input name="city" value={form.city} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input name="state" value={form.state} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Pincode</label>
            <input name="pincode" value={form.pincode} onChange={handleChange} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="border-t border-neutral-800 pt-6">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Legal & Tax</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>GSTIN</label>
            <input name="gstin" value={form.gstin} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>PAN Number</label>
            <input name="panNo" value={form.panNo} onChange={handleChange} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save Hospital Info"}
        </button>
      </div>
    </div>
  );
}

// ─── Wards Tab ────────────────────────────────────────────────────────────────

function WardModal({ ward, onClose, onSave, saving }: { ward?: Ward | null; onClose: () => void; onSave: (w: Omit<Ward, "id">, id?: string) => void; saving: boolean }) {
  const [form, setForm] = useState<Omit<Ward, "id">>({
    name: ward?.name ?? "",
    totalBeds: ward?.totalBeds ?? 10,
    ratePerDay: ward?.ratePerDay ?? 1000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form, ward?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-bold mb-5 border-b border-neutral-800 pb-3">{ward ? "Edit Ward" : "Add New Ward"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Ward Name</label>
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. General Ward A" />
          </div>
          <div>
            <label className={labelCls}>Total Beds</label>
            <input required type="number" min={1} value={form.totalBeds} onChange={e => setForm(p => ({ ...p, totalBeds: Number(e.target.value) }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Rate Per Day (₹)</label>
            <input required type="number" min={0} value={form.ratePerDay} onChange={e => setForm(p => ({ ...p, ratePerDay: Number(e.target.value) }))} className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-neutral-800">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors disabled:opacity-50">
              {saving ? "Saving..." : (ward ? "Update" : "Add Ward")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WardsTab({ companyId }: { companyId: string }) {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; ward?: Ward | null }>({ open: false });
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    fetch(`/api/ipd/wards?companyId=${companyId}`).then(r => r.json()).then(data => {
      setWards(data || []);
      setLoading(false);
    });
  };
  
  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleSave = async (wardData: Omit<Ward, "id">, id?: string) => {
    setSaving(true);
    try {
      if (id) {
        await fetch(`/api/ipd/wards/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wardData) });
      } else {
        await fetch(`/api/ipd/wards?companyId=${companyId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wardData) });
      }
      setModal({ open: false });
      loadData();
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ward?")) return;
    await fetch(`/api/ipd/wards/${id}`, { method: "DELETE" });
    loadData();
  };
  
  const totalBeds = wards.reduce((s, w) => s + w.totalBeds, 0);

  if (loading) return <div className="p-8 text-neutral-500">Loading wards...</div>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Total Wards", value: wards.length, color: "text-white" },
          { label: "Total Beds", value: totalBeds, color: "text-white" },
          { label: "Avg Rate/Day", value: wards.length ? `₹${Math.round(wards.reduce((s, w) => s + w.ratePerDay, 0) / wards.length).toLocaleString()}` : "—", color: "text-emerald-400" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
            <p className="text-xs text-neutral-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <SectionHeader title="Ward List" action={<AddBtn label="Add Ward" onClick={() => setModal({ open: true, ward: null })} />} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wards.map(ward => (
          <div key={ward.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-white">{ward.name}</p>
              <div className="flex gap-2 shrink-0">
                <EditBtn onClick={() => setModal({ open: true, ward })} />
                <DeleteBtn onClick={() => handleDelete(ward.id)} />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-neutral-800/60 px-3 py-2">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Beds</p>
                <p className="font-bold text-white text-lg">{ward.totalBeds}</p>
              </div>
              <div className="rounded-lg bg-neutral-800/60 px-3 py-2">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Rate / Day</p>
                <p className="font-bold text-emerald-400 text-lg">₹{ward.ratePerDay.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
        {wards.length === 0 && <div className="col-span-2 p-8 text-center text-neutral-500">No wards configured.</div>}
      </div>

      {modal.open && <WardModal ward={modal.ward} onClose={() => setModal({ open: false })} onSave={handleSave} saving={saving} />}
    </div>
  );
}

// ─── Doctors Tab ──────────────────────────────────────────────────────────────

function DoctorModal({ doctor, onClose, onSave, saving }: { doctor?: Doctor | null; onClose: () => void; onSave: (d: Omit<Doctor, "id">, id?: string) => void; saving: boolean }) {
  const [form, setForm] = useState<Omit<Doctor, "id">>({
    name: doctor?.name ?? "",
    prefix: doctor?.prefix ?? "Dr.",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form, doctor?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-bold mb-5 border-b border-neutral-800 pb-3">{doctor ? "Edit Doctor" : "Add Doctor"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Prefix</label>
              <select value={form.prefix} onChange={e => setForm(p => ({ ...p, prefix: e.target.value }))} className={inputCls}>
                <option>Dr.</option>
                <option>Prof. Dr.</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className={labelCls}>Full Name</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. Arun Kumar" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-neutral-800">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors disabled:opacity-50">
              {saving ? "Saving..." : (doctor ? "Update" : "Add Doctor")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DoctorsTab({ companyId }: { companyId: string }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; doctor?: Doctor | null }>({ open: false });
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    fetch(`/api/ipd/doctors?companyId=${companyId}`).then(r => r.json()).then(data => {
      setDoctors(data || []);
      setLoading(false);
    });
  };
  
  useEffect(() => {
    loadData();
  }, [companyId]);

  const filtered = doctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (doctorData: Omit<Doctor, "id">, id?: string) => {
    setSaving(true);
    try {
      if (id) {
        await fetch(`/api/ipd/doctors/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doctorData) });
      } else {
        await fetch(`/api/ipd/doctors?companyId=${companyId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doctorData) });
      }
      setModal({ open: false });
      loadData();
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this doctor?")) return;
    await fetch(`/api/ipd/doctors/${id}`, { method: "DELETE" });
    loadData();
  };

  if (loading) return <div className="p-8 text-neutral-500">Loading doctors...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">🔍</span>
          <input
            type="text" placeholder="Search name..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
        <AddBtn label="Add Doctor" onClick={() => setModal({ open: true, doctor: null })} />
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-800 text-neutral-400">
            <tr>
              <th className="p-4">Doctor</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={2} className="p-8 text-center text-neutral-500">No doctors found.</td></tr>
            ) : filtered.map(doc => (
              <tr key={doc.id} className="hover:bg-neutral-800/50 transition-colors">
                <td className="p-4 font-medium text-white">{doc.prefix} {doc.name}</td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <EditBtn onClick={() => setModal({ open: true, doctor: doc })} />
                    <DeleteBtn onClick={() => handleDelete(doc.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && <DoctorModal doctor={modal.doctor} onClose={() => setModal({ open: false })} onSave={handleSave} saving={saving} />}
    </div>
  );
}

// ─── Services Tab ─────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = ["Medical", "Diagnostics", "Lab", "Radiology", "Nursing", "Pharmacy", "Facility", "Surgery", "Consultation", "Ward", "Other"];

function ServiceModal({ service, onClose, onSave, saving }: { service?: Service | null; onClose: () => void; onSave: (s: Omit<Service, "id">, id?: string) => void; saving: boolean }) {
  const [form, setForm] = useState<Omit<Service, "id">>({
    name: service?.name ?? "",
    category: service?.category ?? "Medical",
    rate: service?.rate ?? 0,
    taxable: service?.taxable ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form, service?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-bold mb-5 border-b border-neutral-800 pb-3">{service ? "Edit Service" : "Add Service"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Service / Item Name</label>
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. ECG, Blood Test" />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
              {SERVICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Rate (₹)</label>
            <input required type="number" min={0} value={form.rate} onChange={e => setForm(p => ({ ...p, rate: Number(e.target.value) }))} className={inputCls} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(p => ({ ...p, taxable: !p.taxable }))}
              className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${form.taxable ? "bg-blue-600" : "bg-neutral-700"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.taxable ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-neutral-300">GST / Tax Applicable</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t border-neutral-800">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors disabled:opacity-50">
              {saving ? "Saving..." : (service ? "Update" : "Add Service")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ServicesTab({ companyId }: { companyId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; service?: Service | null }>({ open: false });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    fetch(`/api/ipd/services?companyId=${companyId}`).then(r => r.json()).then(data => {
      setServices(data || []);
      setLoading(false);
    });
  };
  
  useEffect(() => {
    loadData();
  }, [companyId]);

  const categories = ["All", ...Array.from(new Set(services.map(s => s.category))).sort()];
  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async (serviceData: Omit<Service, "id">, id?: string) => {
    setSaving(true);
    try {
      if (id) {
        await fetch(`/api/ipd/services/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(serviceData) });
      } else {
        await fetch(`/api/ipd/services?companyId=${companyId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(serviceData) });
      }
      setModal({ open: false });
      loadData();
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/ipd/services/${id}`, { method: "DELETE" });
    loadData();
  };

  const categoryColors: Record<string, "blue" | "green" | "amber" | "neutral"> = {
    Medical: "blue", Diagnostics: "amber", Lab: "green", Radiology: "amber", Nursing: "green",
  };

  if (loading) return <div className="p-8 text-neutral-500">Loading services...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">🔍</span>
            <input
              type="text" placeholder="Search services..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
          <select
            value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-300 focus:ring-2 focus:ring-blue-600 outline-none"
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <AddBtn label="Add Service" onClick={() => setModal({ open: true, service: null })} />
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-800 text-neutral-400">
              <tr>
                <th className="p-4 min-w-[200px]">Service / Item</th>
                <th className="p-4 min-w-[120px]">Category</th>
                <th className="p-4 min-w-[100px]">Rate (₹)</th>
                <th className="p-4 min-w-[80px]">GST</th>
                <th className="p-4 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-neutral-500">No services found.</td></tr>
              ) : filtered.map(svc => (
                <tr key={svc.id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="p-4 font-medium text-white">{svc.name}</td>
                  <td className="p-4">
                    <Badge color={categoryColors[svc.category] ?? "neutral"}>{svc.category}</Badge>
                  </td>
                  <td className="p-4 font-semibold text-emerald-400">₹{svc.rate.toLocaleString()}</td>
                  <td className="p-4">
                    {svc.taxable ? <Badge color="blue">Taxable</Badge> : <span className="text-neutral-600 text-xs">—</span>}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <EditBtn onClick={() => setModal({ open: true, service: svc })} />
                      <DeleteBtn onClick={() => handleDelete(svc.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && <ServiceModal service={modal.service} onClose={() => setModal({ open: false })} onSave={handleSave} saving={saving} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IpdMasterPage() {
  const { companyId } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("hospital");

  if (!companyId) {
    return <div className="p-8 text-center text-neutral-500">Please select a company in the sidebar to configure IPD Master.</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Page header + tabs */}
      <div className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-[var(--app-header-height,0px)] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h1 className="text-xl font-bold text-white">IPD Master</h1>
              <p className="text-sm text-neutral-400">Manage hospital settings, wards, doctors, and services</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-neutral-400 hover:text-white hover:border-neutral-700"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "hospital" && <HospitalInfoTab companyId={companyId} />}
        {activeTab === "wards" && <WardsTab companyId={companyId} />}
        {activeTab === "doctors" && <DoctorsTab companyId={companyId} />}
        {activeTab === "services" && <ServicesTab companyId={companyId} />}
      </div>
    </div>
  );
}
