import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResources } from "@/data/dataService";
import { downloadCSV } from "@/lib/utils";
import { allocStatus } from "@/lib/alloc";
import { Download } from "lucide-react";

const reports = [
  { key: "availability", name: "Resource Availability Report" },
  { key: "skills", name: "Skill Inventory Report" },
  { key: "allocation", name: "Resource Allocation Status Report" },
  { key: "department", name: "Department Summary Report" },
  { key: "utilization", name: "Utilization Report" },
];

export default function Reports() {
  const rows = useResources();
  const [sel, setSel] = useState(reports[0].key);

  const build = () => {
    if (sel === "department") {
      const c: Record<string, { count: number; util: number }> = {};
      rows.forEach((r) => { c[r.department] = c[r.department] || { count: 0, util: 0 }; c[r.department].count++; c[r.department].util += Math.min(r.allocationPct, 100); });
      return Object.entries(c).map(([Department, v]) => ({ Department, Headcount: v.count, AvgUtilizationPct: Math.round(v.util / v.count) }));
    }
    if (sel === "allocation") {
      return rows.map((r) => ({
        EmployeeCode: r.employeeCode, Name: r.name, Department: r.department, CurrentProject: r.currentProject,
        AllocationPct: r.allocationPct, AllocationStatus: allocStatus(r.allocationPct),
      }));
    }
    return rows.map((r) => ({
      EmployeeCode: r.employeeCode, Name: r.name, BusinessUnit: r.businessUnit, Department: r.department,
      PrimarySkill: r.primarySkill, SecondarySkill: r.secondarySkill, Certifications: r.certifications.join("; "),
      Experience: r.experience, CurrentProject: r.currentProject, AllocationPct: r.allocationPct,
      AllocationStatus: allocStatus(r.allocationPct), TimesheetHours: r.timesheetHours,
      Availability: r.availabilityStatus, AvailableDate: r.availableDate,
    }));
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export standard reports (CSV in the POC; Excel/PDF post-POC)." />
      <div className="grid md:grid-cols-2 gap-3 max-w-2xl">
        {reports.map((r) => (
          <Card key={r.key} className={"cursor-pointer hover:shadow-md " + (sel === r.key ? "ring-2 ring-brand" : "")} onClick={() => setSel(r.key)}>
            <CardContent className="pt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{r.name}</span>
              {sel === r.key && <span className="text-xs text-brand">selected</span>}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <Button onClick={() => downloadCSV(sel + "-report.csv", build())}><Download size={16} /> Export CSV</Button>
      </div>
    </div>
  );
}
