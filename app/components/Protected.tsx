"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase().auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error || !data.session) router.replace("/login");
      else setReady(true);
    }).catch(() => router.replace("/login"));
    const { data: listener } = supabase().auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [router]);
  if (!ready) return <main className="shell"><p className="muted">Checking secure session…</p></main>;
  return <>{children}</>;
}