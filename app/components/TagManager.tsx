'use client';

import { useState } from 'react';
import { useTags } from '../hooks/useTags';

interface TagManagerProps {
  noteId: string;
}

export default function TagManager({ noteId }: TagManagerProps) {
  const { tags, popularTags, loading, addTag, removeTag } = useTags(noteId);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    try {
      await addTag(newTag.trim());
      setNewTag('');
    } catch (error) {
      console.error('Etiket eklenirken hata:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Etiket Ekleme Formu */}
      <form onSubmit={handleAddTag} className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Yeni etiket..."
          className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
        >
          Ekle
        </button>
      </form>

      {/* Mevcut Etiketler */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
            >
              #{tag.name}
              <button
                onClick={() => removeTag(tag.id)}
                className="text-gray-500 hover:text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Popüler Etiketler */}
      {popularTags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Popüler Etiketler
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => addTag(tag.name)}
                className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                #{tag.name}
                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                  {tag.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 