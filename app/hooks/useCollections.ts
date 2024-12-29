'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';

interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  noteCount: number;
}

interface CollectionNote {
  id: string;
  collectionId: string;
  noteId: string;
  addedAt: string;
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'collections'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const collectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Collection));
      setCollections(collectionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createCollection = async (name: string, description: string = '', isPublic: boolean = false) => {
    if (!auth.currentUser) return;

    try {
      const newCollection = {
        userId: auth.currentUser.uid,
        name,
        description,
        isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        noteCount: 0
      };

      const docRef = await addDoc(collection(db, 'collections'), newCollection);
      return docRef.id;
    } catch (error) {
      console.error('Koleksiyon oluşturulurken hata:', error);
      throw error;
    }
  };

  const updateCollection = async (collectionId: string, updates: Partial<Collection>) => {
    if (!auth.currentUser) return;

    try {
      const docRef = doc(db, 'collections', collectionId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Koleksiyon güncellenirken hata:', error);
      throw error;
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!auth.currentUser) return;

    try {
      await deleteDoc(doc(db, 'collections', collectionId));

      // Koleksiyondaki notları da sil
      const notesQuery = query(
        collection(db, 'collectionNotes'),
        where('collectionId', '==', collectionId)
      );
      const snapshot = await getDocs(notesQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Koleksiyon silinirken hata:', error);
      throw error;
    }
  };

  const addNoteToCollection = async (collectionId: string, noteId: string) => {
    if (!auth.currentUser) return;

    try {
      // Önce notun zaten koleksiyonda olup olmadığını kontrol et
      const q = query(
        collection(db, 'collectionNotes'),
        where('collectionId', '==', collectionId),
        where('noteId', '==', noteId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(collection(db, 'collectionNotes'), {
          collectionId,
          noteId,
          userId: auth.currentUser.uid,
          addedAt: new Date().toISOString()
        });

        // Koleksiyondaki not sayısını güncelle
        const collectionRef = doc(db, 'collections', collectionId);
        await updateDoc(collectionRef, {
          noteCount: (collections.find(c => c.id === collectionId)?.noteCount || 0) + 1,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Not koleksiyona eklenirken hata:', error);
      throw error;
    }
  };

  const removeNoteFromCollection = async (collectionId: string, noteId: string) => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, 'collectionNotes'),
        where('collectionId', '==', collectionId),
        where('noteId', '==', noteId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);

        // Koleksiyondaki not sayısını güncelle
        const collectionRef = doc(db, 'collections', collectionId);
        await updateDoc(collectionRef, {
          noteCount: Math.max((collections.find(c => c.id === collectionId)?.noteCount || 1) - 1, 0),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Not koleksiyondan çıkarılırken hata:', error);
      throw error;
    }
  };

  const getCollectionNotes = async (collectionId: string) => {
    if (!auth.currentUser) return [];

    try {
      const q = query(
        collection(db, 'collectionNotes'),
        where('collectionId', '==', collectionId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CollectionNote));
    } catch (error) {
      console.error('Koleksiyon notları alınırken hata:', error);
      throw error;
    }
  };

  return {
    collections,
    loading,
    createCollection,
    updateCollection,
    deleteCollection,
    addNoteToCollection,
    removeNoteFromCollection,
    getCollectionNotes
  };
} 