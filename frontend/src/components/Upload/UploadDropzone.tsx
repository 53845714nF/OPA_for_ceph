import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, CATEGORY_DETAILS } from './UploadConstants';

interface UploadDropzoneProps {
  uploadCategory: string;
  setUploadCategory: (category: string) => void;
  onFilesSelected: (files: File[]) => void;
}

export function UploadDropzone({ uploadCategory, setUploadCategory, onFilesSelected }: UploadDropzoneProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSelectFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFilesSelected(Array.from(event.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <>
      {/* Upload Category Selection */}
      <div className="bg-surface-container border border-outline-variant p-4 flex flex-col gap-3">
        <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">
          {t("upload.selectCategory")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => {
            const isSelected = uploadCategory === c;
            const details = CATEGORY_DETAILS[c as keyof typeof CATEGORY_DETAILS];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setUploadCategory(c)}
                className={`px-4 py-2 text-sm rounded-full border transition-all flex items-center gap-2 ${isSelected
                  ? 'bg-primary text-on-primary border-primary shadow-sm font-medium'
                  : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-container-high'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">{details.icon}</span>
                {t(`categories.${c}.name`, { defaultValue: c })}
              </button>
            );
          })}
        </div>
      </div>

      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center py-20 px-6 text-center cursor-pointer group rounded-lg ${
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.005] shadow-md'
            : 'border-outline-variant hover:border-primary bg-surface-container-low'
        }`}
        onClick={handleSelectFilesClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileChange}
        />
        <span className={`material-symbols-outlined text-4xl mb-4 transition-colors ${
          isDragging ? 'text-primary animate-bounce' : 'text-on-surface-variant group-hover:text-primary'
        }`}>
          upload_file
        </span>
        <h3 className="font-headline-md text-headline-md text-on-background mb-2">
          {t("upload.dragDrop")}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
          {t("upload.orBrowse")}
        </p>
        <button 
          type="button"
          className="border border-outline text-on-surface px-6 py-2 font-label-md text-label-md uppercase tracking-wider hover:bg-surface-container-high transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectFilesClick();
          }}
        >
          {t("upload.selectFiles")}
        </button>
        <div className="mt-6 font-data-mono text-data-mono text-on-surface-variant flex gap-4">
          <span>{t("upload.supportNotice")}</span>
        </div>
      </div>
    </>
  );
}

