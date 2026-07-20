import { useLanguage } from "../../hooks/useLanguage";

export function LanguageToggle() {
  const { language, setLanguage, tr } = useLanguage();

  return (
    <div className="language-toggle" role="group" aria-label={tr("Language", "اللغة")}>
      <button
        type="button"
        className={language === "en" ? "is-active" : ""}
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={language === "ar" ? "is-active" : ""}
        aria-pressed={language === "ar"}
        onClick={() => setLanguage("ar")}
      >
        عربي
      </button>
    </div>
  );
}
