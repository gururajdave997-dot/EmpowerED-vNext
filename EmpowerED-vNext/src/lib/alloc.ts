// Single source of truth for Resource Allocation Status labels.
export const ALLOC = {
  UNALLOCATED: "Unallocated",
  PARTIAL: "Partially Assigned",
  FULL: "Fully Assigned",
} as const;

export type AllocStatus = (typeof ALLOC)[keyof typeof ALLOC];

export function allocStatus(pct: number): AllocStatus {
  if (pct <= 0) return ALLOC.UNALLOCATED;
  if (pct < 100) return ALLOC.PARTIAL;
  return ALLOC.FULL;
}

// order used for charts/legends
export const ALLOC_ORDER: AllocStatus[] = [ALLOC.UNALLOCATED, ALLOC.PARTIAL, ALLOC.FULL];
