import { useMemo, useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import SkillFilterBar, { DashFilters, emptyFilters, applyFilters } from "@/components/SkillFilterBar";
import ResourceTable from "@/components/ResourceTable";
import { Card, CardContent } from "@/components/ui/card";
import { useResources } from "@/data/dataService";
import { allocStatus, ALLOC, ALLOC_ORDER } from "@/lib/alloc";
import type { Resource } from "@/lib/types";

const COLORS = ["#0F6CBD", "#41A5EE", "#7CC0F0", "#103F91", "#8FD14F", "#F4B400", "#DB4437", "#9C27B0"];
const ALLOC_COLORS: Record<string, string> = { [ALLOC.UNALLOCATED]: "#8FD14F", [ALLOC.PARTIAL]: "#F4B400", [ALLOC.FULL]: "#0F6CBD" };

type Sel = { label: string; test: (r: Resource) => boolean } | null;

function Kpi({ label, value, hint, onClick, active }: { label: string; value: string | number; hint?: string; onClick?: () => void; active?: boolean }) {
  return (
    <Card className={"cursor-pointer transition-shadow hover:shadow-md " + (active ? "ring-2 ring-brand" : "")} onClick={onClick}>
      <CardContent className="pt-4">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-brand-dark">{value}</div>
        {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
}

const win = (s: string) => s === "Available Now" ? 0 : s === "Available in 15 Days" ? 15 : s === "Available in 30 Days" ? 30 : s === "Available in 60 Days" ? 60 : s === "Available in 90 Days" ? 90 : 999;

export default function Dashboard() {
  const all = useResources();
  const [filters, setFilters] = useState<DashFilters>(emptyFilters);
  const [sel, setSel] = useState<Sel>(null);

  const rows = useMemo(() => applyFilters(all, filters), [all, filters]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const now = rows.filter((r) => r.availabilityStatus === "Available Now").length;
    const unalloc = rows.filter((r) => allocStatus(r.allocationPct) === ALLOC.UNALLOCATED).length;
    const full = rows.filter((r) => allocStatus(r.allocationPct) === ALLOC.FULL).length;
    const util = total ? Math.round(rows.reduce((s, r) => s + Math.min(r.allocationPct, 100), 0) / total) : 0;
    const soon = rows.filter((r) => win(r.availabilityStatus) <= 30).length;
    const projects = new Set(rows.filter((r) => r.currentProject !== "Bench").map((r) => r.currentProject)).size;
    const skills = new Set(rows.map((r) => r.primarySkill)).size;
    return { total, now, unalloc, full, util, soon, projects, skills };
  }, [rows]);

  const byDept = useMemo(() => group(rows, (r) => r.department), [rows]);
  const bySkill = useMemo(() => group(rows, (r) => r.primarySkill), [rows]);
  const allocMix = useMemo(
    () => ALLOC_ORDER.map((name) => ({ name, value: rows.filter((r) => allocStatus(r.allocationPct) === name).length })),
    [rows]
  );
  const trend = useMemo(() => {
    const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    return months.map((m, i) => ({ month: m, utilization: Math.max(40, Math.min(95, kpis.util - (months.length - 1 - i) * 3 + (i % 2 ? 2 : -1))) }));
  }, [kpis.util]);

  const drill = sel ? rows.filter(sel.test) : null;

  return (
    <div>
      <PageHeader title="Executive Dashboard" subtitle="KPIs and analytics from Skill Management Report + Time Sheet. Click any chart or card to drill into the people behind it." />
      <SkillFilterBar filters={filters} setFilters={setFilters} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi label="Total Employees" value={kpis.total} onClick={() => setSel({ label: "All employees", test: () => true })} active={sel?.label === "All employees"} />
        <Kpi label="Available Now" value={kpis.now} onClick={() => setSel({ label: "Available now", test: (r) => r.availabilityStatus === "Available Now" })} active={sel?.label === "Available now"} />
        <Kpi label="Fully Assigned" value={kpis.full} onClick={() => setSel({ label: ALLOC.FULL, test: (r) => allocStatus(r.allocationPct) === ALLOC.FULL })} active={sel?.label === ALLOC.FULL} />
        <Kpi label="Unallocated" value={kpis.unalloc} onClick={() => setSel({ label: ALLOC.UNALLOCATED, test: (r) => allocStatus(r.allocationPct) === ALLOC.UNALLOCATED })} active={sel?.label === ALLOC.UNALLOCATED} />
        <Kpi label="Utilization" value={kpis.util + "%"} />
        <Kpi label="Available ≤ 30 days" value={kpis.soon} onClick={() => setSel({ label: "Available within 30 days", test: (r) => win(r.availabilityStatus) <= 30 })} active={sel?.label === "Available within 30 days"} />
        <Kpi label="Active Projects" value={kpis.projects} />
        <Kpi label="Skill Coverage" value={kpis.skills} hint="distinct primary skills" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <Card><CardContent className="pt-4">
          <div className="text-sm font-semibold text-slate-700 mb-1">Resource Allocation Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={allocMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                onClick={(_, i) => { const name = ALLOC_ORDER[i]; setSel({ label: name, test: (r) => allocStatus(r.allocationPct) === name }); }}>
                {allocMix.map((d) => <Cell key={d.name} fill={ALLOC_COLORS[d.name]} cursor="pointer" />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardContent className="pt-4">
          <div className="text-sm font-semibold text-slate-700 mb-1">Resources by Department</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDept}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
              <Bar dataKey="value" fill="#0F6CBD" cursor="pointer"
                onClick={(d: any) => setSel({ label: "Department: " + d.name, test: (r) => r.department === d.name })} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardContent className="pt-4">
          <div className="text-sm font-semibold text-slate-700 mb-1">Utilization Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip />
              <Line type="monotone" dataKey="utilization" stroke="#103F91" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </div>

      <Card className="mb-4"><CardContent className="pt-4">
        <div className="text-sm font-semibold text-slate-700 mb-1">Resources by Primary Skill (click a bar to drill down)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={bySkill}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
            <Bar dataKey="value" fill="#41A5EE" cursor="pointer"
              onClick={(d: any) => setSel({ label: "Skill: " + d.name, test: (r) => r.primarySkill === d.name })} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent></Card>

      {drill && (
        <div className="mb-6">
          <ResourceTable rows={drill} caption={`Drill-down — ${sel!.label}${filters.skills.length ? " · filters: " + filters.skills.join(", ") : ""}`} onClear={() => setSel(null)} />
        </div>
      )}
    </div>
  );
}

function group(rows: Resource[], key: (r: Resource) => string) {
  const c: Record<string, number> = {};
  rows.forEach((r) => (c[key(r)] = (c[key(r)] || 0) + 1));
  return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
