import type { Language } from "../context/LanguageContext";

const arabicLabels: Record<string, string> = {
  employee: "موظف",
  manager: "مدير",
  pr: "العلاقات العامة",
  transportation: "الانتقالات",
  timing: "المواعيد",
  salary: "الرواتب",
  "manager-review": "مراجعة المدير",
  "pr-review": "مراجعة العلاقات العامة",
  "transportation-review": "مراجعة الانتقالات",
  "timing-review": "مراجعة المواعيد والساعات",
  "salary-finalization": "اعتماد الرواتب",
  completed: "مكتمل",
  cancelled: "ملغي",
  "in-progress": "قيد التنفيذ",
  submit: "إرسال",
  approve: "موافقة",
  reject: "رفض",
  edit: "تعديل",
  finalize: "اعتماد نهائي",
  none: "بدون إقامة",
  "room-only": "غرفة فقط",
  "room-and-food": "غرفة ووجبات",
  "company-car": "سيارة الشركة",
  "personal-car": "سيارة خاصة",
  other: "وسيلة أخرى",
  Chairman: "رئيس مجلس الإدارة",
  Deputy: "نائب",
  Advisor: "مستشار",
  Expert: "خبير",
  Assistant: "مساعد",
  "Deputy Assistant": "نائب مساعد",
  "General Manager": "مدير عام",
  "Assistant General Manager": "مساعد مدير عام",
  "Level 1": "المستوى الأول",
  "Level 2": "المستوى الثاني",
  "Level 3": "المستوى الثالث",
  Cairo: "القاهرة",
  Alexandria: "الإسكندرية",
  Giza: "الجيزة",
  Suez: "السويس",
  Ismailia: "الإسماعيلية",
  "Port Said": "بورسعيد",
  Damietta: "دمياط",
  Dakahlia: "الدقهلية",
  Sharqia: "الشرقية",
  Qalyubia: "القليوبية",
  "Kafr El Sheikh": "كفر الشيخ",
  Gharbia: "الغربية",
  Monufia: "المنوفية",
  Beheira: "البحيرة",
  Fayoum: "الفيوم",
  "Beni Suef": "بني سويف",
  Minya: "المنيا",
  Assiut: "أسيوط",
  Sohag: "سوهاج",
  Qena: "قنا",
  Luxor: "الأقصر",
  Aswan: "أسوان",
  "Company car": "سيارة الشركة",
  "Personal car": "سيارة خاصة",
  "Other transport": "وسيلة انتقال أخرى",
  "Company bus": "حافلة الشركة",
  Train: "قطار",
  Flight: "طائرة",
};

const englishLabels: Record<string, string> = {
  pr: "PR",
  "manager-review": "Manager review",
  "pr-review": "PR review",
  "transportation-review": "Transportation review",
  "timing-review": "Timing and hours review",
  "salary-finalization": "Salary finalization",
  "in-progress": "In progress",
  "company-car": "Company car",
  "personal-car": "Personal car",
  none: "No accommodation",
  "room-only": "Room only",
  "room-and-food": "Room and meals",
};

export function localizeLabel(value: string | null | undefined, language: Language): string {
  if (!value) return language === "ar" ? "غير محدد" : "Not specified";
  if (language === "ar") return arabicLabels[value] ?? value;
  return englishLabels[value] ?? value.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function formatDate(value: string, language: Language, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", options ?? { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value: string, language: Language): string {
  return formatDate(value, language, { dateStyle: "medium", timeStyle: "short" });
}

export function formatCurrency(value: number, language: Language): string {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value);
}
