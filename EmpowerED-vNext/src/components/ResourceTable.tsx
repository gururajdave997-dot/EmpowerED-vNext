import { useState } from "react";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCSV } from "@/lib/utils";
import { allocStatus, ALLOC } from "@/lib/alloc";
import type { Resource } from "@/lib/types";
import { Download } from "lucide-react";

function statusTone(s: string): "green" | "amber" | "red" | "default" {
  if (s === "Available Now") return "green";
  if (s === "Allocated") return "red";
  return "amber";
}
function allocTone(pct: number): "green" | "amber" | "red" {
  const s = allocStatus(pct);
  return s === ALLOC.UNALLOCATED ? "green" : s === ALLOC.PARTIAL ? "amber" : "red";
}

export default function ResourceTable({ rows, caption, onClear }: { rows: Resource[]; caption?: string; onClear?: () => void }) {
  const [q, setQ] = useState("");
  const filtered = rows.filter((r) =>
    !q || [r.name, r.employeeCode, r.businessUnit, r.department, r.primarySkill, r.secondarySkill]
      .join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const exportRows = filtered.map((r) => ({
    EmployeeCode: r.employeeCode, Name: r.name, BusinessUnit: r.businessUnit, Department: r.department,
    PrimarySkill: r.primarySkill, SecondarySkill: r.secondarySkill, Experience: r.experience,
    CurrentProject: r.currentProject, AllocationPct: r.allocationPct,
    AllocationStatus: allocStatus(r.allocationPct), Availability: r.availabilityStatus,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-sm text-slate-600">{caption} <span className="text-slate-400">({filtered.length})</span></div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search name, BU, skill..." value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
          <Button variant="outline" size="sm" onClick={() => downloadCSV("resources.csv", exportRows)}><Download size={14} /> Export</Button>
          {onClear && <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <Table>
          <THead><TR>
            <TH>Name</TH><TH>Business Unit</TH><TH>Dept</TH>
            <TH>Primary Skill</TH><TH>Secondary</TH><TH>Exp</TH><TH>Project</TH>
            <TH>Alloc %</TH><TH>Allocation Status</TH><TH>Availability</TH>
          </TR></THead>
          <tbody>
            {filtered.map((r) => (
              <TR key={r.employeeCode}>
                <TD className="font-medium text-slate-800">{r.name}<div className="text-xs text-slate-400">{r.employeeCode}</div></TD>
                <TD>{r.businessUnit}</TD><TD>{r.department}</TD>
                <TD>{r.primarySkill}</TD><TD className="text-slate-500">{r.secondarySkill}</TD>
                <TD>{r.experience}y</TD><TD>{r.currentProject}</TD>
                <TD>{r.allocationPct}%</TD>
                <TD><Badge tone={allocTone(r.allocationPct)}>{allocStatus(r.allocationPct)}</Badge></TD>
                <TD><Badge tone={statusTone(r.availabilityStatus)}>{r.availabilityStatus}</Badge></TD>
              </TR>
            ))}
            {!filtered.length && <TR><TD colSpan={10} className="text-center text-slate-400 py-6">No matching resources.</TD></TR>}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
