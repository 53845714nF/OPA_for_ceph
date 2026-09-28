import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  variant?: "pill" | "buttons";
}

export function ThemeToggle({ className = "", variant = "pill" }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { t } = useTranslation();

  if (variant === "buttons") {
    return (
      <div className={`flex items-center gap-1.5 p-1 bg-surface-container-lowest border border-outline-variant rounded-xl ${className}`}>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-hankenGrotesk font-semibold uppercase tracking-wider transition-all duration-200 ${
            theme === "light"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
          title={t("common.lightTheme")}
        >
          <span className="material-symbols-outlined text-[16px]">light_mode</span>
          <span>{t("common.lightTheme")}</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-hankenGrotesk font-semibold uppercase tracking-wider transition-all duration-200 ${
            theme === "dark"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
          title={t("common.darkTheme")}
        >
          <span className="material-symbols-outlined text-[16px]">dark_mode</span>
          <span>{t("common.darkTheme")}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors flex items-center justify-center ${className}`}
      title={theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")}
      aria-label={theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")}
    >
      <span className="material-symbols-outlined text-[20px]">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
