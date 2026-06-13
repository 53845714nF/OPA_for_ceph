import React from 'react';
import { CATEGORIES, CATEGORY_DETAILS } from './UploadConstants';

export interface UploadFile {
  file: File;
  category: string;
}

interface ClassificationQueueProps {
  files: UploadFile[];
  onRemoveFile: (index: number) => void;
}

export function ClassificationQueue({ files, onRemoveFile }: ClassificationQueueProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-headline-md text-headline-md text-on-background border-b border-outline-variant pb-2">Classification Queue</h3>

      {files.length === 0 ? (
        <div className="bg-surface-container border border-outline-variant border-dashed p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inventory_2</span>
          <p className="font-body-md text-body-md text-on-surface-variant">No files classified yet. Select a category and upload files above.</p>
        </div>
      ) : (
        CATEGORIES.map(category => {
          const categoryFiles = files.map((item, index) => ({ ...item, index })).filter(item => item.category === category);
          const details = CATEGORY_DETAILS[category as keyof typeof CATEGORY_DETAILS];
          const isSensitive = 'isSensitive' in details ? details.isSensitive : false;

          if (categoryFiles.length === 0) {
            return null;
          }

          return (
            <div key={category} className={`bg-surface-container border border-outline-variant p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-shadow ${isSensitive ? 'border-l-4 border-l-error' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${isSensitive ? 'text-error' : 'text-primary'}`}>{details.icon}</span>
                  <div>
                    <h4 className="font-headline-md text-[18px] leading-[24px] font-medium text-on-background">{category}</h4>
                    <p className="font-data-mono text-data-mono text-on-surface-variant">{details.desc}</p>
                  </div>
                </div>
                {isSensitive ? (
                  <span className="bg-error/10 text-error px-2 py-1 font-data-mono text-[11px] uppercase tracking-wider">{categoryFiles.length} Validation Required</span>
                ) : (
                  <span className="bg-surface-container-high text-on-surface-variant px-2 py-1 font-data-mono text-[11px] uppercase tracking-wider">{categoryFiles.length} {categoryFiles.length === 1 ? 'File' : 'Files'}</span>
                )}
              </div>

              <div className="space-y-2">
                {categoryFiles.map(({ file, index }) => (
                  <div key={index} className="bg-surface border border-outline-variant p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm flex-shrink-0">{details.icon}</span>
                      <span className="font-data-mono text-data-mono text-on-background truncate" title={file.name}>{file.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-data-mono text-data-mono text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</span>
                      <button onClick={(e) => { e.stopPropagation(); onRemoveFile(index); }} className="text-error hover:text-error/80 transition-colors"><span className="material-symbols-outlined text-[18px]">close</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
