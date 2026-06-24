import { useMutation } from '@tanstack/react-query';
import { fetchApi } from '../context/AuthContext';


export interface UploadFileParams {
  category: string;
  file: File;
  author: string;
  accessionIdentifier: string;
  retentionDays?: number;
}

const uploadFile = async (params: UploadFileParams): Promise<any> => {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('category', params.category);
  formData.append('author', params.author);
  formData.append('accessionIdentifier', params.accessionIdentifier);
  if (params.retentionDays !== undefined) {
    formData.append('retentionDays', params.retentionDays.toString());
  }

  const response = await fetchApi('/upload-data', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData && errorData.detail) {
      if (typeof errorData.detail === 'string') {
        throw new Error(errorData.detail);
      }
      throw errorData.detail;
    }
    throw new Error(`Upload failed with status ${response.status}`);
  }

  return response.json();
};

export function useFileUpload() {
  return useMutation({
    mutationFn: uploadFile,
  });
}
