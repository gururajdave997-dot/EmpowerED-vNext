export type Role = "Admin" | "Manager" | "Viewer";

export type AvailabilityStatus =
  | "Available Now"
  | "Available in 15 Days"
  | "Available in 30 Days"
  | "Available in 60 Days"
  | "Available in 90 Days"
  | "Allocated";

// Merged resource row (Skill Management Report + Time Sheet, joined on employeeCode)
export interface Resource {
  employeeCode: string;
  name: string;
  department: string;
  businessUnit: string;
  experience: number;        // years
  // from Skill Management Report
  primarySkill: string;
  secondarySkill: string;
  certifications: string[];
  proficiency: number;       // 1..5
  email?: string;
  managerName?: string;
  skillStatus?: string;      // Approved | Pending | Rejected
  // from Time Sheet
  currentProject: string;
  allocationPct: number;     // 0..100+
  timesheetHours: number;
  availableDate: string;     // ISO date
  availabilityStatus: AvailabilityStatus;
}

export interface FinderQuery {
  skills: string[];
  minExperience?: number;
  department?: string;
  certification?: string;
  availabilityWindowDays?: number;
}

export interface FinderResult extends Resource {
  score: number;
  reason: string;
}
