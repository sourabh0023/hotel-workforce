"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    let alive = true;
    let unsubscribe = () => {};

    try {
      const client = supabase();
      client.auth.getSession().then(({ data, error }) => {
        if (!alive) return;
        if (error || !data.session) router.replace("/login");
        else setReady(true);
      }).catch((error: unknown) => {
        if (alive) setSetupError(error instanceof Error ? error.message : "Unable to check sign-in status.");
      });

      const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
        if (!session) router.replace("/login");
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Supabase setup is incomplete.");
    }

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [router]);

  if (setupError) {
    return <main className="shell"><section className="content"><p className="eyebrow">DATABASE CONNECTION REQUIRED</p><h1>Connect Supabase to continue</h1><p className="sub">{setupError}</p><p className="muted">After adding the environment variables in Vercel, redeploy the project and refresh this page.</p></section></main>;
  }
  if (!ready) return <main className="shell"><p className="muted">Checking secure session…</p></main>;
  return <>{children}</>;
}