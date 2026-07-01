import { skillList, departmentList } from "@/data/mockData";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface DashFilters { skills: string[]; department: string; availability: string; }
export const emptyFilters: DashFilters = { skills: [], department: "", availability: "" };

export default function SkillFilterBar({ filters, setFilters }: { filters: DashFilters; setFilters: (f: DashFilters) => void }) {
  const addSkill = (s: string) => { if (s && !filters.skills.includes(s)) setFilters({ ...filters, skills: [...filters.skills, s] }); };
  const removeSkill = (s: string) => setFilters({ ...filters, skills: filters.skills.filter((x) => x !== s) });
  const active = filters.skills.length || filters.department || filters.availability;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Skill filters:</span>
        <Select value="" onChange={(e) => addSkill(e.target.value)}>
          <option value="">+ Add skill</option>
          {skillList.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
          <option value="">Any department</option>
          {departmentList.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Select value={filters.availability} onChange={(e) => setFilters({ ...filters, availability: e.target.value })}>
          <option value="">Any availability</option>
          <option value="0">Available now</option>
          <option value="15">Within 15 days</option>
          <option value="30">Within 30 days</option>
          <option value="60">Within 60 days</option>
          <option value="90">Within 90 days</option>
        </Select>
        {active ? <Button variant="ghost" size="sm" onClick={() => setFilters(emptyFilters)}>Reset</Button> : null}
      </div>
      {filters.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {filters.skills.map((s) => (
            <Badge key={s} tone="blue" className="cursor-pointer" onClick={() => removeSkill(s)}>
              {s} <X size={12} className="ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const windowDays = (s: string) =>
  s === "Available Now" ? 0 : s === "Available in 15 Days" ? 15 : s === "Available in 30 Days" ? 30 :
  s === "Available in 60 Days" ? 60 : s === "Available in 90 Days" ? 90 : 999;

export function applyFilters<T extends { primarySkill: string; secondarySkill: string; department: string; availabilityStatus: string }>(rows: T[], f: DashFilters): T[] {
  return rows.filter((r) => {
    if (f.skills.length && !f.skills.includes(r.primarySkill) && !f.skills.includes(r.secondarySkill)) return false;
    if (f.department && r.department !== f.department) return false;
    if (f.availability !== "" && windowDays(r.availabilityStatus) > Number(f.availability)) return false;
    return true;
  });
}
