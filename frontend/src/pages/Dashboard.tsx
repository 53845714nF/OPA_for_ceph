import { useTranslation } from "react-i18next";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { StorageMap } from "../components/Dashboard/StorageMap";

export function Dashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading, isError } = useDashboardStats();

  return (
    <div className="flex-1 overflow-y-auto pt-8 px-margin-mobile md:px-margin-desktop pb-section-gap">
      <div className="max-w-container-max mx-auto space-y-section-gap">
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Widget 1 */}
            <div className="bg-surface-container-low border border-outline-variant p-6 ambient-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">museum</span>
                <span className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-variant px-2 py-1">
                  {t("dashboard.total")}
                </span>
              </div>
              <h3 className="font-ebGaramond text-headline-lg text-on-surface">
                {isLoading ? "..." : (isError ? t("common.error") : (stats?.totalArtifacts.toLocaleString() || "0"))}
              </h3>
              <p className="font-hankenGrotesk text-label-md text-on-surface-variant mt-1">
                {t("dashboard.totalArtifacts")}
              </p>
            </div>

            {/* Widget 2 */}
            <div className="bg-surface-container-low border border-outline-variant p-6 ambient-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-secondary text-3xl">database</span>
                <span className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-variant px-2 py-1">
                  {t("dashboard.usage")}
                </span>
              </div>
              <h3 className="font-ebGaramond text-headline-lg text-on-surface">
                {isLoading ? "..." : (isError ? t("common.error") : (stats?.totalUploadsSize || "0 B"))}
              </h3>
              <p className="font-hankenGrotesk text-label-md text-on-surface-variant mt-1">
                {t("dashboard.preservationStorage")}
              </p>
            </div>

            {/* Widget 3 */}
            <div className="bg-surface-container-low border border-outline-variant p-6 ambient-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-tertiary text-3xl">groups</span>
                <span className="font-hankenGrotesk text-data-mono text-on-surface-variant bg-surface-variant px-2 py-1">
                  {t("dashboard.active")}
                </span>
              </div>
              <h3 className="font-ebGaramond text-headline-lg text-on-surface">
                {isLoading ? "..." : (isError ? t("common.error") : (stats?.activeCurators || 0))}
              </h3>
              <p className="font-hankenGrotesk text-label-md text-on-surface-variant mt-1">
                {t("dashboard.numberOfUsers")}
              </p>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section>
          {isLoading ? (
            <div className="bg-surface-container-low border border-outline-variant p-12 text-center text-on-surface-variant">
              {t("dashboard.loadingLocations")}
            </div>
          ) : (
            <StorageMap locations={stats?.locations || []} />
          )}
        </section>
      </div>
    </div>
  );
}
