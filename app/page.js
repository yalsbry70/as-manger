"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase as sb } from "../lib/supabase";
import { RiyalIcon } from "riyal/react";
import {
  Wrench, Users, UserCog, Wallet, Phone, MapPin, Plus, Pencil, Trash2,
  LogOut, Search, X, Calendar, TrendingUp, Clock, FileText,
} from "lucide-react";

const BRAND = "المهندس رشاد سعيد";
const BRAND_SUB = "سجل الأعمال والحسابات";
const SV = { install: "تركيب", maintenance: "صيانة", cleaning: "تنظيف", gas_refill: "تعبئة فريون", relocation: "نقل", other: "أخرى" };
const SVC_PREFIX = "نوع العمل: ";
const parseNotes = (notes) => {
  const raw = String(notes || "");
  if (raw.startsWith(SVC_PREFIX)) {
    const i = raw.indexOf("\n");
    if (i === -1) return { otherLabel: raw.slice(SVC_PREFIX.length).trim(), notes: "" };
    return { otherLabel: raw.slice(SVC_PREFIX.length, i).trim(), notes: raw.slice(i + 1) };
  }
  return { otherLabel: "", notes: raw };
};
const packNotes = (serviceType, otherLabel, notes) => {
  const body = String(notes || "").trim();
  if (serviceType === "other" && String(otherLabel || "").trim()) {
    return SVC_PREFIX + String(otherLabel).trim() + (body ? "\n" + body : "");
  }
  return body || null;
};
const serviceName = (j) => {
  if (!j) return "—";
  if (j.service_type === "other") return parseNotes(j.notes).otherLabel || "أخرى";
  return SV[j.service_type] || j.service_type || "—";
};
const jobNotes = (j) => parseNotes(j?.notes).notes;
const ST = { new: "جديد", scheduled: "مجدول", in_progress: "قيد التنفيذ", completed: "مكتمل", cancelled: "ملغي", postponed: "مؤجل" };
const n = (v) => Number(v || 0);
const num = (v) => n(v).toLocaleString("en-US", { maximumFractionDigits: 2 });
const R = (v) => <span className={"money" + (n(v) < 0 ? " neg" : "")}><RiyalIcon width={14} height={14} aria-label="ريال" />{num(v)}</span>;
const Sign = (v) => {
  const x = Math.round(n(v) * 100) / 100;
  const cls = x > 0 ? " pos" : x < 0 ? " neg" : "";
  return <span className={"money" + cls}><RiyalIcon width={14} height={14} aria-label="ريال" />{x > 0 ? "+" + num(x) : num(x)}</span>;
};
const custBal = (remaining) => {
  const x = Math.round(n(remaining) * 100) / 100;
  if (x > 0) return { label: "المتبقي عنده", value: -x, kind: "over" };
  if (x < 0) return { label: "المتبقي له", value: -x, kind: "clear" };
  return { label: "خالص", value: 0, kind: "" };
};
const holdBal = (balance) => {
  const x = Math.round(n(balance) * 100) / 100;
  if (x > 0) return { label: "المتبقي له", value: x };
  if (x < 0) return { label: "المتبقي عنده", value: x };
  return { label: "خالص", value: 0 };
};
function WaIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.16-3.44-8.45zM12.07 21.3h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.74.98 1-3.64-.22-.37a9.36 9.36 0 0 1-1.44-5c0-5.18 4.22-9.4 9.42-9.4 2.51 0 4.87.98 6.65 2.76a9.35 9.35 0 0 1 2.75 6.65c0 5.18-4.22 9.4-9.4 9.53zm5.16-7.03c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.16.18-.33.21-.61.07-.28-.14-1.18-.43-2.25-1.38-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1 2.71 1.14 2.9c.14.19 1.97 3.01 4.77 4.22.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.66-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33z" />
    </svg>
  );
}
function Mark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="3.1" fill="currentColor" />
      <path d="M24 5.5v10.2M24 32.3V42.5M7.2 14.6l8.8 5.1M32 28.3l8.8 5.1M7.2 33.4l8.8-5.1M32 19.7l8.8-5.1" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
      <path d="M24 9.2 20.6 13.2M24 9.2 27.4 13.2M24 38.8 20.6 34.8M24 38.8 27.4 34.8M11.2 16.8l1.2 4.6M11.2 16.8l4.4 1.6M36.8 31.2l-1.2-4.6M36.8 31.2l-4.4-1.6M11.2 31.2l1.2-4.6M11.2 31.2l4.4-1.6M36.8 16.8l-1.2 4.6M36.8 16.8l-4.4 1.6" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
    </svg>
  );
}
const dt = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "long", year: "numeric" }) : "";
const monthLabel = (m) => /^\d{4}-\d{2}$/.test(m) ? new Date(m + "-01T00:00:00").toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { month: "long", year: "numeric" }) : m;
const sum = (a, k) => a.reduce((s, x) => s + n(x[k]), 0);
const owed = (a) => Math.round(a.reduce((s, x) => s + Math.max(0, n(x.remaining)), 0) * 100) / 100;
const stamp = (v) => {
  if (!v) return "";
  const day = String(v).slice(0, 10);
  const time = String(v).includes("T") ? new Date(v) : null;
  const date = dt(day);
  if (!time || Number.isNaN(time.getTime())) return date;
  const hm = time.toLocaleTimeString("ar-SA-u-nu-latn", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${hm}`;
};
const today = () => new Date().toISOString().slice(0, 10);
const F = ({ l, children }) => (<label className="f"><span>{l}</span>{children}</label>);
const wa = (p) => "https://wa.me/" + String(p || "").replace(/\D/g, "");
const tel = (p) => "tel:+" + String(p || "").replace(/\D/g, "");
function invoiceMarkup(job, customer, engineer) {
  const bal = custBal(job.remaining);
  const spec = [job.brand, job.ac_type].filter(Boolean).join(" ");
  const note = jobNotes(job);
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cell = (label, value) => `
    <div style="background:#fff;border:1px solid #e8eef5;border-radius:14px;padding:14px 16px;min-width:0">
      <div style="color:#64748b;font-size:12px;font-weight:700;margin-bottom:6px">${esc(label)}</div>
      <div style="color:#0f172a;font-size:15px;font-weight:700;line-height:1.45">${esc(value)}</div>
    </div>`;
  const money = (label, value, tone = "") => {
    const bg = tone === "ok" ? "#ecfdf5" : tone === "bad" ? "#fff1f2" : "#f8fafc";
    const bd = tone === "ok" ? "#a7f3d0" : tone === "bad" ? "#fecdd3" : "#e8eef5";
    const fg = tone === "ok" ? "#047857" : tone === "bad" ? "#be123c" : "#0f172a";
    return `
    <div style="background:${bg};border:1px solid ${bd};border-radius:14px;padding:14px 16px;min-width:0">
      <div style="color:#64748b;font-size:12px;font-weight:700;margin-bottom:6px">${esc(label)}</div>
      <div style="color:${fg};font-size:18px;font-weight:800;direction:ltr;text-align:right">${esc(value)} <span style="font-size:12px;font-weight:700">ر.س</span></div>
    </div>`;
  };
  return `
  <div style="width:794px;box-sizing:border-box;background:#f4f7fb;color:#0f172a;font-family:Tahoma,'Segoe UI',Arial,sans-serif;direction:rtl;text-align:right">
    <div style="background:linear-gradient(135deg,#0f766e 0%,#115e59 55%,#0e1525 100%);color:#fff;padding:28px 36px 30px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:18px">
        <div>
          <div style="font-size:13px;opacity:.85;margin-bottom:8px">فاتورة خدمة</div>
          <div style="font-size:30px;font-weight:800;letter-spacing:-.02em;margin:0">${esc(BRAND)}</div>
          <div style="margin-top:8px;font-size:13px;opacity:.9">${esc(BRAND_SUB)}</div>
        </div>
        <div style="text-align:left;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:12px 14px;min-width:160px">
          <div style="display:inline-block;background:#fff;color:#0f766e;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:800;margin-bottom:10px">PDF</div>
          <div style="font-size:12px;opacity:.9;line-height:1.7">
            <div>${esc(new Date().toLocaleDateString("ar-SA-u-nu-latn"))}</div>
            <div>مرجع: ${esc(String(job.id || "").slice(0, 8) || "—")}</div>
            <div>${esc(ST[job.status] || "")}</div>
          </div>
        </div>
      </div>
    </div>

    <div style="padding:24px 28px 10px">
      <div style="background:#fff;border:1px solid #e8eef5;border-radius:18px;padding:18px 18px 8px;margin-bottom:14px;box-shadow:0 8px 24px rgba(15,23,42,.04)">
        <div style="font-size:12px;font-weight:800;color:#0f766e;margin-bottom:12px">بيانات العميل</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
          ${cell("العميل", customer?.name || "—")}
          ${cell("الجوال", customer?.phone || "—")}
          ${cell("العنوان", customer?.address || "—")}
          ${cell("تاريخ العمل", dt(job.job_date) || "—")}
        </div>
      </div>

      <div style="background:#fff;border:1px solid #e8eef5;border-radius:18px;padding:18px 18px 8px;margin-bottom:14px;box-shadow:0 8px 24px rgba(15,23,42,.04)">
        <div style="font-size:12px;font-weight:800;color:#0f766e;margin-bottom:12px">تفاصيل الخدمة</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
          ${cell("نوع العمل", serviceName(job))}
          ${cell("الجهاز", spec ? `${spec} × ${job.units || 1}` : "—")}
          ${cell("المهندس المنفّذ", engineer?.name ? "م. " + engineer.name : "بدون مهندس")}
          ${cell("الحالة", ST[job.status] || "—")}
        </div>
      </div>

      <div style="background:#fff;border:1px solid #e8eef5;border-radius:18px;padding:18px 18px 8px;margin-bottom:14px;box-shadow:0 8px 24px rgba(15,23,42,.04)">
        <div style="font-size:12px;font-weight:800;color:#0f766e;margin-bottom:12px">الملخص المالي</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">
          ${money("سعر العمل", num(job.price))}
          ${money("المقبوض", num(job.paid))}
          ${money(bal.label, num(Math.abs(bal.value)), bal.kind === "over" ? "bad" : bal.kind === "clear" ? "ok" : "")}
          ${money("حق المهندس", num(job.engineer_fee))}
          ${money("تكلفة المواد", num(job.materials_cost))}
          ${money("صافي الربح", num(job.profit), n(job.profit) < 0 ? "bad" : "ok")}
        </div>
      </div>

      ${note ? `<div style="background:#fff;border:1px solid #e8eef5;border-right:4px solid #0f766e;border-radius:16px;padding:14px 16px;margin-bottom:14px;font-size:13px;line-height:1.7;white-space:pre-wrap;box-shadow:0 8px 24px rgba(15,23,42,.04)"><div style="font-size:12px;font-weight:800;color:#0f766e;margin-bottom:6px">ملاحظات</div>${esc(note)}</div>` : ""}

      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:18px;padding:8px 4px 18px">
        <div style="color:#64748b;font-size:12px;line-height:1.7">
          <div>شكرًا لتعاملكم معنا</div>
          <div style="margin-top:4px;font-weight:700;color:#0f766e">${esc(BRAND)}</div>
        </div>
        <div style="min-width:180px;text-align:center">
          <div style="height:48px;border-bottom:1px dashed #cbd5e1;margin-bottom:8px"></div>
          <div style="font-size:11px;color:#94a3b8">التوقيع / الختم</div>
        </div>
      </div>
    </div>
  </div>`;
}
async function downloadInvoicePdf(job, customer, engineer) {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;pointer-events:none;opacity:1";
  host.innerHTML = invoiceMarkup(job, customer, engineer);
  document.body.appendChild(host);
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const target = host.firstElementChild;
    const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const usableW = pageW - margin * 2;
    const imgH = (canvas.height * usableW) / canvas.width;
    const h = Math.min(imgH, pageH - margin * 2);
    pdf.addImage(img, "PNG", margin, margin, usableW, h);
    const safe = String(customer?.name || "فاتورة").replace(/[\\/:*?"<>|]/g, "-");
    pdf.save(`فاتورة-${safe}.pdf`);
  } finally {
    host.remove();
  }
}
function NiceSelect({ value, onChange, options, placeholder = "اختر", className = "", muted = false, required = false }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className={"ns" + (open ? " open" : "") + (muted ? " muted" : "") + (className ? " " + className : "")} ref={box}>
      <button
        type="button"
        className="ns-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={!selected || selected.value === "" ? "ns-ph" : ""}>{selected?.label || placeholder}</span>
      </button>
      {required && <input tabIndex={-1} value={value ?? ""} required readOnly style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }} />}
      {open && (
        <ul className="ns-menu" role="listbox">
          {options.map((o) => (
            <li key={String(o.value)}>
              <button
                type="button"
                className={"ns-opt" + (String(o.value) === String(value) ? " on" : "") + (o.dim ? " dim" : "")}
                role="option"
                aria-selected={String(o.value) === String(value)}
                onClick={() => {
                  onChange({ target: { value: o.value } });
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function Kpi({ tone, icon, label, valueClass, children }) {
  return (
    <div className="kpi">
      <div className="meta"><i className={tone}>{icon}</i><span>{label}</span></div>
      <b className={valueClass}>{children}</b>
    </div>
  );
}

export default function App() {
  const [s, setS] = useState(undefined);
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setS(data.session));
    const { data } = sb.auth.onAuthStateChange((_, x) => setS(x));
    return () => data.subscription.unsubscribe();
  }, []);
  if (s === undefined) return <Boot />;
  return s ? <Main /> : <Login />;
}

function Boot() {
  return (
    <div className="boot">
      <span className="logo"><Mark size={28} /></span>
      <p>جارٍ التحميل...</p>
    </div>
  );
}

function Login() {
  const [e, setE] = useState(""), [p, setP] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const go = async (ev) => {
    ev.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await sb.auth.signInWithPassword({ email: e, password: p });
    setBusy(false);
    if (error) setErr("بيانات الدخول غير صحيحة");
  };
  return (
    <div className="login-page">
      <form className="login" onSubmit={go}>
        <div className="login-brand">
          <span className="logo"><Mark size={34} /></span>
          <p className="eyebrow">سجل الأعمال</p>
          <h2>{BRAND}</h2>
          <p className="sub">{BRAND_SUB}</p>
        </div>
        <F l="البريد الإلكتروني"><input type="email" autoComplete="username" required value={e} onChange={(x) => setE(x.target.value)} placeholder="name@email.com" /></F>
        <F l="كلمة المرور"><input type="password" autoComplete="current-password" required value={p} onChange={(x) => setP(x.target.value)} placeholder="••••••••" /></F>
        {err && <p className="alert">{err}</p>}
        <button className="pri wide" disabled={busy}>{busy ? "جارٍ الدخول..." : "دخول"}</button>
        <p className="login-note">الدخول لصاحب العمل فقط</p>
      </form>
    </div>
  );
}

function Main() {
  const [tab, setTab] = useState("jobs");
  const [d, setD] = useState({ c: [], e: [], j: [], pays: [], receipts: [], brands: [], types: [] });
  const [f, setF] = useState("all"), [q, setQ] = useState(""), [form, setForm] = useState(null);
  const [ask, setAsk] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState("");
  const [nowLabel, setNowLabel] = useState("");
  const load = useCallback(async () => {
    const [c, e, j, pays, receipts, brands, types] = await Promise.all([
      sb.from("customers").select("*").order("name"),
      sb.from("engineers").select("*").order("name"),
      sb.from("job_financials").select("*").order("job_date", { ascending: false }),
      sb.from("engineer_payments").select("engineer_id,amount"),
      sb.from("customer_payments").select("*"),
      sb.from("brands").select("name,sort").order("sort").order("name"),
      sb.from("ac_types").select("name,sort").order("sort").order("name"),
    ]);
    const err = c.error || e.error || j.error || pays.error || receipts.error;
    if (err) setToast("خطأ في تحميل البيانات: " + err.message);
    else if (brands.error || types.error) setToast("قوائم الشركة والنوع غير مثبتة بعد. نفّذ ملف db/catalog.sql في محرر SQL.");
    setD({
      c: c.data || [], e: e.data || [], j: j.data || [], pays: pays.data || [], receipts: receipts.data || [],
      brands: brands.data || [], types: types.data || [],
    });
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setNowLabel(new Date().toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { weekday: "long", day: "numeric", month: "long" }));
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const run = async (p) => {
    const { error } = await p;
    if (error) { setToast(error.message); return false; }
    load();
    return true;
  };
  const setStatus = (id, status) => run(sb.from("jobs").update({ status }).eq("id", id));
  const cm = Object.fromEntries(d.c.map((x) => [x.id, x]));
  const em = Object.fromEntries(d.e.map((x) => [x.id, x]));
  const jm = Object.fromEntries(d.j.map((x) => [x.id, x]));
  const origin = (j) => jm[j.related_job_id] ||
    (j.service_type === "maintenance" ? d.j.find((x) => x.customer_id === j.customer_id && x.service_type === "install") : null);

  const query = q.trim();
  const jobs = d.j.filter((j) => (f === "all" || j.status === f) &&
    (!query || (cm[j.customer_id]?.name + " " + (cm[j.customer_id]?.phone || "")).includes(query)));
  const live = d.j.filter((j) => j.status !== "cancelled");
  const books = d.e.map((e) => {
    const jobs = live.filter((j) => j.engineer_id === e.id);
    const earned = sum(jobs, "engineer_fee");
    const paid = sum(d.pays.filter((p) => p.engineer_id === e.id), "amount");
    const balance = Math.round((earned - paid) * 100) / 100;
    return { engineer_id: e.id, name: e.name, earned, paid, balance, jobs };
  });
  const openN = d.j.filter((j) => ["new", "scheduled", "in_progress"].includes(j.status)).length;
  const months = {};
  live.forEach((j) => { const m = (j.job_date || "").slice(0, 7) || "—"; (months[m] ||= []).push(j); });
  const nav = [["jobs", "الأعمال", Wrench], ["customers", "العملاء", Users], ["engineers", "المهندسون", UserCog], ["acc", "الحسابات", Wallet]];

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span className="logo"><Mark size={22} /></span><div><b>{BRAND}</b><small>{BRAND_SUB}</small></div></div>
        <nav className="side-nav" aria-label="القائمة الرئيسية">
          {nav.map(([k, l, I]) => (
            <button type="button" key={k} className={"nav-item" + (tab === k ? " on" : "")} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>
              <I size={18} strokeWidth={tab === k ? 2.4 : 2} className="nav-ico" />
              <span className="nav-label">{l}</span>
              <span className={"nav-badge" + (k === "jobs" && openN > 0 ? " show" : "")}>{k === "jobs" && openN > 0 ? openN : ""}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="out" onClick={() => sb.auth.signOut()}><LogOut size={18} /><span>تسجيل الخروج</span></button>
      </aside>
      <div className="stage">
        <header className="topbar">
          <div className="brand"><span className="logo"><Mark size={20} /></span><b>{BRAND}</b></div>
          <button type="button" className="ib" title="تسجيل الخروج" onClick={() => sb.auth.signOut()}><LogOut size={18} /></button>
        </header>
        <main>
          {tab === "jobs" && <>
            <div className="ph">
              <div>
                <h1>الأعمال</h1>
                <p>{query || f !== "all" ? `${jobs.length} نتيجة` : "أعمال التركيب والصيانة وحساباتها"}</p>
              </div>
              {nowLabel && <span className="today">{nowLabel}</span>}
            </div>
            <div className="kpis">
              <Kpi tone="tone-due" icon={<Wallet size={18} />} label="المتبقي عند العملاء" valueClass={owed(live) > 0 ? "red" : ""}>{Sign(owed(live) ? -owed(live) : 0)}</Kpi>
              <Kpi tone="tone-info" icon={<Clock size={18} />} label="أعمال جارية">{openN}</Kpi>
              <Kpi tone="tone-ok" icon={<TrendingUp size={18} />} label="صافي الربح" valueClass={n(sum(live, "profit")) < 0 ? "red" : "green"}>{R(sum(live, "profit"))}</Kpi>
            </div>
            <div className="bar">
              <div className="search">
                <Search size={16} />
                <input placeholder="بحث باسم العميل أو جواله" value={q} onChange={(x) => setQ(x.target.value)} />
              </div>
              <NiceSelect
                className="bar-ns"
                value={f}
                onChange={(x) => setF(x.target.value)}
                options={[{ value: "all", label: "كل الحالات" }, ...Object.entries(ST).map(([k, v]) => ({ value: k, label: v }))]}
              />
              <button type="button" className="pri" onClick={() => setForm({ customer_id: "", service_type: "install", status: "new", units: 1, warranty_months: 12, job_date: today() })}><Plus size={17} /> عمل جديد</button>
            </div>
            {jobs.map((j) => {
              const c = cm[j.customer_id], o = origin(j);
              const spec = [j.brand, j.ac_type].filter(Boolean).join(" ");
              return (
                <article className="job" key={j.id} onClick={() => setDetail(j.id)}>
                  <div className="jh">
                    <div className="av">{(c?.name || "؟").trim().charAt(0)}</div>
                    <div className="jt"><b>{c?.name || "عميل محذوف"}</b><span>{c?.address || c?.phone || "بدون عنوان"}</span></div>
                    <StatusPick value={j.status} onChange={(status) => setStatus(j.id, status)} />
                  </div>
                  <div className="facts">
                    <div><small>نوع العمل</small><b>{serviceName(j)}</b></div>
                    <div><small>الجهاز</small><b>{spec ? `${spec} × ${j.units}` : "—"}</b></div>
                    <div><small>التاريخ</small><b>{dt(j.job_date) || "بدون تاريخ"}</b></div>
                    <div className={!j.engineer_id ? "dim" : ""}><small>المهندس</small><b>{em[j.engineer_id]?.name || "بدون مهندس"}</b></div>
                    <div><small>السعر</small><b>{R(j.price)}</b></div>
                    <div><small>المقبوض</small><b>{R(j.paid)}</b></div>
                    <div className={custBal(j.remaining).kind}><small>{custBal(j.remaining).label}</small><b>{Sign(custBal(j.remaining).value)}</b></div>
                    <div><small>حق المهندس</small><b>{R(j.engineer_fee)}</b></div>
                    <div><small>تكلفة المواد</small><b>{R(j.materials_cost)}</b></div>
                    <div className={n(j.profit) < 0 ? "over" : "clear"}><small>صافي الربح</small><b>{R(j.profit)}</b></div>
                  </div>
                  {jobNotes(j) && <div className="note"><small>ملاحظات</small><p>{jobNotes(j)}</p></div>}
                  {(o || j.warranty_until) && (
                    <p className="fine">
                      {o && <span>المركِّب الأصلي: {em[o.engineer_id]?.name || "—"} ({dt(o.job_date) || "بدون تاريخ"})</span>}
                      {j.warranty_until && <span className={j.warranty_until < today() ? "red" : ""}>{j.warranty_until < today() ? "الضمان منتهي" : "الضمان ساري حتى " + dt(j.warranty_until)}</span>}
                    </p>
                  )}
                  <div className="acts" onClick={(e) => e.stopPropagation()}>
                    {j.status !== "completed" && <button type="button" className="soft done" onClick={() => setStatus(j.id, "completed")}>مكتمل</button>}
                    <button type="button" className="soft" onClick={() => setAsk({ kind: "cust", job: j })}><Plus size={16} /> تسجيل دفعة</button>
                    <button type="button" className="soft pdf" onClick={() => downloadInvoicePdf(j, c, em[j.engineer_id])}><FileText size={16} /> تصدير PDF</button>
                    <div className="ibs">
                      {c?.phone && <a className="ib call" title="اتصال" href={tel(c.phone)}><Phone size={17} /></a>}
                      {c?.phone && <a className="ib wa" title="واتساب العميل" href={wa(c.phone)} target="_blank" rel="noreferrer"><WaIcon /></a>}
                      {c?.map_url && <a className="ib pin" title="الموقع" href={c.map_url} target="_blank" rel="noreferrer"><MapPin size={17} /></a>}
                      <button type="button" className="ib edit" title="تعديل" onClick={() => setForm(j)}><Pencil size={17} /></button>
                      <button type="button" className="ib del" title="حذف" onClick={() => setAsk({ kind: "del", job: j })}><Trash2 size={17} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
            {!jobs.length && (
              <div className="empty">
                <div className="empty-ico"><Wrench size={22} /></div>
                <b>{d.j.length ? "لا توجد نتائج" : "لا توجد أعمال بعد"}</b>
                <p>{d.j.length ? "جرّب اسمًا آخر أو حالة مختلفة." : "سجّل أول تركيب أو صيانة من زر عمل جديد."}</p>
              </div>
            )}
          </>}

          {tab === "customers" && <>
            <div className="ph"><div><h1>العملاء</h1><p>{d.c.length ? `${d.c.length} عميل` : "أضف العملاء لربط الأعمال بهم"}</p></div>{nowLabel && <span className="today">{nowLabel}</span>}</div>
            <NewBox title="عميل" fields={[["name", "الاسم", 1], ["phone", "الجوال", 0, "tel"], ["address", "العنوان"], ["map_url", "رابط الموقع"]]} onAdd={(v) => run(sb.from("customers").insert(v))} />
            {d.c.map((c) => {
              const cj = d.j.filter((j) => j.customer_id === c.id);
              const open = cj.filter((j) => j.status !== "cancelled");
              const debt = owed(open);
              const credit = Math.round(open.reduce((s, j) => s + Math.max(0, -n(j.remaining)), 0) * 100) / 100;
              return (
                <article className="card" key={c.id}>
                  <div className="row">
                    <div className="who">
                      <div className="av">{(c.name || "؟").trim().charAt(0)}</div>
                      <div className="jt"><b>{c.name}</b><span>{[c.phone, c.address].filter(Boolean).join(" · ") || "بدون بيانات تواصل"}</span></div>
                    </div>
                    {(debt > 0 || credit > 0) && (
                      <div className="badges">
                        {debt > 0 && <span className="badge bad">المتبقي عنده {Sign(-debt)}</span>}
                        {credit > 0 && <span className="badge ok">المتبقي له {Sign(credit)}</span>}
                      </div>
                    )}
                  </div>
                  {!!cj.length && (
                    <ul className="mini">
                      {cj.map((j) => (
                        <li key={j.id}>
                          <span>{serviceName(j)} {j.brand || ""}</span>
                          <span className="sub" style={{ margin: 0 }}>{dt(j.job_date) || "—"} · م. {em[j.engineer_id]?.name || "—"}</span>
                          <span className={"tag " + j.status}>{ST[j.status]}</span>
                          {j.status !== "cancelled" && <b>{custBal(j.remaining).label} {Sign(custBal(j.remaining).value)}</b>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {(c.phone || c.map_url) && (
                    <div className="links">
                      {c.phone && <a className="ib call" title="اتصال" href={tel(c.phone)}><Phone size={17} /></a>}
                      {c.phone && <a className="ib wa" title="واتساب" href={wa(c.phone)} target="_blank" rel="noreferrer"><WaIcon /></a>}
                      {c.map_url && <a className="ib pin" title="الموقع" href={c.map_url} target="_blank" rel="noreferrer"><MapPin size={17} /></a>}
                    </div>
                  )}
                </article>
              );
            })}
            {!d.c.length && <div className="empty"><div className="empty-ico"><Users size={22} /></div><b>لا يوجد عملاء</b><p>أضف أول عميل من النموذج أعلاه.</p></div>}
          </>}

          {tab === "engineers" && <>
            <div className="ph"><div><h1>المهندسون</h1><p>أجر كل عمل مسند يُخصم فورًا من مديونية المهندس</p></div>{nowLabel && <span className="today">{nowLabel}</span>}</div>
            <NewBox title="مهندس" fields={[["name", "الاسم", 1], ["phone", "الجوال", 0, "tel"]]} onAdd={(v) => run(sb.from("engineers").insert(v))} />
            {books.map((b) => {
              const ej = b.jobs;
              const eng = em[b.engineer_id];
              return (
                <article className="card" key={b.engineer_id}>
                  <div className="row">
                    <div className="who">
                      <div className="av alt">{(b.name || "؟").trim().charAt(0)}</div>
                      <div className="jt"><b>م. {b.name}</b><span>{eng?.phone || "بدون جوال"}</span></div>
                    </div>
                    <button type="button" className="pri" onClick={() => setAsk({ kind: "eng", bal: b })}>تسليم مبلغ</button>
                  </div>
                  <div className="stats">
                    <div>مجموع حقوقه<b>{R(b.earned)}</b></div>
                    <div>استلم<b>{R(b.paid)}</b></div>
                    <div>{holdBal(b.balance).label}<b>{Sign(holdBal(b.balance).value)}</b></div>
                  </div>
                  {!!ej.length && (
                    <ul className="mini">
                      {ej.map((j) => (
                        <li key={j.id}>
                          <span>{cm[j.customer_id]?.name || "—"}</span>
                          <span className="sub" style={{ margin: 0 }}>{serviceName(j)} · {ST[j.status]} · {dt(j.job_date) || "بدون تاريخ"}</span>
                          <b>{R(j.engineer_fee)}</b>
                        </li>
                      ))}
                    </ul>
                  )}
                  {eng?.phone && (
                    <div className="links">
                      <a className="ib call" title="اتصال" href={tel(eng.phone)}><Phone size={17} /></a>
                      <a className="ib wa" title="واتساب" href={wa(eng.phone)} target="_blank" rel="noreferrer"><WaIcon /></a>
                    </div>
                  )}
                </article>
              );
            })}
            {!books.length && <div className="empty"><div className="empty-ico"><UserCog size={22} /></div><b>لا يوجد مهندسون</b><p>أضف المهندسين المنفّذين ليظهر حساب كل واحد.</p></div>}
          </>}

          {tab === "acc" && <>
            <div className="ph"><div><h1>الحسابات</h1><p>الإيراد والأرباح والمتبقي</p></div>{nowLabel && <span className="today">{nowLabel}</span>}</div>
            <div className="kpis">
              <Kpi tone="tone-ok" icon={<TrendingUp size={18} />} label="صافي الربح" valueClass={n(sum(live, "profit")) < 0 ? "red" : "green"}>{R(sum(live, "profit"))}</Kpi>
              <Kpi tone="tone-due" icon={<Wallet size={18} />} label="المتبقي عند العملاء" valueClass={owed(live) > 0 ? "red" : ""}>{Sign(owed(live) ? -owed(live) : 0)}</Kpi>
              <Kpi tone="tone-info" icon={<UserCog size={18} />} label={n(sum(books, "balance")) < 0 ? "المتبقي عند المهندسين" : "المتبقي للمهندسين"} valueClass={n(sum(books, "balance")) < 0 ? "red" : n(sum(books, "balance")) > 0 ? "green" : ""}>{Sign(sum(books, "balance"))}</Kpi>
            </div>
            <div className="card">
              <div className="stats">
                <div>إيراد الأعمال<b>{R(sum(live, "price"))}</b></div>
                <div>حقوق المهندسين<b>{R(sum(live, "engineer_fee"))}</b></div>
                <div>تكلفة المواد<b>{R(sum(live, "materials_cost"))}</b></div>
                {live.some((j) => n(j.remaining) < 0) && <div>المتبقي للعملاء<b>{Sign(Math.round(live.reduce((s, j) => s + Math.max(0, -n(j.remaining)), 0) * 100) / 100)}</b></div>}
              </div>
            </div>
            <div className="card table-card">
              <div className="card-h"><b>ملخص الأشهر</b><span className="sub" style={{ margin: 0 }}>كل الأعمال غير الملغاة</span></div>
              <table>
                <thead><tr><th>الشهر</th><th>الأعمال</th><th>الإيراد</th><th>الربح</th></tr></thead>
                <tbody>
                  {Object.keys(months).sort().reverse().map((m) => (
                    <tr key={m}><td>{monthLabel(m)}</td><td className="num">{months[m].length}</td><td>{R(sum(months[m], "price"))}</td><td>{R(sum(months[m], "profit"))}</td></tr>
                  ))}
                  {!Object.keys(months).length && <tr><td className="empty-cell" colSpan={4}>لا توجد أعمال بعد</td></tr>}
                </tbody>
              </table>
            </div>
          </>}
        </main>
      </div>
      {toast && <div className="toast" role="alert"><span>{toast}</span><button type="button" className="ib" onClick={() => setToast("")}><X size={16} /></button></div>}
      {form && <JobForm init={form} d={d} em={em} brands={d.brands} types={d.types} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} onError={setToast} />}
      {detail && (() => {
        const job = d.j.find((j) => j.id === detail);
        if (!job) return null;
        return (
          <JobDetail
            job={job}
            customer={cm[job.customer_id]}
            engineer={em[job.engineer_id]}
            originJob={origin(job)}
            engineers={em}
            receipts={(d.receipts || []).filter((p) => p.job_id === job.id)}
            onClose={() => setDetail(null)}
            onEdit={() => { setDetail(null); setForm(job); }}
            onPay={() => { setDetail(null); setAsk({ kind: "cust", job }); }}
            onStatus={(status) => setStatus(job.id, status)}
          />
        );
      })()}
      {ask?.kind === "cust" && (
        <AskAmount
          title="تسجيل دفعة"
          hint={<>{custBal(ask.job.remaining).label} — {cm[ask.job.customer_id]?.name || "العميل"}: {Sign(custBal(ask.job.remaining).value)}</>}
          label="مبلغ الدفعة"
          def={n(ask.job.remaining) > 0 ? ask.job.remaining : ""}
          onClose={() => setAsk(null)}
          onOk={(a) => { const id = ask.job.id; setAsk(null); run(sb.from("customer_payments").insert({ job_id: id, amount: a })); }}
        />
      )}
      {ask?.kind === "eng" && (
        <AskAmount
          title={"تسليم مبلغ لـ م. " + ask.bal.name}
          hint={<>{holdBal(ask.bal.balance).label}: {Sign(holdBal(ask.bal.balance).value)}</>}
          label="المبلغ المسلَّم"
          def={n(ask.bal.balance) > 0 ? ask.bal.balance : ""}
          onClose={() => setAsk(null)}
          onOk={(a) => { const id = ask.bal.engineer_id; setAsk(null); run(sb.from("engineer_payments").insert({ engineer_id: id, amount: a })); }}
        />
      )}
      {ask?.kind === "del" && (
        <Confirm
          title="حذف العمل"
          text={"سيُخفى عمل " + (cm[ask.job.customer_id]?.name || "هذا العميل") + " من السجل. يمكن استرجاعه من قاعدة البيانات."}
          ok="حذف العمل"
          onClose={() => setAsk(null)}
          onOk={() => { const id = ask.job.id; setAsk(null); run(sb.from("jobs").update({ deleted_at: new Date().toISOString() }).eq("id", id)); }}
        />
      )}
    </div>
  );
}

function NewBox({ title, fields, onAdd }) {
  const [v, setV] = useState({});
  return (
    <form className="card" onSubmit={async (e) => {
      e.preventDefault();
      const ok = await onAdd(Object.fromEntries(Object.entries(v).filter(([, x]) => x)));
      if (ok) setV({});
    }}>
      <div className="card-h"><b>إضافة {title}</b></div>
      <div className="two">{fields.map(([k, l, r, mode]) =>
        <F key={k} l={l}><input required={!!r} inputMode={mode || "text"} value={v[k] || ""} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></F>)}</div>
      <div className="composer-a"><button className="pri"><Plus size={16} /> حفظ {title}</button></div>
    </form>
  );
}

function Overlay({ children, onClose, labelledBy }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

function AskAmount({ title, hint, label, def, onClose, onOk }) {
  const [a, setA] = useState(def || "");
  return (
    <Overlay onClose={onClose} labelledBy="ask-title">
      <form className="sheet sm" onSubmit={(e) => { e.preventDefault(); if (n(a) > 0) onOk(n(a)); }}>
        <div className="mh">
          <div><h3 id="ask-title">{title}</h3><p className="sub">{hint}</p></div>
          <button type="button" className="ib" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <div className="body">
          <F l={label}><input type="number" inputMode="decimal" step="0.01" min="0.01" autoFocus required value={a} onChange={(e) => setA(e.target.value)} /></F>
        </div>
        <div className="mf"><button className="pri">تأكيد</button><button type="button" onClick={onClose}>إلغاء</button></div>
      </form>
    </Overlay>
  );
}

function Confirm({ title, text, ok, onClose, onOk }) {
  return (
    <Overlay onClose={onClose} labelledBy="confirm-title">
      <form className="sheet sm" onSubmit={(e) => { e.preventDefault(); onOk(); }}>
        <div className="mh">
          <h3 id="confirm-title">{title}</h3>
          <button type="button" className="ib" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <p className="confirm-text">{text}</p>
        <div className="mf"><button className="danger">{ok}</button><button type="button" onClick={onClose}>إلغاء</button></div>
      </form>
    </Overlay>
  );
}

function StatusPick({ value, onChange }) {
  return (
    <select className={"tag pick " + value} value={value} aria-label="حالة العمل" onClick={(e) => e.stopPropagation()} onChange={(e) => onChange(e.target.value)}>
      {Object.entries(ST).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
}

function JobDetail({ job, customer, engineer, originJob, engineers, receipts, onClose, onEdit, onPay, onStatus }) {
  const spec = [job.brand, job.ac_type].filter(Boolean).join(" ");
  const pays = [...receipts].sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  const notes = jobNotes(job);
  return (
    <Overlay onClose={onClose} labelledBy="detail-title">
      <div className="sheet">
        <div className="mh">
          <div>
            <h3 id="detail-title">{customer?.name || "عمل"}</h3>
            <p className="sub">{serviceName(job)}{spec ? " · " + spec : ""}{job.units ? " × " + job.units : ""}</p>
          </div>
          <button type="button" className="ib" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <div className="body">
          <div className="when">
            <i><Calendar size={18} /></i>
            <div>
              <small>تاريخ العمل</small>
              <b>{dt(job.job_date) || "بدون تاريخ"}</b>
            </div>
            <StatusPick value={job.status} onChange={onStatus} />
          </div>
          <dl className="kv">
            <div><dt>العميل</dt><dd>{customer?.name || "—"}</dd></div>
            <div><dt>الجوال</dt><dd>{customer?.phone || "—"}</dd></div>
            <div><dt>العنوان</dt><dd>{customer?.address || "—"}</dd></div>
            <div><dt>نوع العمل</dt><dd>{serviceName(job)}</dd></div>
            <div><dt>المهندس</dt><dd className={engineer?.name ? "" : "muted-val"}>{engineer?.name ? "م. " + engineer.name : "بدون مهندس"}</dd></div>
            {engineer?.phone && <div><dt>جوال المهندس</dt><dd>{engineer.phone}</dd></div>}
            {originJob && <div><dt>التركيب الأصلي</dt><dd>{engineers[originJob.engineer_id]?.name || "—"} ({dt(originJob.job_date) || "بدون تاريخ"})</dd></div>}
            <div><dt>السعر</dt><dd>{R(job.price)}</dd></div>
            <div><dt>المقبوض</dt><dd>{R(job.paid)}</dd></div>
            <div><dt>{custBal(job.remaining).label}</dt><dd>{Sign(custBal(job.remaining).value)}</dd></div>
            <div><dt>حق المهندس</dt><dd>{R(job.engineer_fee)}</dd></div>
            <div><dt>تكلفة المواد</dt><dd>{R(job.materials_cost)}</dd></div>
            <div><dt>صافي الربح</dt><dd className={n(job.profit) < 0 ? "red" : "green"}>{R(job.profit)}</dd></div>
            {job.warranty_until && <div><dt>الضمان</dt><dd className={job.warranty_until < today() ? "red" : ""}>{job.warranty_until < today() ? "منتهي" : "ساري حتى " + dt(job.warranty_until)}</dd></div>}
            {notes && <div><dt>ملاحظات</dt><dd>{notes}</dd></div>}
          </dl>
          <div className="sec-label">الدفعات</div>
          {pays.length ? (
            <ul className="pay-list">
              {pays.map((p) => (
                <li key={p.id}>
                  <span>{stamp(p.created_at) || "بدون تاريخ"}</span>
                  <b>{R(p.amount)}</b>
                </li>
              ))}
            </ul>
          ) : <p className="sub">لا توجد دفعات مسجّلة على هذا العمل.</p>}
        </div>
        <div className="mf">
          {job.status !== "completed" && <button type="button" className="pri" onClick={() => onStatus("completed")}>مكتمل</button>}
          <button type="button" className="pri" onClick={onPay}>تسجيل دفعة</button>
          <button type="button" className="soft pdf" onClick={() => downloadInvoicePdf(job, customer, engineer)}><FileText size={16} /> تصدير PDF</button>
          <button type="button" onClick={onEdit}>تعديل</button>
        </div>
      </div>
    </Overlay>
  );
}

function CatalogSelect({ label, value, onChange, rows }) {
  const names = rows.map((r) => r.name);
  const extra = value && !names.includes(value) ? [value] : [];
  const options = [
    { value: "", label: "—" },
    ...extra.map((name) => ({ value: name, label: name })),
    ...names.map((name) => ({ value: name, label: name })),
  ];
  return (
    <F l={label}>
      <NiceSelect value={value} onChange={onChange} options={options} placeholder="—" />
    </F>
  );
}

function JobForm({ init, d, em, brands, types, onClose, onSaved, onError }) {
  const parsed = parseNotes(init?.notes);
  const [v, setV] = useState({ ...init, notes: parsed.notes, other_label: init?.other_label ?? parsed.otherLabel });
  const g = (k) => v[k] ?? "";
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const setService = (e) => {
    const service_type = e.target.value;
    setV({ ...v, service_type, other_label: service_type === "other" ? (v.other_label || "") : "" });
  };
  const inst = d.j.filter((x) => x.customer_id === v.customer_id && x.service_type === "install" && x.id !== v.id);
  const save = async (ev) => {
    ev.preventDefault();
    if (v.service_type === "other" && !String(v.other_label || "").trim()) {
      return onError("اكتب نوع العمل عند اختيار أخرى");
    }
    let cid = v.customer_id;
    if (cid === "new") {
      const r = await sb.from("customers").insert({ name: v.nm, phone: v.ph || null, address: v.ad || null, map_url: v.mp || null }).select().single();
      if (r.error) return onError(r.error.message);
      cid = r.data.id;
    }
    const row = {
      customer_id: cid, engineer_id: v.engineer_id || null,
      related_job_id: v.service_type === "maintenance" && v.related_job_id ? v.related_job_id : null,
      service_type: v.service_type, status: v.status, brand: v.brand || null, ac_type: v.ac_type || null,
      units: n(v.units) || 1, job_date: v.job_date || null, price: n(v.price), engineer_fee: n(v.engineer_fee),
      materials_cost: n(v.materials_cost), warranty_months: n(v.warranty_months),
      notes: packNotes(v.service_type, v.other_label, v.notes),
    };
    const r = v.id ? await sb.from("jobs").update(row).eq("id", v.id).select().single()
                   : await sb.from("jobs").insert(row).select().single();
    if (r.error) return onError(r.error.message);
    if (!v.id && n(v.deposit) > 0) {
      const p = await sb.from("customer_payments").insert({ job_id: r.data.id, amount: n(v.deposit) });
      if (p.error) onError(p.error.message);
    }
    onSaved();
  };
  return (
    <Overlay onClose={onClose} labelledBy="job-title">
      <form className="sheet" onSubmit={save}>
        <div className="mh">
          <div>
            <h3 id="job-title">{v.id ? "تعديل عمل" : "عمل جديد"}</h3>
            <p className="sub">{v.id ? "حدّث بيانات العمل والمبالغ." : "العميل، الخدمة، والمبالغ في خطوة واحدة."}</p>
          </div>
          <button type="button" className="ib" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <div className="body">
          <div className="sec-label">العميل</div>
          <F l="العميل">
            <NiceSelect
              required
              value={g("customer_id")}
              onChange={set("customer_id")}
              placeholder="اختر العميل"
              options={[
                { value: "new", label: "+ عميل جديد" },
                ...d.c.map((c) => ({ value: c.id, label: `${c.name} ${c.phone || ""}`.trim() })),
              ]}
            />
          </F>
          {v.customer_id === "new" && <div className="two">
            <F l="اسم العميل"><input required value={g("nm")} onChange={set("nm")} /></F>
            <F l="الجوال"><input inputMode="tel" value={g("ph")} onChange={set("ph")} /></F>
            <F l="العنوان"><input value={g("ad")} onChange={set("ad")} /></F>
            <F l="رابط الموقع"><input value={g("mp")} onChange={set("mp")} placeholder="https://" /></F>
          </div>}
          <div className="sec-label">تفاصيل الخدمة</div>
          <div className="two equal">
            <F l="الخدمة">
              <NiceSelect value={g("service_type")} onChange={setService} options={Object.entries(SV).map(([k, l]) => ({ value: k, label: l }))} />
            </F>
            <F l="الحالة">
              <NiceSelect value={g("status")} onChange={set("status")} options={Object.entries(ST).map(([k, l]) => ({ value: k, label: l }))} />
            </F>
            {v.service_type === "other" && (
              <F l="نوع العمل (أخرى)"><input required value={g("other_label")} onChange={set("other_label")} placeholder="مثال: فحص كهرباء / استشارة" /></F>
            )}
            <F l="المهندس المنفّذ">
              <NiceSelect
                muted={!g("engineer_id")}
                value={g("engineer_id")}
                onChange={set("engineer_id")}
                options={[
                  { value: "", label: "بدون مهندس", dim: true },
                  ...d.e.map((e) => ({ value: e.id, label: e.name })),
                ]}
              />
            </F>
            <F l="التاريخ"><input type="date" value={g("job_date")} onChange={set("job_date")} /></F>
            <CatalogSelect label="الشركة" value={g("brand")} onChange={set("brand")} rows={brands} />
            <CatalogSelect label="النوع" value={g("ac_type")} onChange={set("ac_type")} rows={types} />
            <F l="العدد"><input type="number" min="1" value={g("units")} onChange={set("units")} /></F>
            <F l="الضمان (شهر)"><input type="number" min="0" value={g("warranty_months")} onChange={set("warranty_months")} /></F>
          </div>
          {v.service_type === "maintenance" && inst.length > 0 &&
            <F l="التركيب الأصلي">
              <NiceSelect
                value={g("related_job_id")}
                onChange={set("related_job_id")}
                options={[
                  { value: "", label: "تلقائي" },
                  ...inst.map((x) => ({ value: x.id, label: `${x.job_date} — م. ${em[x.engineer_id]?.name || "—"}` })),
                ]}
              />
            </F>}
          <div className="sec-label">المبالغ</div>
          <div className="two equal">
            <F l="سعر العميل"><input type="number" inputMode="decimal" step="0.01" min="0" value={g("price")} onChange={set("price")} /></F>
            <F l="حق المهندس"><input type="number" inputMode="decimal" step="0.01" min="0" value={g("engineer_fee")} onChange={set("engineer_fee")} /></F>
            <F l="تكلفة المواد"><input type="number" inputMode="decimal" step="0.01" min="0" value={g("materials_cost")} onChange={set("materials_cost")} /></F>
            {!v.id && <F l="عربون مستلم الآن"><input type="number" inputMode="decimal" step="0.01" min="0" value={g("deposit")} onChange={set("deposit")} /></F>}
          </div>
          <F l="ملاحظات"><textarea rows="3" value={g("notes")} onChange={set("notes")} placeholder="تفاصيل إضافية للمهندس أو للفاتورة" /></F>
        </div>
        <div className="mf"><button className="pri">حفظ العمل</button><button type="button" onClick={onClose}>إلغاء</button></div>
      </form>
    </Overlay>
  );
}
