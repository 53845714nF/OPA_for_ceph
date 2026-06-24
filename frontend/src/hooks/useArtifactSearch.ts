import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../context/AuthContext';

export interface Artifact {
  key: string;
  bucket: string;
  size: number;
  last_modified: string;
  etag: string;
  zone: string;
  preview_url?: string;
  accession_id: string;
}

const fetchArtifactSearch = async (query: string): Promise<Artifact[]> => {
  const response = await fetchApi(`/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Search failed');
  }
  return response.json();
};

export function useArtifactSearch(query: string) {
  return useQuery({
    queryKey: ['artifactSearch', query],
    queryFn: () => fetchArtifactSearch(query),
    enabled: true, // Always allow search, even if empty (returns all)
  });
}
