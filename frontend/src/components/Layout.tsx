import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Layout() {
  const { username, role, logout } = useAuth();
  const { t } = useTranslation();

  const roleLabel = role === "admin" ? t("common.admin") : role === "curator" ? t("common.curator") : t("common.user");

  return (
    <>
      <Sidebar />
      
      {/* Top right user info & Controls */}
      <div className="fixed top-0 right-0 p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 z-50 bg-surface/90 backdrop-blur-sm border-b border-l border-outline-variant rounded-bl-xl shadow-sm">
        <ThemeToggle />
        <div className="w-px h-6 bg-outline-variant"></div>
        <LanguageSwitcher />
        <div className="w-px h-6 bg-outline-variant"></div>
        <div className="text-right hidden sm:block">
          <p className="font-label-md text-on-background font-medium">{username}</p>
          <p className="font-label-sm text-primary uppercase text-[10px] tracking-wider font-bold">{roleLabel}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">person</span>
        </div>
        <div className="w-px h-6 bg-outline-variant mx-1"></div>
        <button 
          onClick={logout}
          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors flex items-center"
          title={t("common.logout")}
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>

      <div className="md:ml-64 pt-16 min-h-screen flex flex-col">
        <Outlet />
      </div>
    </>
  );
}
