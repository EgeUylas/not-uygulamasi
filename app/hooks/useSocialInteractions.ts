'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';

interface Comment {
  id: string;
  noteId: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

interface Like {
  id: string;
  noteId: string;
  userId: string;
}

export function useSocialInteractions(noteId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Yorumları dinle
    const commentsQuery = query(
      collection(db, 'comments'),
      where('noteId', '==', noteId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      setComments(commentsData);
    });

    // Beğenileri dinle
    const likesQuery = query(
      collection(db, 'likes'),
      where('noteId', '==', noteId)
    );

    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
      const likesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Like));
      setLikes(likesData);
      setIsLiked(likesData.some(like => like.userId === auth.currentUser?.uid));
      setLoading(false);
    });

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [noteId]);

  const addComment = async (content: string) => {
    if (!auth.currentUser) return;

    try {
      const comment = {
        noteId,
        userId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'İsimsiz Kullanıcı',
        authorAvatar: '/avatars/avatar1.svg',
        content,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'comments'), comment);
    } catch (error) {
      console.error('Yorum eklenirken hata:', error);
      throw error;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!auth.currentUser) return;

    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error('Yorum silinirken hata:', error);
      throw error;
    }
  };

  const toggleLike = async () => {
    if (!auth.currentUser) return;

    try {
      const likesQuery = query(
        collection(db, 'likes'),
        where('noteId', '==', noteId),
        where('userId', '==', auth.currentUser.uid)
      );

      const snapshot = await getDocs(likesQuery);

      if (snapshot.empty) {
        // Beğeni ekle
        await addDoc(collection(db, 'likes'), {
          noteId,
          userId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
      } else {
        // Beğeniyi kaldır
        await deleteDoc(doc(db, 'likes', snapshot.docs[0].id));
      }
    } catch (error) {
      console.error('Beğeni işlemi sırasında hata:', error);
      throw error;
    }
  };

  return {
    comments,
    likes: likes.length,
    isLiked,
    loading,
    addComment,
    deleteComment,
    toggleLike
  };
} 