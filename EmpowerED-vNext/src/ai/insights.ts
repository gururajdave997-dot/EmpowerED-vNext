import type { Resource } from "@/lib/types";

export function computeInsights(rs: Resource[]) {
  const total = rs.length;
  const bench = rs.filter((r) => r.allocationPct === 0);
  const overbooked = rs.filter((r) => r.allocationPct > 100);
  const availableSoon = rs.filter((r) => ["Available Now", "Available in 15 Days", "Available in 30 Days"].includes(r.availabilityStatus));
  const avgUtil = total ? Math.round(rs.reduce((s, r) => s + Math.min(r.allocationPct, 100), 0) / total) : 0;

  // demand vs supply by skill (supply = available soon per skill)
  const skillSupply: Record<string, number> = {};
  availableSoon.forEach((r) => { skillSupply[r.primarySkill] = (skillSupply[r.primarySkill] || 0) + 1; });

  const insights: { title: string; detail: string; tone: "green" | "amber" | "red" | "blue" }[] = [];
  insights.push({ title: "Utilization", detail: `Average utilization is ${avgUtil}% across ${total} resources.`, tone: avgUtil > 85 ? "red" : avgUtil > 70 ? "amber" : "green" });
  insights.push({ title: "Bench", detail: `${bench.length} resources on bench (${Math.round((bench.length / total) * 100)}%). Top bench skills: ${topSkills(bench).join(", ") || "n/a"}.`, tone: bench.length > total * 0.2 ? "amber" : "green" });
  insights.push({ title: "Overbooking risk", detail: overbooked.length ? `${overbooked.length} resources allocated over 100% — rebalance recommended.` : "No resources allocated over 100%.", tone: overbooked.length ? "red" : "green" });
  insights.push({ title: "Near-term supply", detail: `${availableSoon.length} resources available within 30 days. Strongest supply: ${topSkills(availableSoon).join(", ") || "n/a"}.`, tone: "blue" });
  const scarce = Object.entries(skillSupply).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([s]) => s);
  insights.push({ title: "Skill gaps", detail: scarce.length ? `Lowest near-term supply in: ${scarce.join(", ")}. Consider hiring or upskilling.` : "Supply balanced across skills.", tone: "amber" });
  return { avgUtil, bench: bench.length, overbooked: overbooked.length, availableSoon: availableSoon.length, insights };
}

function topSkills(rs: Resource[], n = 3) {
  const c: Record<string, number> = {};
  rs.forEach((r) => (c[r.primarySkill] = (c[r.primarySkill] || 0) + 1));
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n).map(([s]) => s);
}
