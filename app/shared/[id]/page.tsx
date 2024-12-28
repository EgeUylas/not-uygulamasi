'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Comments from '../../../components/Comments';

interface SharedNote {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  sharedBy: string;
  sharedAt: string;
  images?: string[];
}

export default function SharedNotePage({ params }: { params: { id: string } }) {
  const [note, setNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const q = query(
          collection(db, 'notes'),
          where('shareId', '==', params.id),
          where('isPublic', '==', true)
        );
        
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setError('Not bulunamadı veya paylaşımı kaldırılmış.');
          setLoading(false);
          return;
        }

        const noteData = snapshot.docs[0].data() as SharedNote;
        noteData.id = snapshot.docs[0].id;
        setNote(noteData);
      } catch (error) {
        console.error('Not yüklenirken hata oluştu:', error);
        setError('Not yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Hata
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {note.title}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Paylaşan: {note.sharedBy}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(note.sharedAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                </span>
              </div>
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{note.content}</p>
            </div>

            {note.images && note.images.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ekli Görseller
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {note.images.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Görsel ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Yorumlar */}
            <Comments noteId={note.id} />
          </div>
        </div>
      </div>
    </div>
  );
} 