import { useSyncExternalStore } from "react";
import * as XLSX from "xlsx";
import type { Resource, AvailabilityStatus } from "@/lib/types";
import { generateResources } from "./mockData";

type Source = "skill" | "timesheet";
interface SourceMeta { name: string; uploadedAt: string; rows: number; loaded: number; rejected: number; errors: string[]; }

let resources: Resource[] = generateResources();
let meta: Record<Source, SourceMeta | null> = { skill: null, timesheet: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

export function useResources(): Resource[] {
  return useSyncExternalStore(subscribe, () => resources, () => resources);
}
export function useSourceMeta() {
  return useSyncExternalStore(subscribe, () => meta, () => meta);
}
export function getResources() { return resources; }

// header normalization + alias map (supports Skills_Template.xlsx & Timesheet_Template.xlsx)
const alias: Record<string, string> = {
  employeecode: "employeeCode", empcode: "employeeCode", code: "employeeCode",
  employeename: "name", name: "name",
  department: "department", dept: "department",
  businessunit: "businessUnit", bu: "businessUnit",
  experience: "experience", exp: "experience",
  // skills
  emailid: "email", email: "email",
  skillupdatestatus: "skillStatus", status: "skillStatus",
  managername: "managerName", manageremailid: "managerEmail",
  skillname: "skillName", level: "level",
  primaryskill: "primarySkill", secondaryskill: "secondarySkill",
  certifications: "certifications", proficiency: "proficiency",
  // timesheet / project mapping
  projectcode: "projectCode", projecttitle: "projectTitle",
  milestonecode: "milestoneCode", milestonetitle: "milestoneTitle",
  milestoneproductcode: "productCode", displayproducttitle: "productTitle",
  mappeddate: "mappedDate",
  currentproject: "currentProject", project: "currentProject",
  allocationpct: "allocationPct", allocation: "allocationPct",
  timesheethours: "timesheetHours", hours: "timesheetHours",
  availabledate: "availableDate", availabilitydate: "availableDate",
  availabilitystatus: "availabilityStatus",
};
const norm = (h: string) => alias[h.toLowerCase().replace(/[\s_%]/g, "")] || h;

const cleanDept = (d: string) => String(d || "").replace(/^dept:\s*/i, "").trim();

// "3-Advance" -> 3 ; "Expert" -> 4
function parseLevel(v: any): number {
  const s = String(v || "");
  const m = s.match(/(\d)/);
  if (m) return Math.max(1, Math.min(5, Number(m[1])));
  if (/expert/i.test(s)) return 4; if (/advance/i.test(s)) return 3;
  if (/intermediate/i.test(s)) return 2; if (/beginner/i.test(s)) return 1;
  return 3;
}
// "5-8" -> 6.5 ; "More than 15" -> 16 ; "10-15" -> 12.5
function parseExperience(v: any): number {
  const s = String(v || "").toLowerCase();
  if (/more than/.test(s)) { const n = s.match(/(\d+)/); return n ? Number(n[1]) + 1 : 15; }
  const m = s.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return Math.round(((Number(m[1]) + Number(m[2])) / 2) * 10) / 10;
  const single = s.match(/(\d+(\.\d+)?)/);
  return single ? Number(single[1]) : 0;
}
function statusFromDate(iso: string): AvailabilityStatus {
  const days = Math.round((new Date(iso).getTime() - new Date("2026-07-01").getTime()) / 86400000);
  if (isNaN(days)) return "Allocated";
  if (days <= 0) return "Available Now";
  if (days <= 15) return "Available in 15 Days";
  if (days <= 30) return "Available in 30 Days";
  if (days <= 60) return "Available in 60 Days";
  if (days <= 90) return "Available in 90 Days";
  return "Allocated";
}

export async function importWorkbook(source: Source, file: File): Promise<SourceMeta> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
  let loaded = 0, rejected = 0;
  const errors: string[] = [];
  const byCode = new Map(resources.map((r) => [r.employeeCode, { ...r }]));

  raw.forEach((row, idx) => {
    const o: Record<string, any> = {};
    Object.keys(row).forEach((k) => (o[norm(k)] = row[k]));
    const code = String(o.employeeCode || "").trim();
    // ---- validation: EmployeeCode mandatory
    if (!code) { rejected++; errors.push(`Row ${idx + 2}: missing EmployeeCode`); return; }

    const existing = byCode.get(code) || ({
      employeeCode: code, name: code, department: "Unknown", businessUnit: "Unknown",
      experience: 0, primarySkill: "", secondarySkill: "", certifications: [], proficiency: 3,
      currentProject: "Bench", allocationPct: 0, timesheetHours: 0,
      availableDate: "2026-07-01", availabilityStatus: "Available Now",
    } as Resource);

    if (source === "skill") {
      const skill = o.primarySkill || o.skillName || existing.primarySkill;
      // if a primary already exists and a new distinct skill comes in, keep it as secondary
      let primary = existing.primarySkill, secondary = existing.secondarySkill;
      if (skill) {
        if (!primary) primary = skill;
        else if (skill !== primary && !secondary) secondary = skill;
      }
      Object.assign(existing, {
        name: o.name || existing.name || code,
        department: cleanDept(o.department) || existing.department,
        email: o.email || existing.email,
        managerName: o.managerName || existing.managerName,
        skillStatus: o.skillStatus || existing.skillStatus,
        primarySkill: primary,
        secondarySkill: secondary,
        proficiency: o.level ? parseLevel(o.level) : (Number(o.proficiency) || existing.proficiency || 3),
        experience: (o.experience !== "" && o.experience != null) ? parseExperience(o.experience) : existing.experience,
        certifications: o.certifications ? String(o.certifications).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean) : existing.certifications || [],
      });
    } else {
      // Timesheet_Template.xlsx = project mapping. Presence => assigned to a project.
      const proj = o.projectTitle || o.currentProject || o.projectCode || existing.currentProject;
      const hasProject = !!(o.projectCode || o.projectTitle) && String(proj).toLowerCase() !== "bench";
      const mapped = o.mappedDate ? String(o.mappedDate).slice(0, 10) : existing.availableDate;
      if (o.projectCode == null && o.projectTitle == null && o.allocationPct === "") {
        // nothing useful on this row for timesheet
      }
      const allocation = o.allocationPct !== "" && o.allocationPct != null ? Number(o.allocationPct) : (hasProject ? 100 : existing.allocationPct);
      Object.assign(existing, {
        name: o.name || existing.name || code,
        department: cleanDept(o.department) || existing.department,
        currentProject: proj || (allocation === 0 ? "Bench" : existing.currentProject),
        allocationPct: allocation,
        timesheetHours: o.timesheetHours !== "" && o.timesheetHours != null ? Number(o.timesheetHours) : Math.round((allocation / 100) * 40),
        availableDate: o.availableDate ? String(o.availableDate).slice(0, 10) : mapped,
        availabilityStatus: (o.availabilityStatus as AvailabilityStatus) || (allocation >= 100 ? "Allocated" : statusFromDate(o.availableDate ? String(o.availableDate).slice(0, 10) : mapped)),
      });
    }
    byCode.set(code, existing as Resource);
    loaded++;
  });

  resources = Array.from(byCode.values());
  const m: SourceMeta = { name: file.name, uploadedAt: new Date().toLocaleString(), rows: raw.length, loaded, rejected, errors: errors.slice(0, 20) };
  meta = { ...meta, [source]: m };
  emit();
  return m;
}

export function resetToMock() { resources = generateResources(); meta = { skill: null, timesheet: null }; emit(); }
