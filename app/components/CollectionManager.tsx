'use client';

import { useState } from 'react';
import { useCollections } from '../hooks/useCollections';

interface CollectionManagerProps {
  noteId?: string;
  onClose?: () => void;
  mode?: 'select' | 'manage';
}

export default function CollectionManager({ noteId, onClose, mode = 'select' }: CollectionManagerProps) {
  const { collections, loading, createCollection, addNoteToCollection, removeNoteFromCollection } = useCollections();
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      await createCollection(newCollectionName.trim(), newCollectionDescription.trim(), isPublic);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setIsPublic(false);
      setShowNewCollectionForm(false);
    } catch (error) {
      console.error('Koleksiyon oluşturulurken hata:', error);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
      {/* Başlık */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'select' ? 'Koleksiyona Ekle' : 'Koleksiyonlarım'}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Koleksiyonlar Listesi */}
      <div className="p-4">
        {collections.length > 0 ? (
          <div className="space-y-2">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {collection.noteCount} not
                    </span>
                    {collection.isPublic && (
                      <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100 px-2 py-0.5 rounded-full">
                        Herkese Açık
                      </span>
                    )}
                  </div>
                </div>
                {mode === 'select' && noteId && (
                  <button
                    onClick={() => addNoteToCollection(collection.id, noteId)}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors duration-200"
                  >
                    Ekle
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Henüz koleksiyon oluşturmadınız.
          </p>
        )}

        {/* Yeni Koleksiyon Oluşturma */}
        {showNewCollectionForm ? (
          <form onSubmit={handleCreateCollection} className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Koleksiyon Adı
              </label>
              <input
                type="text"
                id="name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Açıklama
              </label>
              <textarea
                id="description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm resize-none"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                Herkese açık
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewCollectionForm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
              >
                Oluştur
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewCollectionForm(true)}
            className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            + Yeni Koleksiyon
          </button>
        )}
      </div>
    </div>
  );
} 