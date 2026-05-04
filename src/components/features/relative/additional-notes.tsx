'use client';

import { useMemo } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { RelativeDashboardNote } from '@/services/relative-portal.service';

interface AdditionalNotesProps {
  notes?: RelativeDashboardNote[];
  isLoading?: boolean;
  error?: string | null;
}

export function AdditionalNotes({ notes = [], isLoading = false, error = null }: AdditionalNotesProps) {

  const additionalNotes = useMemo(() => {
    return notes.map((note) => ({
      id: note.id || note.created_at,
      text: note.content,
    }));
  }, [notes]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">บันทึกประจำวันสำหรับญาติ</h2>
      <div className="min-h-40">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-sm text-red-500">{error}</div>
        ) : additionalNotes.length === 0 ? (
          <div className="pt-16 flex items-center justify-center py-8 text-xl text-gray-500">ไม่มีบันทึกในวันนี้</div>
        ) : (
          <ul className="space-y-2 list-disc list-inside">
            {additionalNotes.map((note) => (
              <li key={note.id} className="text-lg mt-4 text-gray-700">
                {note.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
