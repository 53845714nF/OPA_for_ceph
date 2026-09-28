import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';

export function Register() {
  const { t } = useTranslation();
  const authentikUrl = 'http://localhost:9000';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-4 sm:px-6 lg:px-8 relative">
      {/* Top right language switcher & theme toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <ThemeToggle variant="buttons" />
        <LanguageSwitcher variant="buttons" />
      </div>

      <div className="max-w-md w-full space-y-8 bg-surface p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-outline-variant/30">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-display-lg text-on-background">
            {t("auth.iamTitle")}
          </h2>
          <p className="mt-2 text-center text-sm text-on-surface-variant font-body-md">
            {t("auth.iamSubtitle")}
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/50 space-y-3 text-sm text-on-surface-variant">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
              <div>
                <p className="font-medium text-on-surface">
                  {t("auth.iamCardTitle")}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {t("auth.iamCardDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={authentikUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-label-lg rounded-xl text-on-primary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
            >
              <span>{t("auth.openAuthentik")}</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>

            <Link
              to="/login"
              className="w-full flex justify-center items-center py-3 px-4 border border-outline-variant text-sm font-label-lg rounded-xl text-on-surface hover:bg-surface-container-high transition-all duration-200"
            >
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
