import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CATEGORY_DETAILS } from './UploadConstants';

interface AccessionManifestFormProps {
  fileCount?: number;
  selectedCategory?: string;
  onSubmit?: (accessionId: string, retentionDays: number) => Promise<any>;
  isUploading?: boolean;
}

const generateAccessionId = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ACC-${year}-${month}-${day}-${rand}`;
};

export function AccessionManifestForm({ fileCount = 0, selectedCategory = '', onSubmit, isUploading = false }: AccessionManifestFormProps) {
  const { username } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [success, setSuccess] = useState<boolean>(false);
  const [accessionId, setAccessionId] = useState(generateAccessionId);
  const [retentionDays, setRetentionDays] = useState(0);

  useEffect(() => {
    if (selectedCategory) {
      const details = CATEGORY_DETAILS[selectedCategory as keyof typeof CATEGORY_DETAILS];
      if (details && 'defaultRetentionDays' in details) {
        setRetentionDays(details.defaultRetentionDays);
      }
    }
  }, [selectedCategory]);

  return (
    <div className="bg-surface border border-outline-variant p-6 sticky top-24">
      <h3 className="font-headline-md text-headline-md text-on-background mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">summarize</span>
        Accession Manifest
      </h3>

      <form className="space-y-6">
        {error && (
          <div className="bg-error/10 border-l-4 border-error p-4 rounded-md">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-error mr-3 text-sm">error</span>
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
            {violations.length > 0 && (
              <ul className="list-disc list-inside text-sm text-error mt-2 ml-7">
                {violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-600 p-4 rounded-md">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-green-700 mr-3 text-sm">check_circle</span>
              <p className="text-sm text-green-800 font-medium">Accession successfully committed!</p>
            </div>
          </div>
        )}

        <div className="flex flex-col">
          <label className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider text-[11px]">Accession Identifier</label>
          <input
            type="text"
            value={accessionId}
            onChange={(e) => setAccessionId(e.target.value)}
            className="bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary font-data-mono text-data-mono text-on-background px-0 py-2"
          />
        </div>

        <div className="flex flex-col">
          <label className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider text-[11px]">Retention Days</label>
          <input
            type="number"
            min="0"
            value={retentionDays}
            onChange={(e) => setRetentionDays(parseInt(e.target.value) || 0)}
            className="bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary font-data-mono text-data-mono text-on-background px-0 py-2"
          />
        </div>

        <div className="flex flex-col">
          <label className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider text-[11px]">Curator Name</label>
          <div className="flex items-center gap-2 py-2">
            <span className="material-symbols-outlined text-[18px] text-primary">account_circle</span>
            <span className="font-body-md text-body-md text-on-background font-medium">{username || 'Unknown'}</span>
          </div>
        </div>


        <button
          type="button"
          disabled={isUploading}
          onClick={async () => {
            setError(null);
            setViolations([]);
            setSuccess(false);
            if (!accessionId.trim()) {
              setError('Please provide an Accession Identifier.');
              return;
            }
            if (fileCount === 0) {
              setError('Classification queue is empty. Please add files before committing.');
              return;
            }
            if (onSubmit) {
              try {
                await onSubmit(accessionId, retentionDays);
                setSuccess(true);
                setAccessionId(generateAccessionId());
                const details = CATEGORY_DETAILS[selectedCategory as keyof typeof CATEGORY_DETAILS];
                setRetentionDays(details ? (details as any).defaultRetentionDays : 0);
              } catch (err: any) {
                if (typeof err === 'string') {
                  setError(err);
                } else if (err instanceof Error) {
                  setError(err.message);
                } else {
                  setError(err.message || 'Failed to upload accession.');
                  if (err.violations) {
                    setViolations(err.violations);
                  }
                }
              }
            } else {
              setError('Backend upload functionality is not yet connected.');
            }
          }}
          className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 px-4 uppercase tracking-wider hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
              UPLOADING...
            </span>
          ) : (
            'COMMIT ACCESSION'
          )}
        </button>
      </form>
    </div>
  );
}
