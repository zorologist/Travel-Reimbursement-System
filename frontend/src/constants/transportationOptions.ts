export interface TransportationOption {
  formValue: string;
  value: string;
  english: string;
  arabic: string;
}

/** Shared by the employee request and Transportation review selectors. */
export const transportationOptions: readonly TransportationOption[] = [
  { formValue: "company-car", value: "Company car", english: "Company car", arabic: "سيارة الشركة" },
  { formValue: "personal-car", value: "Personal car", english: "Personal car", arabic: "سيارة خاصة (شخصية)" },
  { formValue: "other", value: "Other transport", english: "Other non-company transportation", arabic: "وسيلة أخرى غير تابعة للشركة" },
];
