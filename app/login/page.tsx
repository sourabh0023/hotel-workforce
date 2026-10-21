"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ShieldCheck, Eye, EyeOff, ArrowRight, LockKeyhole, Users, CalendarCheck, Wallet } from "lucide-react";
import { supabase } from "../lib/supabase";
import { LanguageToggle, useLanguage, tx } from "../components/LanguageProvider";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to sign in. Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <header className="auth-topbar"><LanguageToggle />
        <Link href="/" className="brand" aria-label="HotelFlow home">
          <span className="brand-mark"><Building2 size={25} strokeWidth={2.1} /></span>
          <span className="brand-wordmark">Hotel<span className="accent">Flow</span><small>WORKFORCE MANAGER</small></span>
        </Link>
        <span className="secure-chip"><LockKeyhole size={14} /> Secure workspace</span>
      </header>

      <div className="auth-layout">
        <section className="auth-promo">
          <span className="eyebrow"><span className="eyebrow-dot" /> BUILT FOR HOTEL TEAMS</span>
          <h1>Great hospitality<br />starts with <span>great teams.</span></h1>
          <p className="auth-promo-copy">Manage employees, attendance and payroll.</p>
          <div className="auth-feature-list">
            <div><span className="auth-feature-icon"><Users size={18}/></span><span><b>Employee management</b><small>Manage your team</small></span></div>
            <div><span className="auth-feature-icon"><CalendarCheck size={18}/></span><span><b>Daily attendance</b><small>Daily records</small></span></div>
            <div><span className="auth-feature-icon"><Wallet size={18}/></span><span><b>Salary & advances</b><small>Track payments</small></span></div>
          </div>
          <p className="auth-promo-foot">MORYAEMP</p>
        </section>

        <section className="auth-panel" aria-labelledby="signin-title">
          <div className="auth-panel-heading">
            <div className="auth-panel-icon"><ShieldCheck size={22}/></div>
            <p className="eyebrow">WELCOME BACK</p>
            <h2 id="signin-title">Sign in to HotelFlow</h2>
            <p>Enter your email and password.</p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="username" placeholder="you@yourhotel.com" required value={email} onChange={e => setEmail(e.target.value)} />
            <div className="auth-password-row"><label htmlFor="password">Password</label></div>
            <div className="password-field">
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={e => setPassword(e.target.value)} />
              <button className="password-toggle" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
            {message && <p className="auth-error" role="alert">{message}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? tx(language,"Signing you in…","साइन इन होत आहे…") : tx(language,"Sign in","साइन इन")} {!busy && <ArrowRight size={18}/>}</button>
          </form>
          <div className="auth-panel-footer"><LockKeyhole size={14}/><span>{tx(language,"Your account is protected with secure authentication.","तुमचे खाते सुरक्षित प्रमाणीकरणाने संरक्षित आहे.")}</span></div>
        </section>
      </div>
      <footer className="auth-footer"><span>© {new Date().getFullYear()} HotelFlow Workforce Manager</span><span>People first. Every shift.</span></footer>
    </main>
  );
}