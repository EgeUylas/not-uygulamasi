'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { jsPDF } from 'jspdf';
import ThemeToggle from '../components/ThemeToggle';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isAfter, isBefore, isToday, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import ImageUpload from '../components/ImageUpload';
import Profile from './components/Profile';
import { useProfile } from './hooks/useProfile';

// Kategori türleri
const CATEGORIES = [
  { id: 'all', name: 'Tümü', color: '#9FA4A9' },
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
  authorName?: string;
  authorAvatar?: string;
  likes?: number;
  comments?: number;
}

// Notification bileşeni
const Notification = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  // 3 saniye sonra otomatik kapanma
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`rounded-lg shadow-lg p-4 ${
        type === 'success' ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'
      }`}>
        <div className="flex items-center gap-2">
          {type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 dark:text-green-200" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 dark:text-red-200" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <p className={`text-sm ${
            type === 'success' ? 'text-green-800 dark:text-green-100' : 'text-red-800 dark:text-red-100'
          }`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

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
  const [showProfile, setShowProfile] = useState(false);
  const { updateTotalNotes } = useProfile();
  const [isPublic, setIsPublic] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

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
          updateTotalNotes(notesData.length).catch(console.error);
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
  }, [router, updateTotalNotes]);

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setCategory(editingNote.category);
      setReminderDate(editingNote.reminderDate ? new Date(editingNote.reminderDate) : null);
      setImages(editingNote.images || []);
      setIsPublic(editingNote.isPublic || false);
    }
  }, [editingNote]);

  const handleImageUpload = (url: string) => {
    setImages(prev => [...prev, url]);
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setImages(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const noteData = {
        title,
        content,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        category,
        reminderDate: reminderDate ? reminderDate.toISOString() : null,
        images: images || [],
        isPublic: false,
        likes: 0,
        comments: 0
      };

      if (editingNote) {
        await updateDoc(doc(db, 'notes', editingNote.id), noteData);
      } else {
        await addDoc(collection(db, 'notes'), noteData);
      }

      setTitle('');
      setContent('');
      setCategory('personal');
      setReminderDate(null);
      setImages([]);
      setEditingNote(null);
    } catch (error) {
      console.error('Not kaydedilirken hata:', error);
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
    
    const lines = pdf.splitTextToSize(note.content, 170);
    
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

  const handleShare = async (note: Note) => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData?.name) {
        setNotification({
          message: 'Lütfen önce profil bilgilerinizi güncelleyin!',
          type: 'error'
        });
        setShowProfile(true);
        return;
      }
      
      // Önce notu güncelle
      const noteRef = doc(db, 'notes', note.id);
      const updatedData = {
        isPublic: true,
        sharedAt: new Date().toISOString(),
        authorName: userData.name,
        authorAvatar: userData.avatar || '/avatars/avatar1.svg',
        likes: 0,
        comments: 0
      };
      
      await updateDoc(noteRef, updatedData);
      
      // Local state'i güncelle
      setNotes(prevNotes => 
        prevNotes.map(n => 
          n.id === note.id 
            ? { 
                ...n,
                ...updatedData
              }
            : n
        )
      );
      
      setNotification({
        message: 'Notunuz keşfet sayfasında paylaşıldı!',
        type: 'success'
      });
    } catch (error) {
      console.error('Not paylaşılırken hata oluştu:', error);
      setNotification({
        message: 'Not paylaşılırken bir hata oluştu!',
        type: 'error'
      });
    }
  };

  const handleUnshare = async (note: Note) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'notes', note.id), {
        isPublic: false,
        sharedAt: null,
        authorName: null,
        authorAvatar: null,
        likes: null,
        comments: null
      });
      alert('Not paylaşımdan kaldırıldı!');
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
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Sol Sidebar - Notlar Listesi */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notlarım</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/explore')}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
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
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === 'all' ? null : cat.id)}
                  className={`px-3 py-1 rounded-md text-xs ${
                    (cat.id === 'all' && !selectedCategory) || selectedCategory === cat.id
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat.id ? cat.color + '33' : undefined,
                    color: selectedCategory === cat.id ? cat.color : undefined
                  }}
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
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={reminderDate}
                  onChange={(date) => setReminderDate(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Hatırlatıcı ekle"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  locale={tr}
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
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
                  </svg>
                  {editingNote ? 'Güncelle' : 'Kaydet'}
                </button>
                {editingNote && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleExportPDF(editingNote)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      PDF İndir
                    </button>
                    <button
                      type="button"
                      onClick={() => editingNote.isPublic ? handleUnshare(editingNote) : handleShare(editingNote)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${
                        editingNote.isPublic 
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {editingNote.isPublic ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Paylaşımı Kaldır
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                          Paylaş
                        </>
                      )}
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

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </div>
  );
}
