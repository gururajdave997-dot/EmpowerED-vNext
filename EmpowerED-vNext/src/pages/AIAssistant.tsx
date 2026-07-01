import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { useResources } from "@/data/dataService";
import { parseQuery } from "@/ai/queryParser";
import { runFinder } from "@/ai/scoring";
import { computeInsights } from "@/ai/insights";
import type { FinderResult } from "@/lib/types";
import { Sparkles } from "lucide-react";

const examples = [
  "Find Azure Architect with 10 years experience available in 30 days",
  "Find SAP consultants in Learning Services department",
  "Find Power BI resources available immediately",
  "Show resources with AWS certification",
];

export default function AIAssistant() {
  const rows = useResources();
  const [tab, setTab] = useState<"finder" | "insights">("finder");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FinderResult[] | null>(null);
  const [parsed, setParsed] = useState<any>(null);

  const search = (text: string) => {
    setQ(text);
    const query = parseQuery(text);
    setParsed(query);
    setResults(runFinder(rows, query).slice(0, 20));
  };

  const ins = computeInsights(rows);

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Natural-language resource finder and insights over your two workbooks." />
      <div className="flex gap-2 mb-4">
        <Button variant={tab === "finder" ? "default" : "outline"} size="sm" onClick={() => setTab("finder")}>Resource Finder</Button>
        <Button variant={tab === "insights" ? "default" : "outline"} size="sm" onClick={() => setTab("insights")}>AI Insights</Button>
      </div>

      {tab === "finder" && (
        <>
          <Card className="mb-3"><CardContent className="pt-4">
            <div className="flex gap-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Find Azure architect with 10 years available in 30 days"
                onKeyDown={(e) => e.key === "Enter" && search(q)} />
              <Button onClick={() => search(q)}><Sparkles size={16} /> Find</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {examples.map((ex) => <button key={ex} onClick={() => search(ex)} className="text-xs bg-slate-100 hover:bg-brand-light text-slate-600 rounded-full px-3 py-1">{ex}</button>)}
            </div>
            {parsed && (
              <div className="text-xs text-slate-500 mt-3">
                Interpreted: {parsed.skills.length ? "skills=" + parsed.skills.join("/") : "any skill"}
                {parsed.minExperience ? ` · ≥${parsed.minExperience}y` : ""}
                {parsed.department ? ` · ${parsed.department}` : ""}
                {parsed.availabilityWindowDays != null ? ` · ≤${parsed.availabilityWindowDays}d` : ""}
                {parsed.certification ? " · certified" : ""}
              </div>
            )}
          </CardContent></Card>

          {results && (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <Table>
                <THead><TR><TH>Score</TH><TH>Name</TH><TH>Dept / BU</TH><TH>Skills</TH><TH>Exp</TH><TH>Availability</TH><TH>Why</TH></TR></THead>
                <tbody>
                  {results.map((r) => (
                    <TR key={r.employeeCode}>
                      <TD><Badge tone={r.score >= 80 ? "green" : r.score >= 60 ? "amber" : "default"}>{r.score}</Badge></TD>
                      <TD className="font-medium">{r.name}<div className="text-xs text-slate-400">{r.employeeCode}</div></TD>
                      <TD>{r.department}<div className="text-xs text-slate-400">{r.businessUnit}</div></TD>
                      <TD>{r.primarySkill}<span className="text-slate-400">, {r.secondarySkill}</span></TD>
                      <TD>{r.experience}y</TD>
                      <TD>{r.availabilityStatus}</TD>
                      <TD className="text-xs text-slate-500">{r.reason}</TD>
                    </TR>
                  ))}
                  {!results.length && <TR><TD colSpan={7} className="text-center text-slate-400 py-6">No matches — try another query.</TD></TR>}
                </tbody>
              </Table>
            </div>
          )}
        </>
      )}

      {tab === "insights" && (
        <div className="grid md:grid-cols-2 gap-3">
          {ins.insights.map((it) => (
            <Card key={it.title}><CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1"><Badge tone={it.tone}>{it.title}</Badge></div>
              <div className="text-sm text-slate-600">{it.detail}</div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
