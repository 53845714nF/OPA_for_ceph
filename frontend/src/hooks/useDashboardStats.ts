import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../context/AuthContext';

export interface StorageLocation {
  zone: string;
  city: string;
  label: string;
  lat: number;
  lon: number;
}

export interface DashboardStats {
  totalArtifacts: number;
  totalUploadsSize: string; 
  activeCurators: number;
  storageLocations: string[]; 
  locations: StorageLocation[];
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  console.log('Fetching dashboard stats from:', fetchApi);
  const [artifactsRes, curatorsRes, sizeRes, locationRes] = await Promise.all([
    fetchApi('/number_of_artifacts'),
    fetchApi('/number_of_users'),
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
  const rawLocations = await locationRes.json();

  console.log('Fetched stats:', { totalArtifacts, activeCurators, totalUploadsSize, rawLocations });

  const locations: StorageLocation[] = Array.isArray(rawLocations)
    ? rawLocations.map((loc: any) => ({
        zone: loc.zone || "",
        city: loc.city || loc.label || "",
        label: loc.label || loc.city || "",
        lat: typeof loc.lat === "number" ? loc.lat : 0,
        lon: typeof loc.lon === "number" ? loc.lon : 0,
      }))
    : [];

  return {
    totalArtifacts,
    activeCurators,
    totalUploadsSize,
    storageLocations: locations.map((loc) => loc.city || loc.label),
    locations,
  };
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });
}
