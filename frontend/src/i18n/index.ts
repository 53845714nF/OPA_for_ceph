import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./locales/de";
import en from "./locales/en";

const savedLanguage = typeof window !== "undefined" ? localStorage.getItem("i18nextLng") || "de" : "de";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: "de",
    interpolation: {
      escapeValue: false,
    },
  });

// Automatically persist language selection to localStorage
i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("i18nextLng", lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
