import React, { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "./types";
import { supabase, supabaseEnabled } from "./supabase";

interface Profile { email: string; role: Role; }
interface AuthCtx {
  user: Profile | null;
  loading: boolean;
  mode: "supabase" | "demo";
  sendOtp: (email: string) => Promise<{ ok: boolean; error?: string; demoCode?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>(null as any);

const ACCESS_DENIED = "Access Denied. Please contact the administrator.";

// ALLOWED_USERS from env (VITE_ prefix required by Vite). Falls back to demo list.
const DEFAULT_ALLOWED = ["admin@company.com", "manager@company.com"];
const DEFAULT_ROLES: Record<string, Role> = { "admin@company.com": "Admin", "manager@company.com": "Manager" };

function allowedUsers(): string[] {
  const raw = import.meta.env.VITE_ALLOWED_USERS || import.meta.env.VITE_ALLOWED_EMAILS || "";
  const list = raw.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
  return list.length ? list : DEFAULT_ALLOWED;
}
function roleFor(email: string): Role {
  const raw = (import.meta.env.VITE_USER_ROLES || "").trim();
  if (raw) {
    const map: Record<string, Role> = {};
    raw.split(",").forEach((p: string) => { const [e, r] = p.split(":").map((x) => x.trim()); if (e && r) map[e.toLowerCase()] = r as Role; });
    if (map[email]) return map[email];
  }
  if (DEFAULT_ROLES[email]) return DEFAULT_ROLES[email];
  return email.startsWith("admin") ? "Admin" : "Manager";
}
const isAllowed = (email: string) => allowedUsers().includes(email.trim().toLowerCase());

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoCode, setDemoCode] = useState<Record<string, string>>({});

  useEffect(() => {
    let unsub: any;
    (async () => {
      if (supabaseEnabled && supabase) {
        const { data } = await supabase.auth.getSession();
        const email = data.session?.user?.email;
        if (email && isAllowed(email)) setUser({ email: email.toLowerCase(), role: roleFor(email.toLowerCase()) });
        const sub = supabase.auth.onAuthStateChange((_e, session) => {
          const em = session?.user?.email;
          if (em && isAllowed(em)) setUser({ email: em.toLowerCase(), role: roleFor(em.toLowerCase()) });
          else setUser(null);
        });
        unsub = sub.data.subscription;
      } else {
        const raw = sessionStorage.getItem("empowered_user");
        if (raw) setUser(JSON.parse(raw));
      }
      setLoading(false);
    })();
    return () => unsub?.unsubscribe?.();
  }, []);

  const sendOtp: AuthCtx["sendOtp"] = async (email) => {
    const e = email.trim().toLowerCase();
    if (!e) return { ok: false, error: "Enter your email." };
    // Gate BEFORE sending an OTP — non-approved emails never receive a code.
    if (!isAllowed(e)) return { ok: false, error: ACCESS_DENIED };
    if (supabaseEnabled && supabase) {
      const { error } = await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true } });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
    // demo mode: generate a code and surface it in the UI
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setDemoCode((m) => ({ ...m, [e]: code }));
    return { ok: true, demoCode: code };
  };

  const verifyOtp: AuthCtx["verifyOtp"] = async (email, code) => {
    const e = email.trim().toLowerCase();
    if (!isAllowed(e)) return { ok: false, error: ACCESS_DENIED };
    if (supabaseEnabled && supabase) {
      const { data, error } = await supabase.auth.verifyOtp({ email: e, token: code.trim(), type: "email" });
      if (error) return { ok: false, error: error.message };
      const em = data.user?.email?.toLowerCase() || e;
      const profile = { email: em, role: roleFor(em) };
      setUser(profile);
      // best-effort profile persistence + audit (tables optional; ignored if absent)
      try {
        await supabase.from("users").upsert({ email: em, role: profile.role, last_login: new Date().toISOString() }, { onConflict: "email" });
        await supabase.from("audit_logs").insert({ actor_email: em, action: "login", detail: "email_otp" });
      } catch { /* ignore in POC */ }
      return { ok: true };
    }
    if (code.trim() !== demoCode[e]) return { ok: false, error: "Invalid code. Check the demo code shown above." };
    const profile = { email: e, role: roleFor(e) };
    setUser(profile);
    sessionStorage.setItem("empowered_user", JSON.stringify(profile));
    return { ok: true };
  };

  const logout: AuthCtx["logout"] = async () => {
    if (supabaseEnabled && supabase) await supabase.auth.signOut();
    sessionStorage.removeItem("empowered_user");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, mode: supabaseEnabled ? "supabase" : "demo", sendOtp, verifyOtp, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
export { ACCESS_DENIED };
