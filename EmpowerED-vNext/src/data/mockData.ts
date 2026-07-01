import type { Resource, AvailabilityStatus } from "@/lib/types";

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260701);
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const pickN = <T,>(arr: T[], n: number) => {
  const c = [...arr]; const out: T[] = [];
  for (let i = 0; i < n && c.length; i++) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]);
  return out;
};

const departments = ["Data Engineering", "Cloud", "Application Dev", "Learning Services", "QA & Testing", "Infrastructure", "ERP / SAP"];
const businessUnits = ["Digital Engineering", "Enterprise Solutions", "Managed Services", "Consulting"];
const skills = ["Azure", "AWS", "Power BI", "SAP", "React", "Node.js", "Python", "Java", ".NET", "Kubernetes", "Terraform", "Snowflake", "Salesforce", "Angular", "Machine Learning"];
const certsBySkill: Record<string, string[]> = {
  Azure: ["AZ-104", "AZ-305", "Azure Solutions Architect Expert"],
  AWS: ["AWS Solutions Architect", "AWS Developer Associate"],
  "Power BI": ["PL-300", "DA-100"],
  SAP: ["SAP S/4HANA", "SAP FICO"],
  "Machine Learning": ["Azure AI Engineer", "TensorFlow Developer"],
  Kubernetes: ["CKA", "CKAD"],
};
const firstNames = ["Aarav", "Diya", "Kabir", "Meera", "Rohan", "Ananya", "Vikram", "Priya", "Arjun", "Neha", "Karan", "Sara", "Dev", "Isha", "Nikhil", "Tara", "Rahul", "Zoya", "Amit", "Kavya", "James", "Emma", "Liam", "Olivia", "Noah", "Ava"];
const lastNames = ["Sharma", "Iyer", "Khan", "Reddy", "Nair", "Gupta", "Menon", "Rao", "Patel", "Bose", "Smith", "Johnson", "Williams", "Brown", "Davis"];
const projects = ["Bench", "ATLAS-CRM", "HELIX-Cloud", "NOVA-Analytics", "ORION-ERP", "PULSE-LMS", "VERTEX-QA", "ZENITH-Migration"];
const statuses = ["Approved", "Pending", "Rejected"];

function statusFromDays(days: number): AvailabilityStatus {
  if (days <= 0) return "Available Now";
  if (days <= 15) return "Available in 15 Days";
  if (days <= 30) return "Available in 30 Days";
  if (days <= 60) return "Available in 60 Days";
  if (days <= 90) return "Available in 90 Days";
  return "Allocated";
}

export function generateResources(count = 54): Resource[] {
  const out: Resource[] = [];
  for (let i = 0; i < count; i++) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const primarySkill = pick(skills);
    let secondarySkill = pick(skills);
    if (secondarySkill === primarySkill) secondarySkill = pick(skills);
    const experience = Math.round((2 + rnd() * 16) * 10) / 10;
    const allocationPct = pick([0, 0, 25, 50, 75, 100, 100, 100, 110]);
    let days: number;
    if (allocationPct === 0) days = 0;
    else if (allocationPct <= 50) days = pick([10, 15, 25, 30]);
    else if (allocationPct < 100) days = pick([30, 45, 60]);
    else days = pick([60, 90, 120]);
    const availDate = new Date(2026, 6, 1 + days);
    const certs = certsBySkill[primarySkill] ? pickN(certsBySkill[primarySkill], Math.round(rnd() * 2)) : [];
    out.push({
      employeeCode: `${2001001 + i}`,
      name,
      department: pick(departments),
      businessUnit: pick(businessUnits),
      experience,
      primarySkill,
      secondarySkill,
      certifications: certs,
      proficiency: 1 + Math.floor(rnd() * 5),
      email: name.toLowerCase().replace(/[^a-z]/g, ".") + "@company.com",
      managerName: pick(firstNames) + " " + pick(lastNames),
      skillStatus: pick(statuses),
      currentProject: allocationPct === 0 ? "Bench" : pick(projects.filter((p) => p !== "Bench")),
      allocationPct,
      timesheetHours: Math.round((allocationPct / 100) * 40 * (0.8 + rnd() * 0.4)),
      availableDate: availDate.toISOString().slice(0, 10),
      availabilityStatus: statusFromDays(days),
    });
  }
  return out;
}

export const skillList = skills;
export const departmentList = departments;
