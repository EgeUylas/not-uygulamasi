'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

interface Tag {
  id: string;
  name: string;
  noteId: string;
  userId: string;
  createdAt: string;
}

export function useTags(noteId?: string) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [popularTags, setPopularTags] = useState<{name: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);

  // Belirli bir notun etiketlerini dinle
  useEffect(() => {
    if (!auth.currentUser || !noteId) return;

    const q = query(
      collection(db, 'tags'),
      where('noteId', '==', noteId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tagsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tag));
      setTags(tagsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [noteId]);

  // Popüler etiketleri getir
  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchPopularTags = async () => {
      try {
        const q = query(collection(db, 'tags'));
        const snapshot = await getDocs(q);
        
        // Etiketleri say ve sırala
        const tagCounts: { [key: string]: number } = {};
        snapshot.docs.forEach(doc => {
          const tag = doc.data() as Tag;
          tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
        });

        const sortedTags = Object.entries(tagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // En popüler 10 etiket

        setPopularTags(sortedTags);
      } catch (error) {
        console.error('Popüler etiketler alınırken hata:', error);
      }
    };

    fetchPopularTags();
  }, []);

  const addTag = async (name: string) => {
    if (!auth.currentUser || !noteId) return;

    try {
      // Etiketin zaten var olup olmadığını kontrol et
      const q = query(
        collection(db, 'tags'),
        where('noteId', '==', noteId),
        where('name', '==', name.toLowerCase())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const tag = {
          name: name.toLowerCase(),
          noteId,
          userId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'tags'), tag);
      }
    } catch (error) {
      console.error('Etiket eklenirken hata:', error);
      throw error;
    }
  };

  const removeTag = async (tagId: string) => {
    if (!auth.currentUser) return;

    try {
      await deleteDoc(doc(db, 'tags', tagId));
    } catch (error) {
      console.error('Etiket silinirken hata:', error);
      throw error;
    }
  };

  const searchNotesByTag = async (tagName: string) => {
    if (!auth.currentUser) return [];

    try {
      const q = query(
        collection(db, 'tags'),
        where('name', '==', tagName.toLowerCase())
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().noteId);
    } catch (error) {
      console.error('Etiketli notlar aranırken hata:', error);
      throw error;
    }
  };

  return {
    tags,
    popularTags,
    loading,
    addTag,
    removeTag,
    searchNotesByTag
  };
} 