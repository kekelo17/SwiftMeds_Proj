'use client';

import { useState } from 'react';
import { UploadCloud, FileCheck2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export function PrescriptionUpload({ userId, onUploaded }: { userId: string; onUploaded: (url: string) => void }) {
  const supabase = createClient();
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('prescriptions').upload(path, file, { upsert: false });
    setUploading(false);
    if (error) return toast.error('Upload failed: ' + error.message);
    const { data } = supabase.storage.from('prescriptions').getPublicUrl(path);
    setFileName(file.name);
    onUploaded(path); // store the storage path; pharmacist/admin fetch via signed URL
    toast.success('Prescription uploaded');
  };

  return (
    <div>
      <label className="label">Prescription document</label>
      {fileName ? (
        <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-brand-700"><FileCheck2 className="h-4 w-4" /> {fileName}</span>
          <button onClick={() => setFileName(null)}><X className="h-4 w-4 text-ink-400" /></button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 px-4 py-6 text-center hover:border-brand-400">
          <UploadCloud className="h-6 w-6 text-ink-400" />
          <span className="text-sm text-ink-500">{uploading ? 'Uploading…' : 'Click to upload a photo or PDF of your prescription'}</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}
