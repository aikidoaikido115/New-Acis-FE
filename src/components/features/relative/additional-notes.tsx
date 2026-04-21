'use client';

import { useEffect, useMemo, useState } from 'react';
import { relativeNoteService } from '@/services/relative-note.service';
import type { RelativeNote } from '@/types/emr-notes';

interface AdditionalNotesProps {
  residentId?: string;
  selectedDate?: string;
  onLastUpdatedChange?: (lastUpdatedAt?: string) => void;
}

export function AdditionalNotes({ residentId, selectedDate, onLastUpdatedChange }: AdditionalNotesProps) {
  const [notes, setNotes] = useState<RelativeNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateKey = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const fetchNotes = async () => {
      if (!residentId || !selectedDate) {
        setNotes([]);
        onLastUpdatedChange?.(undefined);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await relativeNoteService.getByResidentAll(residentId);
        const filtered = (data || []).filter((note) => {
          const createdAt = new Date(note.created_at);
          if (Number.isNaN(createdAt.getTime())) return false;
          return formatDateKey(createdAt) === selectedDate;
        });

        setNotes(filtered);

        const lastUpdated = filtered
          .map((note) => ({
            raw: note.created_at,
            time: new Date(note.created_at).getTime(),
          }))
          .filter((item) => !Number.isNaN(item.time))
          .sort((a, b) => b.time - a.time)[0];

        onLastUpdatedChange?.(lastUpdated ? lastUpdated.raw : undefined);
      } catch {
        setError('ไม่สามารถโหลดบันทึกสำหรับญาติได้');
        onLastUpdatedChange?.(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchNotes();
  }, [residentId, selectedDate, onLastUpdatedChange]);

  const additionalNotes = useMemo(() => {
    return notes.map((note) => ({
      id: note.relative_note_id || note.id || note.created_at,
      text: note.content,
    }));
  }, [notes]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">บันทึกประจำวันสำหรับญาติ</h2>
      <div className="min-h-[160px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-500">กำลังโหลดข้อมูล...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-sm text-red-500">{error}</div>
        ) : additionalNotes.length === 0 ? (
          <div className="pt-16 flex items-center justify-center py-8 text-sm text-xl text-gray-500">ไม่มีบันทึกในวันนี้</div>
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
