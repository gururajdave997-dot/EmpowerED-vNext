import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import PageHeader from "@/components/PageHeader";
import ResourceTable from "@/components/ResourceTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useResources } from "@/data/dataService";
import type { Resource } from "@/lib/types";

export default function Projects() {
  const rows = useResources();
  const [proj, setProj] = useState<string | null>(null);
  const byProject = useMemo(() => group(rows.filter((r) => r.currentProject !== "Bench"), (r) => r.currentProject), [rows]);
  const overbooked = rows.filter((r) => r.allocationPct > 100);
  const list = proj ? rows.filter((r) => r.currentProject === proj) : null;

  return (
    <div>
      <PageHeader title="Project Allocation" subtitle="Staffing view derived from Current Project. Click a bar for the project roster." />
      {overbooked.length > 0 && (
        <Card className="mb-4 border-red-200"><CardContent className="pt-4 flex items-center gap-2">
          <Badge tone="red">Overbooking</Badge>
          <span className="text-sm text-slate-600">{overbooked.length} resources allocated over 100%: {overbooked.slice(0, 4).map((r) => r.name).join(", ")}{overbooked.length > 4 ? "…" : ""}</span>
        </CardContent></Card>
      )}
      <Card className="mb-4"><CardContent className="pt-4">
        <div className="text-sm font-semibold text-slate-700 mb-1">Resource Count by Project</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byProject}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
            <Bar dataKey="value" fill="#0F6CBD" cursor="pointer" onClick={(d: any) => setProj(d.name)} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent></Card>
      {list && <ResourceTable rows={list} caption={"Project roster — " + proj} onClear={() => setProj(null)} />}
    </div>
  );
}
function group(rows: Resource[], key: (r: Resource) => string) {
  const c: Record<string, number> = {};
  rows.forEach((r) => (c[key(r)] = (c[key(r)] || 0) + 1));
  return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
