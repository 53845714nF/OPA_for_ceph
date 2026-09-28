import { useTranslation } from "react-i18next";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "buttons";
}

export function LanguageSwitcher({ className = "", variant = "pill" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.startsWith("en") ? "en" : "de";

  const setLanguage = (lang: "de" | "en") => {
    i18n.changeLanguage(lang);
  };

  if (variant === "buttons") {
    return (
      <div className={`flex items-center gap-1.5 p-1 bg-surface-container-lowest border border-outline-variant rounded-xl ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage("de")}
          className={`px-3 py-1.5 rounded-lg text-xs font-hankenGrotesk font-semibold uppercase tracking-wider transition-all duration-200 ${
            currentLang === "de"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
          title={t("common.german")}
        >
          🇩🇪 DE
        </button>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`px-3 py-1.5 rounded-lg text-xs font-hankenGrotesk font-semibold uppercase tracking-wider transition-all duration-200 ${
            currentLang === "en"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
          title={t("common.english")}
        >
          🇬🇧 EN
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded-full px-1.5 py-1 text-xs font-data-mono ${className}`}
      title={t("common.switchLanguage")}
    >
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant ml-1">language</span>
      <button
        type="button"
        onClick={() => setLanguage("de")}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          currentLang === "de"
            ? "bg-primary text-on-primary font-bold shadow-xs"
            : "text-on-surface-variant hover:text-primary"
        }`}
      >
        DE
      </button>
      <span className="text-outline-variant text-[10px]">|</span>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          currentLang === "en"
            ? "bg-primary text-on-primary font-bold shadow-xs"
            : "text-on-surface-variant hover:text-primary"
        }`}
      >
        EN
      </button>
    </div>
  );
}
