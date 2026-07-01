import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ResourceTable from "@/components/ResourceTable";
import { Card, CardContent } from "@/components/ui/card";
import { useResources } from "@/data/dataService";
import type { Resource } from "@/lib/types";

const buckets: { label: string; test: (r: Resource) => boolean }[] = [
  { label: "Available Now", test: (r) => r.availabilityStatus === "Available Now" },
  { label: "Within 15 Days", test: (r) => ["Available Now", "Available in 15 Days"].includes(r.availabilityStatus) },
  { label: "Within 30 Days", test: (r) => ["Available Now", "Available in 15 Days", "Available in 30 Days"].includes(r.availabilityStatus) },
  { label: "Within 60 Days", test: (r) => r.availabilityStatus !== "Allocated" && r.availabilityStatus !== "Available in 90 Days" },
  { label: "Within 90 Days", test: (r) => r.availabilityStatus !== "Allocated" },
];

export default function Availability() {
  const rows = useResources();
  const [i, setI] = useState(0);
  const counts = useMemo(() => buckets.map((b) => rows.filter(b.test).length), [rows]);
  const list = rows.filter(buckets[i].test);
  return (
    <div>
      <PageHeader title="Availability Dashboard" subtitle="Candidate availability from the Time Sheet, bucketed by window." />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {buckets.map((b, idx) => (
          <Card key={b.label} className={"cursor-pointer hover:shadow-md " + (i === idx ? "ring-2 ring-brand" : "")} onClick={() => setI(idx)}>
            <CardContent className="pt-4">
              <div className="text-xs text-slate-500">{b.label}</div>
              <div className="text-2xl font-bold text-brand-dark">{counts[idx]}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <ResourceTable rows={list} caption={"Available — " + buckets[i].label} />
    </div>
  );
}
