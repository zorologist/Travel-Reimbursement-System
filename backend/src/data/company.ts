/** Fictional/non-sensitive settings used only by the in-memory development backend. */
export const developmentCompany = {
  id: "company-egas-dev",
  name: "EGAS Development Company",
  shortName: "EGAS DEV",
  currency: "EGP",
  timezone: "Africa/Cairo",
  departments: [
    "Operations",
    "Finance",
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
