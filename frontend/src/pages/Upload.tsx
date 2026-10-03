import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../components/Upload/UploadConstants';
import { UploadDropzone } from '../components/Upload/UploadDropzone';
import { ClassificationQueue, type UploadFile } from '../components/Upload/ClassificationQueue';
import { AccessionManifestForm } from '../components/Upload/AccessionManifestForm';
import { useFileUpload } from '../hooks/useFileUpload';
import { useAuth } from '../context/AuthContext';

export function Upload() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>(CATEGORIES[0] || '');

  const uploadMutation = useFileUpload();
  const { username } = useAuth();

  const handleCategoryChange = (newCategory: string) => {
    setUploadCategory(newCategory);
    // When changing category at the top, immediately update all currently queued files
    setFiles((prev) => prev.map((item) => ({ ...item, category: newCategory })));
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    let effectiveCategory = uploadCategory;

    // Smart auto-detection for manifest/metadata files (.yml, .yaml, .json, .xml)
    // If the category is still the initial default ("Roh- und Primärdaten"), auto-switch to "Metadaten und Manifeste"
    const isManifestCandidate = selectedFiles.some((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['yml', 'yaml', 'xml', 'json'].includes(ext || '');
    });

    if (isManifestCandidate && uploadCategory === CATEGORIES[0]) {
      effectiveCategory = "Metadaten und Manifeste";
      setUploadCategory("Metadaten und Manifeste");
    }

    const newFiles = selectedFiles.map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const itemCategory = (isManifestCandidate && uploadCategory === CATEGORIES[0] && ['yml', 'yaml', 'xml', 'json'].includes(ext || ''))
        ? "Metadaten und Manifeste"
        : effectiveCategory;
      return { file, category: itemCategory };
    });

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleUpdateFileCategory = (index: number, newCategory: string) => {
    setFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, category: newCategory } : item))
    );
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCommit = async (accessionId: string, retentionDays: number) => {
    try {
      const results = [];
      for (const item of files) {
        const cat = item.category || uploadCategory;
        const result = await uploadMutation.mutateAsync({
          category: cat,
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
        <h2 className="font-display-lg text-display-lg text-on-background mb-4">
          {t("upload.title")}
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          {t("upload.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <UploadDropzone
            uploadCategory={uploadCategory}
            setUploadCategory={handleCategoryChange}
            onFilesSelected={handleFilesSelected}
          />
          <ClassificationQueue
            files={files}
            onRemoveFile={removeFile}
            onUpdateCategory={handleUpdateFileCategory}
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

