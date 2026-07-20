import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "en" | "ar";

interface ErrorLike {
  code?: unknown;
  message?: unknown;
}

interface LanguageContextValue {
  language: Language;
  locale: "en-GB" | "ar-EG";
  direction: "ltr" | "rtl";
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  tr: (english: string, arabic: string) => string;
  localizeError: (error: unknown, fallbackEnglish?: string, fallbackArabic?: string) => string;
}

const STORAGE_KEY = "egas-language";

const arabicErrors: Record<string, string> = {
  API_REQUEST_FAILED: "تعذر إكمال الطلب. حاول مرة أخرى.",
  INVALID_API_RESPONSE: "أعاد الخادم استجابة غير صالحة.",
  INVALID_CREDENTIALS: "رقم الموظف أو كلمة المرور غير صحيحة.",
  INVALID_DEVELOPMENT_USER: "تعذر العثور على حساب الموظف في بيئة التطوير.",
  AUTHENTICATION_REQUIRED: "يرجى تسجيل الدخول للمتابعة.",
  FORBIDDEN: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  REQUEST_NOT_FOUND: "تعذر العثور على طلب السفر.",
  REQUEST_OWNER_NOT_FOUND: "تعذر العثور على صاحب الطلب.",
  INVALID_SCOPE: "نطاق الطلب غير صالح.",
  EMPTY_REQUEST_UPDATE: "أدخل حقلاً واحداً على الأقل لتعديل الطلب.",
  INVALID_TRAVEL_DATES: "يجب أن يكون وقت العودة بعد وقت الذهاب.",
  CONFLICT: "توجد بيانات متعارضة في الطلب. راجعها وحاول مرة أخرى.",
  INVALID_TRANSITION: "لا يمكن نقل الطلب إلى هذه المرحلة حالياً.",
  INVALID_EDIT_FIELDS: "توجد حقول لا يملك هذا القسم صلاحية تعديلها.",
  ADJUSTMENT_NOTE_REQUIRED: "يجب إضافة ملاحظة عند إدخال تعديل مالي.",
  NETWORK_ERROR: "تعذر الاتصال بالخادم. تحقق من الاتصال ثم حاول مرة أخرى.",
  NOT_FOUND: "تعذر العثور على العنصر المطلوب.",
  ROUTE_NOT_FOUND: "مسار واجهة النظام المطلوب غير موجود.",
  UNAUTHENTICATED: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  UNAUTHORIZED: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  VALIDATION_ERROR: "بعض البيانات المدخلة غير صحيحة. راجع الحقول وحاول مرة أخرى.",
};

function initialLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "ar") return saved;

  return window.navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(initialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    updateLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    updateLanguage((currentLanguage) => {
      const nextLanguage = currentLanguage === "en" ? "ar" : "en";
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
      return nextLanguage;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = language === "ar" ? "نظام تعويضات السفر | إيجاس" : "Travel Reimbursement | EGAS";
  }, [language]);

  const tr = useCallback(
    (english: string, arabic: string) => (language === "ar" ? arabic : english),
    [language],
  );

  const localizeError = useCallback(
    (error: unknown, fallbackEnglish = "Something went wrong. Please try again.", fallbackArabic = "حدث خطأ. يرجى المحاولة مرة أخرى.") => {
      const candidate = typeof error === "object" && error !== null ? (error as ErrorLike) : null;
      const code = typeof candidate?.code === "string" ? candidate.code : "";
      const message = error instanceof Error
        ? error.message
        : typeof candidate?.message === "string"
          ? candidate.message
          : "";

      if (language === "en") return message || fallbackEnglish;
      if (code && arabicErrors[code]) return arabicErrors[code];

      const lowered = message.toLowerCase();
      if (lowered.includes("route was not found")) return arabicErrors.ROUTE_NOT_FOUND;
      if (lowered.includes("invalid") && lowered.includes("password")) return arabicErrors.INVALID_CREDENTIALS;
      if (lowered.includes("unable to reach") || lowered.includes("network")) return arabicErrors.NETWORK_ERROR;
      if (lowered.includes("permission") || lowered.includes("authorized") || lowered.includes("cannot perform")) return arabicErrors.UNAUTHORIZED;
      return fallbackArabic;
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: language === "ar" ? "ar-EG" : "en-GB",
      direction: language === "ar" ? "rtl" : "ltr",
      setLanguage,
      toggleLanguage,
      tr,
      localizeError,
    }),
    [language, localizeError, setLanguage, toggleLanguage, tr],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
