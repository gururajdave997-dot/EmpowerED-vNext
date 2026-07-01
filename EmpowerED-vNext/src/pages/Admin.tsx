import { useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { importWorkbook, useSourceMeta, resetToMock } from "@/data/dataService";
import { UploadCloud, RotateCcw } from "lucide-react";

function UploadSlot({ source, title, hint }: { source: "skill" | "timesheet"; title: string; hint: string }) {
  const meta = useSourceMeta()[source];
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true); setErr("");
    try { await importWorkbook(source, f); } catch (e: any) { setErr(e.message || "Parse failed"); }
    setBusy(false);
  };

  return (
    <Card><CardContent className="pt-4">
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <div className="text-xs text-slate-400 mb-3">{hint}</div>
      <div onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand hover:bg-brand-light/30">
        <UploadCloud className="mx-auto mb-1 text-brand" />
        <div className="text-sm text-slate-600">{busy ? "Parsing…" : "Click to upload .xlsx / .csv"}</div>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
      {meta && (
        <div className="mt-3 text-xs text-slate-500">
          <Badge tone="green">Loaded</Badge> {meta.name} · {meta.uploadedAt}<br />
          Rows read {meta.rows} · loaded {meta.loaded} · rejected {meta.rejected}
          {meta.rejected > 0 && (
            <ul className="mt-1 list-disc pl-4 text-red-600">
              {meta.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </CardContent></Card>
  );
}

export default function Admin() {
  return (
    <div>
      <PageHeader title="Admin — Data Uploads" subtitle="Upload the two workbooks; dashboards refresh instantly. Falls back to sample data until uploaded." />
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <UploadSlot source="skill" title="Skill Management Report (Skills_Template.xlsx)" hint="EmployeeCode, EmployeeName, Department, EmailId, SkillUpdateStatus, ManagerName, ManagerEmailId, SkillName, Level, Experience" />
        <UploadSlot source="timesheet" title="Time Sheet (Timesheet_Template.xlsx)" hint="ProjectCode, ProjectTitle, MilestoneCode, MilestoneTitle, MilestoneProductCode, DisplayProductTitle, EmployeeName, EmployeeCode, Department, MappedDate" />
      </div>
      <Button variant="outline" size="sm" onClick={resetToMock}><RotateCcw size={14} /> Reset to sample data</Button>
    </div>
  );
}
