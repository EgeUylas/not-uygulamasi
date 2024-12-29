'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../../components/ThemeToggle';
import SocialInteractions from '../components/SocialInteractions';
import CollectionManager from '../components/CollectionManager';
import TagManager from '../components/TagManager';

interface PublicNote {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  sharedAt: string;
  category: string;
  authorName: string;
  authorAvatar: string;
  likes?: number;
  comments?: number;
  isPublic: boolean;
}

export default function ExplorePage() {
  const [publicNotes, setPublicNotes] = useState<PublicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showCollections, setShowCollections] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newNote, setNewNote] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    const fetchPublicNotes = async () => {
      try {
        const q = query(
          collection(db, 'notes'),
          where('isPublic', '==', true),
          orderBy('sharedAt', 'desc'),
          limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const notes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          } as PublicNote));
          setPublicNotes(notes);
          setLoading(false);
        }, () => {
          setLoading(false);
        });

        return () => unsubscribe();
      } catch {
        setLoading(false);
      }
    };

    fetchPublicNotes();
  }, []);

  const filteredNotes = publicNotes.filter(note => {
    const searchTermLower = searchTerm.toLowerCase();
    const titleMatch = (note.title?.toLowerCase() || '').includes(searchTermLower);
    const contentMatch = (note.content?.toLowerCase() || '').includes(searchTermLower);
    const authorMatch = (note.authorName?.toLowerCase() || '').includes(searchTermLower);

    return titleMatch || contentMatch || authorMatch;
  });

  const handleShareNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newNote.title.trim() || !newNote.content.trim()) {
      console.log('Validation failed:', { auth: auth.currentUser, title: newNote.title, content: newNote.content });
      return;
    }

    try {
      const noteData = {
        title: newNote.title,
        content: newNote.content,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        sharedAt: new Date().toISOString(),
        category: 'personal',
        isPublic: true,
        authorName: auth.currentUser.displayName || 'İsimsiz Kullanıcı',
        authorAvatar: '/avatars/avatar1.svg',
        likes: 0,
        comments: 0
      };

      console.log('Trying to add note:', noteData);
      const docRef = await addDoc(collection(db, 'notes'), noteData);
      console.log('Note added successfully with ID:', docRef.id);
      
      setPublicNotes(prevNotes => {
        const newNote = {
          id: docRef.id,
          ...noteData
        } as PublicNote;
        
        const filteredNotes = prevNotes.filter(note => note.id !== docRef.id);
        
        return [newNote, ...filteredNotes];
      });
      
      setNewNote({ title: '', content: '' });
      
    } catch (error) {
      console.error('Not paylaşılırken hata:', error);
      setNewNote({ title: '', content: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Keşfet</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Notlarda ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 px-4 py-2 pr-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Notlar Listesi */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Aramanızla eşleşen not bulunamadı.' : 'Henüz paylaşılmış not bulunmuyor.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredNotes.map((note) => (
                  <div
                    key={`${note.id}-${note.sharedAt}`}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={note.authorAvatar || '/avatars/avatar1.svg'}
                          alt={note.authorName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {note.authorName || 'İsimsiz Kullanıcı'}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(note.sharedAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      {/* Silme butonu - sadece not sahibi görebilir */}
                      {auth.currentUser && note.userId === auth.currentUser.uid && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
                              try {
                                await deleteDoc(doc(db, 'notes', note.id));
                              } catch (error) {
                                console.error('Not silinirken hata oluştu:', error);
                              }
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {note.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {note.content}
                    </p>

                    {/* Etiketler */}
                    <TagManager noteId={note.id} />

                    {/* Sosyal Etkileşimler */}
                    <SocialInteractions noteId={note.id} />

                    {/* Koleksiyona Ekleme Butonu */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedNoteId(note.id);
                          setShowCollections(true);
                        }}
                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                        Koleksiyona Ekle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Not Paylaşma Alanı */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-7xl mx-auto">
            <form onSubmit={handleShareNote} className="flex flex-col gap-4">
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Not başlığı..."
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                required
              />
              <div className="flex gap-2">
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Bir şeyler yaz..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  Paylaş
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Koleksiyon Modal */}
      {showCollections && selectedNoteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <CollectionManager
            noteId={selectedNoteId}
            onClose={() => {
              setShowCollections(false);
              setSelectedNoteId(null);
            }}
            mode="select"
          />
        </div>
      )}
    </div>
  );
} 