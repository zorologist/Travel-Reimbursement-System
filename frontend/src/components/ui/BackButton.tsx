import { useLocation, useNavigate } from "react-router-dom";

import { useLanguage } from "../../hooks/useLanguage";
import "../../styles/backButton.css";

interface BackButtonProps {
  fallback?: string;
  className?: string;
}

export function BackButton({ fallback = "/home", className = "" }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { direction, tr } = useLanguage();

  function goBack() {
    if (location.key !== "default" && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallback, { replace: true });
  }

  const isRtl = direction === "rtl";

  return (
    <button
      type="button"
      className={`back-btn${isRtl ? " back-btn--rtl" : ""}${className ? ` ${className}` : ""}`}
      onClick={goBack}
      aria-label={tr("Go back", "الرجوع")}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={isRtl ? "M5 12h14M13 6l6 6-6 6" : "M19 12H5m6-6-6 6 6 6"} />
      </svg>
      <span>{tr("Go back", "الرجوع")}</span>
    </button>
  );
}
