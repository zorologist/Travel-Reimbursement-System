export interface TransportationOption {
  formValue: string;
  value: string;
  english: string;
  arabic: string;
}

/** Shared by the employee request and Transportation review selectors. */
export const transportationOptions: readonly TransportationOption[] = [
  { formValue: "personal-car", value: "Employee's Private Car", english: "Employee's Private Car", arabic: "بمعرفة العامل" },
  { formValue: "company-car", value: "Company Car", english: "Company Car", arabic: "سيارة الشركة" },
  { formValue: "other", value: "Other Transportation Method", english: "Other Transportation Method", arabic: "وسيلة أخرى" },
];
