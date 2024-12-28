'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, query, where, orderBy, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: Timestamp;
}

interface CommentsProps {
  noteId: string;
}

export default function Comments({ noteId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('noteId', '==', noteId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      setComments(commentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [noteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'comments'), {
        noteId,
        content: newComment,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        createdAt: Timestamp.now()
      });
      setNewComment('');
    } catch (error) {
      console.error('Yorum eklenirken hata oluştu:', error);
      alert('Yorum eklenirken bir hata oluştu!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Yorumlar ({comments.length})
      </h2>

      {auth.currentUser ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Yorumunuzu yazın..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Gönder
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Yorum yapmak için giriş yapmalısınız.
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {comment.userName}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {format(comment.createdAt.toDate(), 'dd MMM yyyy HH:mm', { locale: tr })}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Henüz yorum yapılmamış.
          </p>
        )}
      </div>
    </div>
  );
} 