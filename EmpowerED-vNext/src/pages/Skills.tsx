import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useResources } from "@/data/dataService";
import { skillList, departmentList } from "@/data/mockData";

export default function Skills() {
  const rows = useResources();
  const dist = useMemo(() => skillList.map((s) => ({
    name: s,
    count: rows.filter((r) => r.primarySkill === s || r.secondarySkill === s).length,
    avgProf: avg(rows.filter((r) => r.primarySkill === s).map((r) => r.proficiency)),
  })).filter((d) => d.count).sort((a, b) => b.count - a.count), [rows]);

  const matrix = useMemo(() => departmentList.map((d) => {
    const drs = rows.filter((r) => r.department === d);
    const row: Record<string, number> = {};
    skillList.forEach((s) => (row[s] = drs.filter((r) => r.primarySkill === s || r.secondarySkill === s).length));
    return { dept: d, row };
  }), [rows]);

  const topSkills = dist.slice(0, 8).map((d) => d.name);

  return (
    <div>
      <PageHeader title="Skills Registry" subtitle="Skill distribution, proficiency and department-wise heatmap." />
      <Card className="mb-4"><CardContent className="pt-4">
        <div className="text-sm font-semibold text-slate-700 mb-1">Skill Distribution</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dist}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
            <Bar dataKey="count" fill="#0F6CBD" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent></Card>

      <Card className="mb-4"><CardContent className="pt-4">
        <div className="text-sm font-semibold text-slate-700 mb-2">Skill Proficiency Matrix (by department, top skills)</div>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <THead><TR><TH>Department</TH>{topSkills.map((s) => <TH key={s}>{s}</TH>)}</TR></THead>
            <tbody>
              {matrix.map((m) => (
                <TR key={m.dept}>
                  <TD className="font-medium">{m.dept}</TD>
                  {topSkills.map((s) => {
                    const v = m.row[s];
                    return <TD key={s}><span className={"inline-block w-8 text-center rounded " + heat(v)}>{v || ""}</span></TD>;
                  })}
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
        <div className="text-xs text-slate-400 mt-2">Cell = count of people with that skill in that department. Darker = more coverage.</div>
      </CardContent></Card>

      <Card><CardContent className="pt-4">
        <div className="text-sm font-semibold text-slate-700 mb-2">Skill Summary & Gap Signal</div>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <THead><TR><TH>Skill</TH><TH>People</TH><TH>Avg proficiency</TH><TH>Gap signal</TH></TR></THead>
            <tbody>
              {dist.map((d) => (
                <TR key={d.name}>
                  <TD className="font-medium">{d.name}</TD><TD>{d.count}</TD><TD>{d.avgProf}</TD>
                  <TD>{d.count <= 2 ? <Badge tone="red">Scarce</Badge> : d.count <= 4 ? <Badge tone="amber">Thin</Badge> : <Badge tone="green">Healthy</Badge>}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </CardContent></Card>
    </div>
  );
}
const avg = (a: number[]) => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 10) / 10 : 0);
function heat(v: number) {
  if (!v) return "bg-slate-50 text-slate-300";
  if (v >= 6) return "bg-brand-dark text-white";
  if (v >= 4) return "bg-brand text-white";
  if (v >= 2) return "bg-brand-light text-brand-dark";
  return "bg-blue-50 text-brand-dark";
}
