/** Fictional/non-sensitive settings used only by the in-memory development backend. */
export const developmentCompany = {
  id: "company-egas-dev",
  name: "EGAS Development Company",
  shortName: "EGAS DEV",
  currency: "EGP",
  timezone: "Africa/Cairo",
  departments: [
    "Operations",
    "Offshore Operations",
    "Planning",
    "Pipeline Engineering",
    "Finance",
    "IT",
    "Human Resources",
    "Public Relations",
    "Transportation",
    "Timing",
    "Salary",
  ],
  reimbursementPolicyNote:
    "Development data only. Travel requests should be submitted before departure.",
} as const;

/** Backward-compatible name for callers that already import `company`. */
export const company = developmentCompany;

/** Compatibility export for callers that need only the department list. */
export const COMPANY_DEPARTMENTS = [...developmentCompany.departments];
