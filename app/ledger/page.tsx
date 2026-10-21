"use client";
import Link from "next/link";
import {FormEvent,useEffect,useMemo,useState} from "react";
import {ArrowLeft,Wallet,Plus,RefreshCw} from "lucide-react";
import Protected from "../components/Protected";
import {supabase} from "../lib/supabase";
type Employee={id:string;full_name:string;employee_code:string;pay_type:string;monthly_salary:number|null;active:boolean;created_at:string;joining_date:string};
type Entry={id:string;employee_id:string;entry_date:string;entry_type:string;amount:number;description:string|null;employees?:{full_name:string;employee_code:string}|null};
type Absence={employee_id:string;work_date:string;status:string};
type SalaryHistory={employee_id:string;monthly_salary:number;effective_from:string};
function Ledger(){
 const today=new Date().toLocaleDateString("en-CA");
 const [employees,setEmployees]=useState<Employee[]>([]);
 const [rows,setRows]=useState<Entry[]>([]);const [absences,setAbsences]=useState<Absence[]>([]);const [salaryHistory,setSalaryHistory]=useState<SalaryHistory[]>([]);const [settlementEmployee,setSettlementEmployee]=useState("");const [lastDay,setLastDay]=useState(today);const [settlementBusy,setSettlementBusy]=useState(false);const [settlementPreview,setSettlementPreview]=useState<number|null>(null);
 const [employee,setEmployee]=useState("");
 const [date,setDate]=useState(today);
 const [type,setType]=useState("advance");
 const [amount,setAmount]=useState("");
 const [description,setDescription]=useState("");
 const [selectedAdvance,setSelectedAdvance]=useState("");
 const [adjustmentAmount,setAdjustmentAmount]=useState("");
 const [adjustmentNote,setAdjustmentNote]=useState("");
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function load(){
  const [e,l,a,h]=await Promise.all([
   supabase().from("employees").select("id,full_name,employee_code,pay_type,monthly_salary,active,created_at,joining_date").order("full_name"),
   supabase().from("ledger_entries").select("id,employee_id,entry_date,entry_type,amount,description,employees(full_name,employee_code)").order("entry_date",{ascending:false}).limit(1000),
   supabase().from("attendance").select("employee_id,work_date,status").eq("status","absent").lte("work_date",today).order("work_date"),
   supabase().from("employee_salary_history").select("employee_id,monthly_salary,effective_from").order("effective_from")
  ]);
  if(e.error||l.error||a.error||h.error)setError(e.error?.message||l.error?.message||a.error?.message||h.error?.message||"Could not load ledger");
  setEmployees((e.data??[]) as Employee[]);
  setRows((l.data??[]) as unknown as Entry[]);setAbsences((a.data??[]) as Absence[]);setSalaryHistory((h.data??[]) as SalaryHistory[]);
 }
 useEffect(()=>{load()},[]);
 const advances=useMemo(()=>rows.filter(r=>r.entry_type==="advance").map(a=>{
  const adjusted=rows.filter(r=>r.entry_type==="advance_adjustment"&&r.description?.includes("advance_id="+a.id)).reduce((s,r)=>s+Number(r.amount),0);
  return {...a,adjusted,remaining:Math.max(0,Number(a.amount)-adjusted)};
 }),[rows]);
 const chosenAdvance=advances.find(a=>a.id===selectedAdvance);
 async function add(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");setMessage("");
  const {data:user}=await supabase().auth.getUser();
  const {error}=await supabase().from("ledger_entries").insert({employee_id:employee,entry_date:date,entry_type:type,amount:Number(amount),description:description.trim()||null,created_by:user.user?.id});
  if(error)setError(error.message);else{setAmount("");setDescription("");setMessage("Transaction saved.");await load()}
  setBusy(false);
 }
 function salaryForDate(employeeId:string,date:string,fallback:number){const history=salaryHistory.filter(h=>h.employee_id===employeeId&&h.effective_from<=date).sort((a,b)=>a.effective_from.localeCompare(b.effective_from));return history.length?Number(history[history.length-1].monthly_salary):fallback}function calculateSettlement(emp:Employee,through:string){const start=(emp.joining_date||emp.created_at||through).slice(0,10);if(start>through)return 0;let accrued=0;const cursor=new Date(start+"T12:00:00");const end=new Date(through+"T12:00:00");while(cursor<=end){const date=cursor.toISOString().slice(0,10);const salary=salaryForDate(emp.id,date,Number(emp.monthly_salary||0));const y=cursor.getFullYear(),m=cursor.getMonth(),daysInMonth=new Date(y,m+1,0).getDate();accrued+=salary/daysInMonth;cursor.setDate(cursor.getDate()+1)}const absenceDeduction=absences.filter(a=>a.employee_id===emp.id&&a.work_date>=start&&a.work_date<=through).reduce((sum,a)=>{const d=new Date(a.work_date+"T12:00:00");const salary=salaryForDate(emp.id,a.work_date,Number(emp.monthly_salary||0));return sum+salary/new Date(d.getFullYear(),d.getMonth()+1,0).getDate()},0);const transactions=rows.filter(r=>r.employee_id===emp.id&&r.entry_date>=start&&r.entry_date<=through&&r.entry_type!=="advance_adjustment");const txBalance=transactions.reduce((sum,r)=>sum+((r.entry_type==="earning"||r.entry_type==="adjustment")?Number(r.amount):-Number(r.amount)),0);return Math.max(0,accrued-absenceDeduction+txBalance)}async function finalizeEmployee(e:FormEvent){e.preventDefault();const emp=employees.find(x=>x.id===settlementEmployee);if(!emp){setError("Choose an employee.");return}if(lastDay>today){setError("Last working date cannot be in the future.");return}if(!window.confirm("Calculate final settlement through "+lastDay+", record the remaining amount as paid, and mark "+emp.full_name+" inactive?"))return;setSettlementBusy(true);setError("");setMessage("");const amount=calculateSettlement(emp,lastDay);const {data:user}=await supabase().auth.getUser();if(amount>0){const {error}=await supabase().from("ledger_entries").insert({employee_id:emp.id,entry_date:lastDay,entry_type:"payment",amount,description:"Final settlement through "+lastDay+" (includes accrued salary, recorded absences and transactions)",created_by:user.user?.id});if(error){setError(error.message);setSettlementBusy(false);return}}const {error:deactivateError}=await supabase().from("employees").update({active:false}).eq("id",emp.id);if(deactivateError){setError("Settlement payment was recorded, but employee could not be marked inactive: "+deactivateError.message);setSettlementBusy(false);await load();return}setMessage("Final settlement recorded: ₹"+amount.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})+". Employee marked inactive.");setSettlementEmployee("");setSettlementPreview(null);await load();setSettlementBusy(false)}
 async function adjustAdvance(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");setMessage("");
  const advance=advances.find(a=>a.id===selectedAdvance);
  const value=Number(adjustmentAmount);
  if(!advance){setError("Choose an advance record.");setBusy(false);return}
  if(!Number.isFinite(value)||value<=0||value>advance.remaining){setError("Adjustment must be greater than ₹0 and no more than the unadjusted advance balance.");setBusy(false);return}
  const {data:user}=await supabase().auth.getUser();
  const note=adjustmentNote.trim();
  const {error}=await supabase().from("ledger_entries").insert({
   employee_id:advance.employee_id,entry_date:date,entry_type:"advance_adjustment",amount:value,
   description:"advance_id="+advance.id+" | Advance adjustment"+(note?" | "+note:""),
   created_by:user.user?.id
  });
  if(error)setError(error.message);else{setAdjustmentAmount("");setAdjustmentNote("");setSelectedAdvance("");setMessage("Advance adjustment recorded and linked to the original advance.");await load()}
  setBusy(false);
 }
 const totals=rows.reduce((acc,r)=>{if(r.entry_type==="advance_adjustment")return acc;acc[r.employee_id]=(acc[r.employee_id]||0)+(r.entry_type==="earning"||r.entry_type==="adjustment"?Number(r.amount):-Number(r.amount));return acc},{} as Record<string,number>);
 const money=(n:number)=>"₹"+n.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
 const label=(t:string)=>({"earning":"Salary / earning","advance":"Advance paid","payment":"Salary payment","deduction":"Other deduction","adjustment":"Balance adjustment","advance_adjustment":"Advance adjusted"}[t]||t);
 return <main className="shell"><nav className="topbar"><Link href="/" className="brand"><span className="brand-mark"><Wallet/></span><span>Morya<span className="accent">EMP</span><small>WORKFORCE MANAGER</small></span></Link><Link href="/" className="back"><ArrowLeft size={16}/> Dashboard</Link></nav><section className="content">
  <p className="eyebrow">PAYROLL & PAYMENTS</p><h1>Salary & advances</h1><p className="sub">Manage salary payments and advances.</p>
  <form className="form form-grid" onSubmit={add}>
   <label>Employee<select required value={employee} onChange={e=>setEmployee(e.target.value)}><option value="">Choose employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.full_name} · {e.employee_code}</option>)}</select></label>
   <label>Transaction date<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
   <label className="transaction-select-label">व्यवहाराचा प्रकार (Transaction type)<select value={type} onChange={e=>setType(e.target.value)}><option value="advance">आगाऊ पैसे दिले (Advance)</option><option value="payment">पगार दिला (Salary paid)</option><option value="earning">पगार बाकी आहे (Salary due)</option><option value="deduction">इतर कपात (Other deduction)</option><option value="adjustment">बाकी रक्कम वाढवा (Balance correction)</option></select><small>पैसे दिले असतील तर “आगाऊ पैसे दिले” किंवा “पगार दिला” निवडा.</small></label>
   <label>Amount (₹)<input type="number" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label>
   <label>Description (optional)<input value={description} onChange={e=>setDescription(e.target.value)}/></label>
   <button className="primary" disabled={busy||!employee}><Plus size={16}/>{busy?"Saving…":"Post transaction"}</button>
  </form>
  <section className="absence-range"><p className="eyebrow">EMPLOYEE EXIT</p><h2>Final settlement</h2><p className="sub">Close an employee's payment through their last working date, including unpaid previous months, recorded absences, advances and payments. Then mark the employee inactive.</p><form className="form form-grid" onSubmit={finalizeEmployee}><label>Employee<select required value={settlementEmployee} onChange={e=>{setSettlementEmployee(e.target.value);setSettlementPreview(null)}}><option value="">Choose employee</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.full_name} · {e.employee_code}</option>)}</select></label><label>Last working date<input type="date" required max={today} value={lastDay} onChange={e=>{setLastDay(e.target.value);setSettlementPreview(null)}}/></label><button type="button" className="secondary" disabled={!settlementEmployee} onClick={()=>{const emp=employees.find(x=>x.id===settlementEmployee);if(emp)setSettlementPreview(calculateSettlement(emp,lastDay))}}>Calculate final amount</button>{settlementPreview!==null&&<div className="card"><p>Estimated final amount to pay</p><strong className="balance">{money(settlementPreview)}</strong><small>Based on joining date, salary history, recorded absences, and transactions up to the selected date.</small></div>}<button className="primary" disabled={settlementBusy||!settlementEmployee}>{settlementBusy?"Closing payment…":"Pay final balance & deactivate"}</button></form></section>
  <section className="absence-range"><p className="eyebrow">ADVANCE RECONCILIATION</p><h2>Adjust an advance against salary</h2><p className="sub">Select an advance and enter the amount to adjust.</p>
   <form className="form form-grid" onSubmit={adjustAdvance}>
    <label>Original advance<select required value={selectedAdvance} onChange={e=>{setSelectedAdvance(e.target.value);setAdjustmentAmount("")}}><option value="">Choose advance record</option>{advances.filter(a=>a.remaining>0).map(a=><option key={a.id} value={a.id}>{a.employees?.full_name||"Employee"} · {a.entry_date} · Given {money(Number(a.amount))} · Remaining {money(a.remaining)}</option>)}</select></label>
    <label>Adjustment date<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
    <label>Amount to adjust (₹)<input type="number" min="0.01" max={chosenAdvance?.remaining} step="0.01" required value={adjustmentAmount} onChange={e=>setAdjustmentAmount(e.target.value)} /></label>
    <label>Note (optional)<input value={adjustmentNote} onChange={e=>setAdjustmentNote(e.target.value)} placeholder="e.g. adjusted in October salary"/></label>
    {chosenAdvance&&<div className="card"><p><b>{chosenAdvance.employees?.full_name}</b> · {chosenAdvance.entry_date}</p><p>Advance given: <b>{money(Number(chosenAdvance.amount))}</b></p><p>Already adjusted: <b>{money(chosenAdvance.adjusted)}</b></p><p>Available to adjust: <b>{money(chosenAdvance.remaining)}</b></p></div>}
    <button className="primary" disabled={busy||!chosenAdvance||Number(adjustmentAmount)<=0||Number(adjustmentAmount)>Number(chosenAdvance?.remaining||0)}><RefreshCw size={16}/>{busy?"Saving…":"Record advance adjustment"}</button>
   </form>
  </section>
  {error&&<p className="error">{error}</p>}{message&&<p className="success-message">{message}</p>}
  <h2>Outstanding balance</h2><div className="cards balance-cards">{employees.map(e=><article className="card" key={e.id}><h3>{e.full_name}</h3><p>{e.employee_code}</p><strong className="balance">{money(totals[e.id]||0)}</strong><small></small></article>)}</div>
  <h2>Advance details</h2><p className="sub">All advances and their adjustment history.</p><div className="table-wrap"><table><thead><tr><th>Employee</th><th>Date given</th><th>Advance amount</th><th>Adjusted</th><th>Remaining advance</th><th>Adjustment history</th><th>Reference</th></tr></thead><tbody>{advances.length===0?<tr><td colSpan={7}>No advance records yet.</td></tr>:advances.map(a=><tr key={a.id}><td>{a.employees?.full_name||a.employee_id}<small>{a.employees?.employee_code||""}</small></td><td>{a.entry_date}</td><td>{money(Number(a.amount))}</td><td>{money(a.adjusted)}</td><td><strong>{money(a.remaining)}</strong></td><td>{rows.filter(r=>r.entry_type==="advance_adjustment"&&r.description?.includes("advance_id="+a.id)).map(r=><div key={r.id}>{r.entry_date}: {money(Number(r.amount))}<small>{r.description?.split(" | ").slice(1).join(" · ")}</small></div>).length?rows.filter(r=>r.entry_type==="advance_adjustment"&&r.description?.includes("advance_id="+a.id)).map(r=><div key={r.id}>{r.entry_date}: {money(Number(r.amount))}<small>{r.description?.split(" | ").slice(1).join(" · ")}</small></div>):"Not adjusted yet"}</td><td><small>{a.id.slice(0,8)}</small></td></tr>)}</tbody></table></div>
  <h2>All recent transactions</h2><div className="table-wrap"><table><thead><tr><th>Employee</th><th>Date</th><th>Type</th><th>Amount</th><th>Description / reference</th></tr></thead><tbody>{rows.length===0?<tr><td colSpan={5}>No transactions yet.</td></tr>:rows.map(r=><tr key={r.id}><td>{r.employees?.full_name??r.employee_id}</td><td>{r.entry_date}</td><td>{label(r.entry_type)}</td><td>{money(Number(r.amount))}</td><td>{r.description||"—"}</td></tr>)}</tbody></table></div>
  <p className="footnote"></p>
 </section></main>
}
export default function LedgerPage(){return <Protected><Ledger/></Protected>}
