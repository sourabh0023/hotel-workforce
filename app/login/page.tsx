"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch (err) { setMessage(err instanceof Error ? err.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }
  return <main className="shell"><nav className="topbar"><Link href="/" className="brand"><span className="brand-mark"><Building2/></span><span>Hotel<span className="accent">Flow</span><small>WORKFORCE MANAGER</small></span></Link></nav><section className="content login-card"><p className="eyebrow">SECURE WORKSPACE</p><h1>Sign in</h1><p className="sub">Use the account created for your hotel workforce workspace.</p><form className="form" onSubmit={submit}><label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label><button className="primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <ShieldCheck size={16}/></button>{message && <p className="error">{message}</p>}</form><p className="muted">Create the first account in Supabase Authentication, then assign its profile role using the setup instructions in README.</p></section></main>;
}