"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import Protected from "../components/Protected";
import { supabase } from "../lib/supabase";
import { LanguageToggle, useLanguage, tx } from "../components/LanguageProvider";

type Employee = { id: string; full_name: string; employee_code: string; branch_name: string };
type RecordRow = { id: string; work_date: string; status: string; employee_id: string; employees?: { full_name: string; employee_code: string } | null; notes: string | null };

function AbsencePageContent() {
  const { language } = useLanguage();
  const today = new Date().toLocaleDateString("en-CA");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [employee, setEmployee] = useState("");
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const client = supabase();
    const [e, a] = await Promise.all([
      client.from("employees").select("id,full_name,employee_code,branch_name").eq("active", true).is("deleted_at",null).order("full_name"),
      client.from("attendance").select("id,work_date,status,employee_id,notes,employees(full_name,employee_code)").eq("status", "absent").gte("work_date", rangeStart).lte("work_date", rangeEnd).order("work_date", { ascending: false })
    ]);
    if (e.error || a.error) setError(e.error?.message || a.error?.message || "Could not load absence records.");
    setEmployees((e.data ?? []) as Employee[]);
    setRows((a.data ?? []) as unknown as RecordRow[]);
  }

  useEffect(() => { load(); }, [rangeStart, rangeEnd]);

  async function saveAbsences(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    if (!employee) { setError("कृपया कर्मचारी निवडा."); setBusy(false); return; }
    if (rangeEnd < rangeStart) { setError("शेवटची तारीख सुरुवातीच्या तारखेनंतर असावी."); setBusy(false); return; }
    const client = supabase();
    const { data: user } = await client.auth.getUser();
    const { data: existing, error: readError } = await client.from("attendance")
      .select("work_date,status").eq("employee_id", employee).gte("work_date", rangeStart).lte("work_date", rangeEnd);
    if (readError) { setError(readError.message); setBusy(false); return; }
    const existingRows = existing ?? [];
    const existingAbsences = new Set(existingRows.filter(r => r.status === "absent").map(r => r.work_date));
    const dates: string[] = [];
    for (let d = new Date(rangeStart + "T12:00:00"); d.toISOString().slice(0, 10) <= rangeEnd; d.setDate(d.getDate() + 1)) {
      const day = d.toISOString().slice(0, 10);
      if (!existingAbsences.has(day)) dates.push(day);
    }
    if (dates.length) {
      const payload = dates.map(work_date => ({ employee_id: employee, work_date, status: "absent", notes: "Bulk absence", recorded_by: user.user?.id }));
      const { error: saveError } = await client.from("attendance").upsert(payload, { onConflict: "employee_id,work_date" });
      if (saveError) { setError(saveError.message); setBusy(false); return; }
    }
    const overwritten = existingRows.filter(r => r.status !== "absent").length;
    setMessage(dates.length + " अनुपस्थितीच्या नोंदी जतन झाल्या." + (overwritten ? " " + overwritten + " आधीच्या नोंदी अनुपस्थित म्हणून बदलल्या." : ""));
    await load();
    setBusy(false);
  }

  return <main className="shell">
    <nav className="topbar"><Link href="/" className="brand"><span className="brand-mark"><CalendarCheck /></span><span>Morya<span className="accent">EMP</span></span></Link><div className="nav-actions"><LanguageToggle /><Link href="/" className="back"><ArrowLeft size={16} /> {tx(language,"Dashboard","मुख्य पृष्ठ")}</Link></div></nav>
    <section className="content">
      <p className="eyebrow">{tx(language,"Absence tracking","अनुपस्थिती नोंद")}</p><h1>{tx(language,"Bulk absence entry","एकत्रित अनुपस्थिती नोंद")}</h1>
      <p className="sub">फक्त अनुपस्थित दिवस नोंदवा. हजेरी किंवा उपस्थिती नोंदवण्याची गरज नाही. अनुपस्थित दिवसांनुसार पगारातून कपात डॅशबोर्डवर मोजली जाईल.</p>
      <section className="absence-range">
        <div><p className="eyebrow">{tx(language,"Multiple days at once","एकाच वेळी अनेक दिवस")}</p><h2>{tx(language,"Select absence dates","अनुपस्थितीच्या तारखा निवडा")}</h2><p className="sub">{tx(language,"Choose employee and absence period.","कर्मचारी आणि अनुपस्थितीचा कालावधी निवडा.")}</p></div>
        <form className="form form-grid absence-form" onSubmit={saveAbsences}>
          <label>कर्मचारी<select required value={employee} onChange={e => setEmployee(e.target.value)}><option value="">कर्मचारी निवडा</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name} · {e.employee_code} · {e.branch_name}</option>)}</select></label>
          <label>पासून<input type="date" required value={rangeStart} onChange={e => setRangeStart(e.target.value)} /></label>
          <label>पर्यंत<input type="date" required min={rangeStart} value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} /></label>
          <button className="primary" disabled={busy || !employee}><CalendarCheck size={16} />{busy ? "जतन करत आहे…" : "अनुपस्थिती जतन करा"}</button>
        </form>
        {message && <p className="success-message">{message}</p>}
      </section>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap"><table><thead><tr><th>{tx(language,"Employee","कर्मचारी")}</th><th>{tx(language,"Date","तारीख")}</th><th>{tx(language,"Status","स्थिती")}</th><th>{tx(language,"Notes","नोंदी")}</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={4}>{tx(language,"No absences recorded for this period.","या कालावधीत अनुपस्थितीची नोंद नाही.")}</td></tr> : rows.map(r => <tr key={r.id}><td>{r.employees?.full_name ?? r.employee_id}<small>{r.employees?.employee_code ?? ""}</small></td><td>{r.work_date}</td><td><span className="status">अनुपस्थित</span></td><td>{r.notes || "—"}</td></tr>)}</tbody></table></div>
    </section>
  </main>;
}
export default function AttendancePage() { return <Protected><AbsencePageContent /></Protected>; }
