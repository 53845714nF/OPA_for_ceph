import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../context/AuthContext";

export interface PolicyDecision {
  id: number;
  decision_id: string;
  timestamp: string;
  path: string;
  action: string;
  username: string;
  role: string;
  category: string;
  bucket: string;
  key: string;
  allowed: boolean;
  allow_replication: boolean;
  target_zones: string[];
  violations: string[];
  eval_duration_us: number;
  raw_input: Record<string, any>;
  raw_result: Record<string, any>;
  source: string;
  created_at: string;
}

export interface PolicyLogsResponse {
  items: PolicyDecision[];
  total: number;
  limit: number;
  offset: number;
}

export interface PolicyStats {
  total_evaluations: number;
  allowed_count: number;
  denied_count: number;
  replications_count: number;
}

export function usePolicyLogs(
  page = 0,
  limit = 25,
  search = "",
  status = "",
  action = ""
) {
  const offset = page * limit;
  return useQuery<PolicyLogsResponse>({
    queryKey: ["policyLogs", page, limit, search, status, action],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (action) params.append("action", action);

      const res = await fetchApi(`/policy-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch policy logs");
      return res.json();
    },
    refetchInterval: 3000,
  });
}

export function usePolicyStats() {
  return useQuery<PolicyStats>({
    queryKey: ["policyStats"],
    queryFn: async () => {
      const res = await fetchApi("/policy-logs/stats");
      if (!res.ok) throw new Error("Failed to fetch policy stats");
      return res.json();
    },
    refetchInterval: 5000,
  });
}
