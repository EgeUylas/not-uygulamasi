'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';

const AVATARS = [
  '/avatars/avatar1.svg',
  '/avatars/avatar2.svg',
  '/avatars/avatar3.svg',
  '/avatars/avatar4.svg',
  '/avatars/avatar5.svg',
];

export default function Profile({ onClose }: { onClose: () => void }) {
  const { profile, loading, error, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    bio: '',
    avatar: '/avatars/avatar1.svg',
  });

  // Initialize editedProfile when profile data is loaded
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        name: profile.name || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '/avatars/avatar1.svg',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      const updatedProfile = {
        name: editedProfile.name || 'İsimsiz Kullanıcı',
        bio: editedProfile.bio || '',
        avatar: editedProfile.avatar || '/avatars/avatar1.svg',
      };
      await updateProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md animate-slide-up">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-pulse w-4 h-4 bg-indigo-500 rounded-full"></div>
            <div className="animate-pulse w-4 h-4 bg-indigo-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
            <div className="animate-pulse w-4 h-4 bg-indigo-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
          <p className="text-red-500">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md relative animate-slide-up max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profil</h2>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Avatar Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avatar
              </label>
              <div className="grid grid-cols-5 gap-4">
                {AVATARS.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => isEditing && setEditedProfile(prev => ({ ...prev, avatar }))}
                    className={`relative rounded-full overflow-hidden aspect-square transition-all duration-200 ${
                      editedProfile.avatar === avatar ? 'ring-2 ring-indigo-500 scale-110' : ''
                    } ${!isEditing ? 'cursor-default opacity-75' : 'hover:opacity-80 hover:scale-105'}`}
                  >
                    <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* İsim */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                İsim
              </label>
              <input
                type="text"
                id="name"
                value={editedProfile.name || ''}
                onChange={(e) => isEditing && setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-75 disabled:bg-gray-100 dark:disabled:bg-gray-700 transition-colors duration-200"
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hakkımda
              </label>
              <textarea
                id="bio"
                value={editedProfile.bio || ''}
                onChange={(e) => isEditing && setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!isEditing}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-75 disabled:bg-gray-100 dark:disabled:bg-gray-700 resize-none transition-colors duration-200"
                placeholder={isEditing ? 'Kendinizden bahsedin...' : ''}
              />
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <span className="block text-sm text-gray-500 dark:text-gray-400">Toplam Not</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profile.totalNotes || 0}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-sm text-gray-500 dark:text-gray-400">Katılım</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Belirtilmemiş'}
                </span>
              </div>
            </div>

            {/* Rozetler */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Rozetler</h3>
              {profile.badges && profile.badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {profile.badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-2xl mr-3" role="img" aria-label={badge.name}>
                        {badge.icon}
                      </span>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {badge.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {badge.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(badge.earnedAt!).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Henüz rozet kazanılmadı. Not ekleyerek ve uygulamayı kullanarak rozetler kazanabilirsiniz!
                </p>
              )}
            </div>

            {/* Aktif Günler */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktif Günler</h3>
                <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  {profile.activeDays || 0}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Son giriş: {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
              </p>
            </div>
          </div>
        </div>

        {/* Butonlar - Her zaman altta sabit kalacak */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile({
                      name: profile.name,
                      bio: profile.bio,
                      avatar: profile.avatar,
                    });
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                >
                  Kaydet
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
              >
                Düzenle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 