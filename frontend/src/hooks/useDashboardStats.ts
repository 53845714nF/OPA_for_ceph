import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../context/AuthContext';

export interface DashboardStats {
  totalArtifacts: number;
  totalUploadsSize: string; 
  activeCurators: number;
  storageLocations: string[]; 
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const [artifactsRes, curatorsRes, sizeRes, locationRes] = await Promise.all([
    fetchApi('/number_of_artifacts'),
    fetchApi('/number_of_curators'),
    fetchApi('/storage_size'),
    fetchApi('/storage_location'),
  ]);

  if (!artifactsRes.ok || !curatorsRes.ok || !sizeRes.ok || !locationRes.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  const totalArtifacts = await artifactsRes.json();
  const activeCurators = await curatorsRes.json();
  const totalUploadsSize = await sizeRes.json();
  const locations = await locationRes.json();

  return {
    totalArtifacts,
    activeCurators,
    totalUploadsSize,
    storageLocations: locations.map((loc: any) => loc.city),
  };
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });
}
