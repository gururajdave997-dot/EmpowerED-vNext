import type { FinderQuery } from "@/lib/types";
import { skillList, departmentList } from "@/data/mockData";

const synonyms: Record<string, string> = {
  ".net": ".NET", dotnet: ".NET", "power bi": "Power BI", powerbi: "Power BI",
  ml: "Machine Learning", "machine learning": "Machine Learning", k8s: "Kubernetes",
  node: "Node.js", nodejs: "Node.js", react: "React", azure: "Azure", aws: "AWS",
  sap: "SAP", python: "Python", java: "Java", angular: "Angular", terraform: "Terraform",
  snowflake: "Snowflake", salesforce: "Salesforce",
};

export function parseQuery(q: string): FinderQuery {
  const text = " " + q.toLowerCase() + " ";
  const skills = new Set<string>();
  Object.entries(synonyms).forEach(([k, v]) => { if (text.includes(k)) skills.add(v); });
  skillList.forEach((s) => { if (text.includes(s.toLowerCase())) skills.add(s); });

  const expMatch = text.match(/(\d+)\s*\+?\s*(?:years|yrs|year)/);
  const minExperience = expMatch ? Number(expMatch[1]) : undefined;

  let availabilityWindowDays: number | undefined;
  if (/immediately|available now|right now|on bench|bench/.test(text)) availabilityWindowDays = 0;
  const winMatch = text.match(/(\d+)\s*days/);
  if (winMatch) availabilityWindowDays = Number(winMatch[1]);

  let department: string | undefined;
  departmentList.forEach((d) => { if (text.includes(d.toLowerCase())) department = d; });

  const certMatch = text.match(/certif|certified|certification/);
  const certification = certMatch ? Array.from(skills)[0] : undefined;

  return { skills: Array.from(skills), minExperience, department, certification, availabilityWindowDays };
}
