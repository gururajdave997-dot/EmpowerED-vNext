import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import SkillFilterBar, { DashFilters, emptyFilters, applyFilters } from "@/components/SkillFilterBar";
import ResourceTable from "@/components/ResourceTable";
import { useResources } from "@/data/dataService";

export default function Resources() {
  const all = useResources();
  const [filters, setFilters] = useState<DashFilters>(emptyFilters);
  const rows = useMemo(() => applyFilters(all, filters), [all, filters]);
  return (
    <div>
      <PageHeader title="Resource Management" subtitle="Advanced multi-filter search across the resource pool." />
      <SkillFilterBar filters={filters} setFilters={setFilters} />
      <ResourceTable rows={rows} caption="Resources" />
    </div>
  );
}
