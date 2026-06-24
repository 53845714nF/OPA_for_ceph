import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../context/AuthContext';

export interface DashboardStats {
  totalArtifacts: number;
  totalUploadsSize: string; 
  activeCurators: number;
  storageLocations: string[]; 
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  console.log('Fetching dashboard stats from:', fetchApi);
  const [artifactsRes, curatorsRes, sizeRes, locationRes] = await Promise.all([
    fetchApi('/number_of_artifacts'),
    fetchApi('/number_of_curators'),
    fetchApi('/storage_size'),
    fetchApi('/storage_location'),
  ]);

  if (!artifactsRes.ok || !curatorsRes.ok || !sizeRes.ok || !locationRes.ok) {
    console.error('API Error:', { artifactsRes, curatorsRes, sizeRes, locationRes });
    throw new Error('Failed to fetch dashboard stats');
  }

  const totalArtifacts = await artifactsRes.json();
  const activeCurators = await curatorsRes.json();
  const totalUploadsSize = await sizeRes.json();
  const locations = await locationRes.json();

  console.log('Fetched stats:', { totalArtifacts, activeCurators, totalUploadsSize, locations });

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
