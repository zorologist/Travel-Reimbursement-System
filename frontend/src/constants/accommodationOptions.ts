import type { AccommodationType } from "@travel-reimbursement/shared";

export interface AccommodationOption {
  value: AccommodationType;
  english: string;
  arabic: string;
}

/** Shared by the employee request form and PR review to keep both selectors identical. */
export const accommodationOptions: readonly AccommodationOption[] = [
  { value: "egas-arranged", english: "Accommodation Arranged by EGAS", arabic: "إقامة بمعرفة الشركة (إيجاس)" },
  { value: "other-company-arranged", english: "Accommodation Arranged by Another Company", arabic: "إقامة بمعرفة شركة أخرى" },
  { value: "employee-arranged", english: "Accommodation Arranged by the Employee", arabic: "إقامة بمعرفة العامل" },
];
