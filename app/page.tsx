"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarCheck, Wallet, Users, Building2, ShieldCheck, LogOut } from "lucide-react";
import Protected from "./components/Protected";
import { supabase } from "./lib/supabase";
const cards = [{title:"Employees",desc:"Maintain real employee profiles, branch and pay type.",href:"/employees",icon:Users},{title:"Attendance",desc:"Record daily presence, absence and leave.",href:"/attendance",icon:CalendarCheck},{title:"Salary & advances",desc:"Record wages, advances and payments with balances.",href:"/ledger",icon:Wallet}];
function Dashboard() {
  const router=useRouter(); const [email,setEmail]=useState("");
  useEffect(()=>{supabase().auth.getUser().then(({data})=>setEmail(data.user?.email ?? ""));},[]);
  async function signOut(){await supabase().auth.signOut();router.replace("/login");}
  return <main className="shell"><nav className="topbar"><Link href="/" className="brand"><span className="brand-mark"><Building2/></span><span>Hotel<span className="accent">Flow</span><small>WORKFORCE MANAGER</small></span></Link><div className="nav-actions"><span className="pill"><ShieldCheck size={15}/> Secure workspace</span><button className="secondary" onClick={signOut}><LogOut size={15}/> Sign out</button></div></nav><section className="hero"><p className="eyebrow">WORKFORCE OPERATIONS</p><h1>Your people.<br/><span>Every shift, every rupee.</span></h1><p className="intro">Manage employee profiles, attendance, wages, advances and outstanding balances across your hotel branches. Data is stored in your connected database.</p><p className="muted">Signed in as {email || "authenticated user"}</p></section><section id="overview"><div className="section-title"><div><p className="eyebrow">WORKSPACE</p><h2>Manage operations</h2></div><span className="pill">Live database</span></div><div className="cards">{cards.map(({title,desc,href,icon:Icon})=><Link className="card" href={href} key={title}><span className="icon"><Icon/></span><h3>{title}</h3><p>{desc}</p><span className="card-link">Open section <ArrowRight size={15}/></span></Link>)}</div><p className="footnote">Keep salary and employee information confidential. Access is enforced by Supabase database policies; configure your first admin account before use.</p></section></main>;
}
export default function HomePage(){return <Protected><Dashboard/></Protected>}