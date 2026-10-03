import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePolicyLogs, usePolicyStats, PolicyDecision } from "../hooks/usePolicyLogs";

export function PolicyLog() {
  const { t, i18n } = useTranslation();

  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [selectedDecision, setSelectedDecision] = useState<PolicyDecision | null>(null);

  const { data: logsData, isLoading, isError, refetch } = usePolicyLogs(
    page,
    pageSize,
    search,
    statusFilter,
    actionFilter
  );

  const { data: stats } = usePolicyStats();

  const getActionBadge = (action: string) => {
    switch (action?.toLowerCase()) {
      case "promote":
        return {
          icon: "verified",
          label: t("policyLog.actionPromote", "Erheben"),
          className: "bg-primary/10 text-primary border-primary/30",
        };
      case "upload":
        return {
          icon: "cloud_upload",
          label: t("policyLog.actionUpload", "Upload"),
          className: "bg-secondary-container text-on-secondary-container border-outline-variant",
        };
      case "delete":
        return {
          icon: "delete",
          label: t("policyLog.actionDelete", "Löschen"),
          className: "bg-error-container text-on-error-container border-error/30",
        };
      case "modify":
      case "edit":
      case "rename":
        return {
          icon: "edit",
          label: t("policyLog.actionModify", "Bearbeiten"),
          className: "bg-surface-container-high text-on-surface border-outline-variant",
        };
      default:
        return {
          icon: "policy",
          label: action || t("policyLog.actionEvaluate", "Evaluierung"),
          className: "bg-surface-container text-on-surface-variant border-outline-variant",
        };
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(i18n.language, {
        dateStyle: "short",
        timeStyle: "medium",
      });
    } catch {
      return iso;
    }
  };

  const totalPages = Math.ceil((logsData?.total || 0) / pageSize);

  return (
    <div className="flex-1 flex flex-col w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-outline-variant gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-ebGaramond text-display-md text-primary font-medium tracking-tight">
              {t("policyLog.title", "OPA Policy & Audit Log")}
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline-variant rounded-full text-[11px] font-hankenGrotesk text-on-surface-variant">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              {t("policyLog.liveFeed", "Live Sync aktiv")}
            </span>
          </div>
          <p className="font-hankenGrotesk text-body-md text-on-surface-variant mt-1">
            {t(
              "policyLog.subtitle",
              "Lückenlose Nachvollziehbarkeit aller automatisierten Zugriffs-, Replikations- und Governance-Entscheidungen der OPA Policy Engine."
            )}
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 border border-outline bg-surface text-on-surface hover:bg-surface-container font-hankenGrotesk text-label-md uppercase tracking-wider transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          {t("policyLog.refresh", "Aktualisieren")}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-surface-container-lowest border border-outline-variant">
          <span className="font-hankenGrotesk text-[10px] uppercase tracking-widest text-outline">
            {t("policyLog.statsTotal", "Evaluierungen Gesamt")}
          </span>
          <p className="font-data-mono text-2xl text-on-surface font-bold mt-1">
            {stats?.total_evaluations ?? "-"}
          </p>
        </div>

        <div className="p-4 bg-surface-container-lowest border border-outline-variant">
          <span className="font-hankenGrotesk text-[10px] uppercase tracking-widest text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            {t("policyLog.statsAllowed", "Erlaubt")}
          </span>
          <p className="font-data-mono text-2xl text-primary font-bold mt-1">
            {stats?.allowed_count ?? "-"}
          </p>
        </div>

        <div className="p-4 bg-surface-container-lowest border border-outline-variant">
          <span className="font-hankenGrotesk text-[10px] uppercase tracking-widest text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            {t("policyLog.statsDenied", "Verweigert")}
          </span>
          <p className="font-data-mono text-2xl text-error font-bold mt-1">
            {stats?.denied_count ?? "-"}
          </p>
        </div>

        <div className="p-4 bg-surface-container-lowest border border-outline-variant">
          <span className="font-hankenGrotesk text-[10px] uppercase tracking-widest text-secondary flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">sync</span>
            {t("policyLog.statsReplications", "Multisite Replikationen")}
          </span>
          <p className="font-data-mono text-2xl text-on-surface font-bold mt-1">
            {stats?.replications_count ?? "-"}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-surface-container-low border border-outline-variant mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder={t("policyLog.searchPlaceholder", "Nach Benutzer, Bucket, Datei oder ID suchen...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-outline focus:border-primary focus:ring-0 font-hankenGrotesk text-body-sm text-on-surface rounded-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 bg-surface border border-outline font-hankenGrotesk text-body-sm text-on-surface rounded-none cursor-pointer"
          >
            <option value="">{t("policyLog.filterStatusAll", "Alle Status")}</option>
            <option value="allowed">{t("policyLog.filterStatusAllowed", "Nur Erlaubt")}</option>
            <option value="denied">{t("policyLog.filterStatusDenied", "Nur Verweigert")}</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 bg-surface border border-outline font-hankenGrotesk text-body-sm text-on-surface rounded-none cursor-pointer"
          >
            <option value="">{t("policyLog.filterActionAll", "Alle Aktionen")}</option>
            <option value="upload">{t("policyLog.actionUpload", "Upload")}</option>
            <option value="promote">{t("policyLog.actionPromote", "Erheben (Promote)")}</option>
            <option value="modify">{t("policyLog.actionModify", "Bearbeiten / Rename")}</option>
            <option value="delete">{t("policyLog.actionDelete", "Löschen")}</option>
          </select>

          {(search || statusFilter || actionFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setActionFilter("");
                setPage(0);
              }}
              className="px-3 py-2 text-outline hover:text-primary font-hankenGrotesk text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              {t("common.clearAll", "Zurücksetzen")}
            </button>
          )}
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="bg-surface border border-outline-variant overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-lowest font-hankenGrotesk text-[10px] uppercase tracking-wider text-outline">
              <th className="py-3 px-4">Zeitpunkt</th>
              <th className="py-3 px-4">Entscheidung</th>
              <th className="py-3 px-4">Aktion</th>
              <th className="py-3 px-4">Akteur &amp; Rolle</th>
              <th className="py-3 px-4">Zielobjekt / Bucket</th>
              <th className="py-3 px-4">Zonen &amp; Replikation</th>
              <th className="py-3 px-4">Latenz</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40 font-hankenGrotesk text-body-sm text-on-surface">
            {isLoading && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-outline">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mb-2"></div>
                  <p>{t("common.loading", "Lade Policy-Logs...")}</p>
                </td>
              </tr>
            )}

            {!isLoading && (!logsData?.items || logsData.items.length === 0) && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-outline">
                  <span className="material-symbols-outlined text-4xl mb-2 text-outline-variant">
                    history_toggle_off
                  </span>
                  <p className="font-ebGaramond text-headline-sm text-on-surface-variant">
                    {t("policyLog.noLogs", "Keine Policy-Entscheidungen gefunden")}
                  </p>
                  <p className="text-xs text-outline mt-1">
                    {t(
                      "policyLog.noLogsDesc",
                      "Sobald Dateien hochgeladen, bearbeitet, erhoben oder gelöscht werden, erscheinen die OPA-Entscheidungen hier."
                    )}
                  </p>
                </td>
              </tr>
            )}

            {!isLoading &&
              logsData?.items?.map((item) => {
                const badge = getActionBadge(item.action);
                return (
                  <tr
                    key={item.id || item.decision_id}
                    onClick={() => setSelectedDecision(item)}
                    className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap font-data-mono text-xs text-on-surface-variant">
                      {formatTimestamp(item.timestamp)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.allowed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          {t("policyLog.allowed", "ERLAUBT")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-error-container text-on-error-container border border-error/30">
                          <span className="material-symbols-outlined text-[13px]">cancel</span>
                          {t("policyLog.denied", "VERWEIGERT")}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${badge.className}`}
                      >
                        <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-on-surface">{item.username}</span>
                        <span className="text-[10px] font-data-mono uppercase px-1.5 py-0.2 bg-surface-container border border-outline-variant text-outline">
                          {item.role}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate" title={`${item.bucket} / ${item.key}`}>
                      <span className="font-data-mono text-xs font-semibold text-primary">
                        {item.bucket !== "N/A" ? item.bucket : item.category}
                      </span>
                      {item.key !== "N/A" && (
                        <span className="text-on-surface-variant text-xs ml-1.5 font-data-mono">
                          / {item.key}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      {item.allow_replication ? (
                        <span className="inline-flex items-center gap-1 text-primary font-data-mono text-[11px]">
                          <span className="material-symbols-outlined text-[13px]">sync</span>
                          {item.target_zones.join(" ➔ ") || "Zone A ➔ B"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-on-surface-variant font-data-mono text-[11px]">
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          {item.target_zones[0] || "Strikt lokal"}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-data-mono text-xs text-outline">
                      {item.eval_duration_us > 0 ? `${item.eval_duration_us} μs` : "< 1 ms"}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDecision(item);
                        }}
                        className="p-1.5 text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                        title={t("policyLog.inspect", "Entscheidung inspizieren")}
                      >
                        <span className="material-symbols-outlined text-[18px]">terminal</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 font-hankenGrotesk text-xs text-on-surface-variant">
          <span>
            {t("policyLog.pageOf", "Seite {{current}} von {{total}}", {
              current: page + 1,
              total: totalPages,
            })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border border-outline bg-surface disabled:opacity-40 cursor-pointer"
            >
              {t("policyLog.previous", "Zurück")}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 border border-outline bg-surface disabled:opacity-40 cursor-pointer"
            >
              {t("policyLog.next", "Weiter")}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal / Inspector */}
      {selectedDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-outline-variant max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-outline-variant">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">policy</span>
                  <h3 className="font-ebGaramond text-headline-sm text-primary font-medium">
                    {t("policyLog.decisionDetailsTitle", "OPA Entscheidungs-Audit")}
                  </h3>
                </div>
                <p className="font-data-mono text-xs text-outline mt-1">
                  ID: <span className="text-on-surface">{selectedDecision.decision_id}</span>
                  {"  •  "}
                  {formatTimestamp(selectedDecision.timestamp)}
                </p>
              </div>

              <button
                onClick={() => setSelectedDecision(null)}
                className="p-1.5 text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Violations Box (if any) */}
              {selectedDecision.violations && selectedDecision.violations.length > 0 && (
                <div className="p-4 bg-error-container border border-error/40 text-on-error-container">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <span className="material-symbols-outlined text-[18px]">gpp_bad</span>
                    <span>{t("policyLog.violationsHeader", "Richtlinienverstöße (Policy Violations):")}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {selectedDecision.violations.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-surface-container-low border border-outline-variant">
                  <span className="text-outline uppercase text-[10px] block">Aktion</span>
                  <span className="font-bold text-on-surface capitalize">{selectedDecision.action}</span>
                </div>
                <div className="p-2.5 bg-surface-container-low border border-outline-variant">
                  <span className="text-outline uppercase text-[10px] block">Rolle</span>
                  <span className="font-bold text-on-surface">{selectedDecision.role}</span>
                </div>
                <div className="p-2.5 bg-surface-container-low border border-outline-variant">
                  <span className="text-outline uppercase text-[10px] block">Replikation</span>
                  <span className="font-bold text-on-surface">
                    {selectedDecision.allow_replication ? "Aktiv (Multisite)" : "Deaktiviert (Lokal)"}
                  </span>
                </div>
                <div className="p-2.5 bg-surface-container-low border border-outline-variant">
                  <span className="text-outline uppercase text-[10px] block">Evaluierungsdauer</span>
                  <span className="font-bold font-data-mono text-on-surface">
                    {selectedDecision.eval_duration_us} μs
                  </span>
                </div>
              </div>

              {/* Raw JSON Views */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-hankenGrotesk text-xs uppercase tracking-wider text-outline font-semibold">
                      OPA Input Payload
                    </span>
                    <span className="text-[10px] font-data-mono text-outline">JSON</span>
                  </div>
                  <pre className="p-3 bg-surface-container-lowest border border-outline-variant text-xs font-data-mono text-on-surface overflow-x-auto max-h-48">
                    {JSON.stringify(selectedDecision.raw_input, null, 2)}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-hankenGrotesk text-xs uppercase tracking-wider text-outline font-semibold">
                      OPA Decision Result
                    </span>
                    <span className="text-[10px] font-data-mono text-outline">JSON</span>
                  </div>
                  <pre className="p-3 bg-surface-container-lowest border border-outline-variant text-xs font-data-mono text-on-surface overflow-x-auto max-h-56">
                    {JSON.stringify(selectedDecision.raw_result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setSelectedDecision(null)}
                className="px-4 py-2 border border-outline bg-surface text-on-surface hover:bg-surface-container font-hankenGrotesk text-label-md uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t("policyLog.close", "Schließen")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default PolicyLog;
