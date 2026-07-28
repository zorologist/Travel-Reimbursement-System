import type { AccommodationType } from "@travel-reimbursement/shared";

export interface AccommodationOption {
  value: AccommodationType;
  english: string;
  arabic: string;
}

/** Shared by the employee request form and PR review to keep both selectors identical. */
export const accommodationOptions: readonly AccommodationOption[] = [
  { value: "room-and-food", english: "Full board", arabic: "إقامة كاملة" },
  { value: "half-board", english: "Half board", arabic: "نصف إقامة" },
  { value: "room-only", english: "Accommodation without meals", arabic: "إقامة بدون وجبات" },
  { value: "bed-and-breakfast", english: "Company bed and breakfast", arabic: "إقامة ومبيت وإفطار على نفقة الشركة" },
  { value: "none", english: "Accommodation paid by employee", arabic: "إقامة على نفقة الموظف" },
];
