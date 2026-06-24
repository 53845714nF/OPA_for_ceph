import { useState } from 'react';
import { CATEGORIES } from '../components/Upload/UploadConstants';
import { UploadDropzone } from '../components/Upload/UploadDropzone';
import { ClassificationQueue, type UploadFile } from '../components/Upload/ClassificationQueue';
import { AccessionManifestForm } from '../components/Upload/AccessionManifestForm';
import { useFileUpload } from '../hooks/useFileUpload';
import { useAuth } from '../context/AuthContext';

export function Upload() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>(CATEGORIES[0] || '');

  const uploadMutation = useFileUpload();
  const { username } = useAuth();

  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFiles = selectedFiles.map(file => ({ file, category: uploadCategory }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCommit = async (accessionId: string, retentionDays: number) => {
    try {
      const results = [];
      for (const item of files) {
        const result = await uploadMutation.mutateAsync({
          category: item.category,
          file: item.file,
          author: username || 'Unknown',
          accessionIdentifier: accessionId,
          retentionDays,
        });
        results.push(result);
      }
      // Clear queue on success
      setFiles([]);
      return results;
    } catch (e: any) {
      throw e;
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <header className="mb-12">
        <h2 className="font-display-lg text-display-lg text-on-background mb-4">Upload Accession</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Securely classify and ingest digital artifacts into the institutional repository. Ensure all primary and metadata files comply with preservation standards.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <UploadDropzone
            uploadCategory={uploadCategory}
            setUploadCategory={setUploadCategory}
            onFilesSelected={handleFilesSelected}
          />
          <ClassificationQueue
            files={files}
            onRemoveFile={removeFile}
          />
        </div>

        <div className="lg:col-span-1">
          <AccessionManifestForm
            fileCount={files.length}
            selectedCategory={uploadCategory}
            onSubmit={handleCommit}
            isUploading={uploadMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
