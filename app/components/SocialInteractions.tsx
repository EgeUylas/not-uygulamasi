'use client';

import { useState } from 'react';
import { useSocialInteractions } from '../hooks/useSocialInteractions';

interface SocialInteractionsProps {
  noteId: string;
}

export default function SocialInteractions({ noteId }: SocialInteractionsProps) {
  const { comments, likes, isLiked, loading, addComment, deleteComment, toggleLike } = useSocialInteractions(noteId);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Yorum gönderilirken hata:', error);
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
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      {/* Beğeni ve Yorum Butonları */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => toggleLike()}
          className={`flex items-center gap-2 text-sm ${
            isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
          } hover:text-red-500 transition-colors duration-200`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isLiked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span>{likes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <span>{comments.length}</span>
        </button>
      </div>

      {/* Yorumlar Bölümü */}
      {showComments && (
        <div className="space-y-4">
          {/* Yorum Formu */}
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Yorumunuzu yazın..."
              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              Gönder
            </button>
          </form>

          {/* Yorumlar Listesi */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <img
                  src={comment.authorAvatar}
                  alt={comment.authorName}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.authorName}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 