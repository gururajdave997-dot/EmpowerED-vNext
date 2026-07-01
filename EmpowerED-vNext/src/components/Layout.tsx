import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import {
  LayoutDashboard, Users, Brain, CalendarClock, FolderKanban,
  Sparkles, FileBarChart, Shield, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav: { to: string; label: string; icon: any; roles?: Role[] }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resources", label: "Resource Management", icon: Users },
  { to: "/skills", label: "Skills Registry", icon: Brain },
  { to: "/availability", label: "Availability", icon: CalendarClock },
  { to: "/projects", label: "Project Allocation", icon: FolderKanban },
  { to: "/ai", label: "AI Assistant", icon: Sparkles },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin", label: "Admin", icon: Shield, roles: ["Admin", "Manager"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = nav.filter((n) => !n.roles || n.roles.includes(user!.role));

  return (
    <div className="flex h-screen">
      <aside className="w-60 shrink-0 bg-brand-dark text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-2xl font-bold">EmpowerED</div>
          <div className="text-xs text-white/60">Resource Management</div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive ? "bg-white/15 font-medium" : "text-white/75 hover:bg-white/10"
              )}>
              <n.icon size={18} /> {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5">
          <div className="text-sm text-slate-500">Internal Resource Pool · POC</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">{user!.email}</span>
            <span className="rounded-full bg-brand-light text-brand-dark px-2 py-0.5 text-xs font-medium">{user!.role}</span>
            <button onClick={async () => { await logout(); navigate("/login"); }}
              className="flex items-center gap-1 text-slate-500 hover:text-brand">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
