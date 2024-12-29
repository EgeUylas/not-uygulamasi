'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { jsPDF } from 'jspdf';
import ThemeToggle from '../components/ThemeToggle';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isAfter, isBefore, isToday, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import ImageUpload from '../components/ImageUpload';

// Kategori türleri
const CATEGORIES = [
  { id: 'personal', name: 'Kişisel', color: '#FF6B6B' },
  { id: 'work', name: 'İş', color: '#4ECDC4' },
  { id: 'school', name: 'Okul', color: '#45B7D1' },
  { id: 'shopping', name: 'Alışveriş', color: '#96CEB4' },
  { id: 'important', name: 'Önemli', color: '#D4A5A5' },
  { id: 'other', name: 'Diğer', color: '#9FA4A9' }
];

// Tarih filtreleri
const DATE_FILTERS = [
  { id: 'all', name: 'Tümü' },
  { id: 'today', name: 'Bugün' },
  { id: 'upcoming', name: 'Yaklaşan' },
  { id: 'overdue', name: 'Gecikmiş' }
];

interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  category: string;
  reminderDate?: string;
  images?: string[];
  shareId?: string;
  isPublic?: boolean;
  sharedBy?: string;
  sharedAt?: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('personal');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    let unsubscribeNotes: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const q = query(
          collection(db, 'notes'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        unsubscribeNotes = onSnapshot(q, (snapshot) => {
          const notesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Note));
          setNotes(notesData);
          setLoading(false);
        });
      } else {
        setLoading(false);
        router.push('/auth/login');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotes) {
        unsubscribeNotes();
      }
    };
  }, [router]);

  const handleImageUpload = (url: string) => {
    setImages(prev => [...prev, url]);
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setImages(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;

    try {
      if (editingNote) {
        await updateDoc(doc(db, 'notes', editingNote.id), {
          title,
          content,
          category,
          reminderDate: reminderDate ? reminderDate.toISOString() : null,
          images,
          updatedAt: new Date().toISOString()
        });
        setEditingNote(null);
      } else {
        const newNote = {
          title,
          content,
          category,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          reminderDate: reminderDate ? reminderDate.toISOString() : null,
          images
        };
        await addDoc(collection(db, 'notes'), newNote);
      }
      setTitle('');
      setContent('');
      setCategory('personal');
      setReminderDate(null);
      setImages([]);
    } catch (error) {
      console.error('Not işlemi sırasında hata oluştu:', error);
      alert('Not kaydedilirken bir hata oluştu!');
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || 'personal');
    setReminderDate(note.reminderDate ? new Date(note.reminderDate) : null);
    setImages(note.images || []);
  };

  const handleCancel = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setCategory('personal');
    setReminderDate(null);
    setImages([]);
  };

  // Notları filtrele
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || note.category === selectedCategory;

    let matchesDate = true;
    if (note.reminderDate) {
      const reminderDate = new Date(note.reminderDate);
      switch (selectedDateFilter) {
        case 'today':
          matchesDate = isToday(reminderDate);
          break;
        case 'upcoming':
          matchesDate = isAfter(reminderDate, new Date()) && isBefore(reminderDate, addDays(new Date(), 7));
          break;
        case 'overdue':
          matchesDate = isBefore(reminderDate, new Date());
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      if (editingNote?.id === noteId) {
        handleCancel();
      }
    } catch (error) {
      console.error('Not silinirken hata oluştu:', error);
    }
  };

  const handleExportPDF = (note: Note) => {
    const pdf = new jsPDF();
    
    // Başlık
    pdf.setFontSize(20);
    pdf.text(note.title, 20, 20);
    
    // Tarih
    pdf.setFontSize(10);
    pdf.text(`Oluşturulma Tarihi: ${new Date(note.createdAt).toLocaleDateString()}`, 20, 30);
    
    // İçerik
    pdf.setFontSize(12);
    
    // İçeriği satırlara böl
    const lines = pdf.splitTextToSize(note.content, 170);
    
    // Her satırı yazdır
    pdf.text(lines, 20, 40);
    
    // PDF'i indir
    pdf.save(`${note.title}.pdf`);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  // Paylaşım fonksiyonları
  const handleShare = async (note: Note) => {
    if (!user) return;
    
    try {
      const shareId = note.shareId || crypto.randomUUID();
      await updateDoc(doc(db, 'notes', note.id), {
        shareId,
        isPublic: true,
        sharedBy: user.displayName || user.email,
        sharedAt: new Date().toISOString()
      });
      
      // Paylaşım linkini panoya kopyala
      const shareLink = `${window.location.origin}/shared/${shareId}`;
      await navigator.clipboard.writeText(shareLink);
      alert('Paylaşım linki panoya kopyalandı!');
    } catch (error) {
      console.error('Not paylaşılırken hata oluştu:', error);
      alert('Not paylaşılırken bir hata oluştu!');
    }
  };

  const handleUnshare = async (note: Note) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'notes', note.id), {
        isPublic: false,
        sharedAt: null
      });
    } catch (error) {
      console.error('Not paylaşımı kaldırılırken hata oluştu:', error);
      alert('Not paylaşımı kaldırılırken bir hata oluştu!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 flex">
      {/* Sol Sidebar - Notlar Listesi */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notlarım</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-600 dark:text-red-400"
              >
                Çıkış
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Notlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
          />
        </div>

        {/* Filtreler */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {/* Tarih Filtreleri */}
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tarih</h2>
            <div className="flex flex-wrap gap-2">
              {DATE_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedDateFilter(filter.id)}
                  className={`px-3 py-1 rounded-md text-xs ${
                    selectedDateFilter === filter.id
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori Filtreleri */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Kategori</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-md text-xs ${
                  !selectedCategory 
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Tümü
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-md text-xs ${
                    selectedCategory === cat.id
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notlar Listesi */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {filteredNotes.map((note) => {
              const noteCategory = CATEGORIES.find(cat => cat.id === note.category) || CATEGORIES[5];
              const isOverdue = note.reminderDate && isBefore(new Date(note.reminderDate), new Date());
              
              return (
                <div
                  key={note.id}
                  onClick={() => handleEdit(note)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    editingNote?.id === note.id ? 'bg-indigo-50 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: noteCategory.color + '33',
                          color: noteCategory.color
                        }}
                      >
                        {noteCategory.name}
                      </span>
                      {note.reminderDate && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isOverdue 
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        }`}>
                          {format(new Date(note.reminderDate), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {note.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={handleCancel}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
          >
            + Yeni Not
          </button>
        </div>
      </div>

      {/* Sağ Taraf - Not Detayı/Ekleme Alanı */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Not Başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-4 py-2 text-xl font-semibold bg-transparent border-0 border-b border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'inherit'
                }}
              >
                {CATEGORIES.map(cat => (
                  <option 
                    key={cat.id} 
                    value={cat.id}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={reminderDate}
                  onChange={(date) => setReminderDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd MMMM yyyy HH:mm"
                  locale={tr}
                  placeholderText="Hatırlatıcı ekle"
                  className="px-4 py-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-48"
                  isClearable
                />
                {reminderDate && (
                  <button
                    type="button"
                    onClick={() => setReminderDate(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex-1">
                <ImageUpload onImageUpload={handleImageUpload} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <textarea
              placeholder="Not içeriğinizi buraya yazın..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-300 resize-none"
            />
            
            {/* Yüklenen Resimler */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Yüklenen resim ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  {editingNote ? 'Güncelle' : 'Kaydet'}
                </button>
                {editingNote && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleExportPDF(editingNote)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      PDF İndir
                    </button>
                    <button
                      type="button"
                      onClick={() => editingNote.isPublic ? handleUnshare(editingNote) : handleShare(editingNote)}
                      className={`px-4 py-2 rounded-md text-sm ${
                        editingNote.isPublic 
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {editingNote.isPublic ? 'Paylaşımı Kaldır' : 'Paylaş'}
                    </button>
                  </>
                )}
              </div>
              {editingNote && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(editingNote.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Sil
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                  >
                    İptal
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
