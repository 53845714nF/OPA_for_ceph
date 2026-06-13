import React, { useRef } from 'react';
import { CATEGORIES } from './UploadConstants';

interface UploadDropzoneProps {
  uploadCategory: string;
  setUploadCategory: (category: string) => void;
  onFilesSelected: (files: File[]) => void;
}

export function UploadDropzone({ uploadCategory, setUploadCategory, onFilesSelected }: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
    }
  };

  return (
    <>
      {/* Upload Category Selection */}
      <div className="bg-surface-container border border-outline-variant p-4 flex flex-col gap-3">
        <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">
          Select Category for Upload
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setUploadCategory(c)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${uploadCategory === c
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-container-high'
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* File Drop Zone */}
      <div
        className="border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low transition-colors duration-200 flex flex-col items-center justify-center py-20 px-6 text-center cursor-pointer group"
        onClick={handleSelectFilesClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileChange}
        />
        <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary mb-4 transition-colors">upload_file</span>
        <h3 className="font-headline-md text-headline-md text-on-background mb-2">Drag &amp; Drop Files Here</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">or click to browse institutional drives</p>
        <button className="border border-outline text-on-surface px-6 py-2 font-label-md text-label-md uppercase tracking-wider hover:bg-surface-container-high transition-colors">Select Files</button>
        <div className="mt-6 font-data-mono text-data-mono text-on-surface-variant flex gap-4">
          <span>Max size: 5GB per file</span>
          <span>•</span>
          <span>Supported: TIFF, PDF/A, XML, JSON</span>
        </div>
      </div>
    </>
  );
}
