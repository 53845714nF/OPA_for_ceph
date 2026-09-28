import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { name: t("nav.dashboard"), path: "/", icon: "dashboard" },
    { name: t("nav.archive"), path: "/archive", icon: "account_balance" },
    { name: t("nav.upload"), path: "/upload", icon: "cloud_upload" },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant py-8 z-50">
      <div className="px-6 mb-8">
        <h2 className="font-ebGaramond text-headline-md font-medium text-primary tracking-tight mb-1">
          {t("nav.heritageArchive")}
        </h2>
      </div>

      <nav className="flex-1 flex flex-col gap-1 w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-3 font-hankenGrotesk text-label-md transition-colors ${isActive
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
