'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

interface ProfileData {
  name: string;
  bio: string;
  avatar: string;
  totalNotes?: number;
  joinDate?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  activeDays?: number;
  badges?: Badge[];
  preferences?: {
    themeColor?: string;
    fontSize?: 'small' | 'medium' | 'large';
  };
}

const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'new_user',
    name: 'Yeni Başlayan',
    description: 'Uygulamaya hoş geldiniz!',
    icon: '🌟',
  },
  {
    id: 'note_master',
    name: 'Not Ustası',
    description: '10 not oluşturuldu',
    icon: '📝',
  },
  {
    id: 'active_user',
    name: 'Aktif Kullanıcı',
    description: '7 gün boyunca aktif',
    icon: '🔥',
  },
  {
    id: 'sharing_expert',
    name: 'Paylaşım Uzmanı',
    description: '5 not paylaşıldı',
    icon: '🌐',
  },
];

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rozet kontrol fonksiyonu
  const checkAndUpdateBadges = useCallback(async (currentProfile: ProfileData) => {
    const newBadges: Badge[] = [...(currentProfile.badges || [])];
    let badgesUpdated = false;

    // Yeni Başlayan rozetini kontrol et
    if (!newBadges.some(b => b.id === 'new_user')) {
      newBadges.push({
        ...AVAILABLE_BADGES.find(b => b.id === 'new_user')!,
        earnedAt: new Date().toISOString(),
      });
      badgesUpdated = true;
    }

    // Not Ustası rozetini kontrol et
    if (currentProfile.totalNotes && currentProfile.totalNotes >= 10 &&
        !newBadges.some(b => b.id === 'note_master')) {
      newBadges.push({
        ...AVAILABLE_BADGES.find(b => b.id === 'note_master')!,
        earnedAt: new Date().toISOString(),
      });
      badgesUpdated = true;
    }

    // Aktif Kullanıcı rozetini kontrol et
    if (currentProfile.activeDays && currentProfile.activeDays >= 7 &&
        !newBadges.some(b => b.id === 'active_user')) {
      newBadges.push({
        ...AVAILABLE_BADGES.find(b => b.id === 'active_user')!,
        earnedAt: new Date().toISOString(),
      });
      badgesUpdated = true;
    }

    if (badgesUpdated && auth.currentUser) {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { badges: newBadges });
    }
  }, []);

  // Aktif gün sayısını güncelle
  const updateActiveDays = useCallback(async (currentProfile: ProfileData) => {
    if (!auth.currentUser) return;

    const now = new Date();
    const lastLogin = currentProfile.lastLoginAt ? new Date(currentProfile.lastLoginAt) : null;
    
    // Eğer son giriş bugün değilse aktif gün sayısını artır
    if (!lastLogin || lastLogin.toDateString() !== now.toDateString()) {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        activeDays: (currentProfile.activeDays || 0) + 1,
        lastLoginAt: now.toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(docRef, 
      async (docSnap) => {
        try {
          const now = new Date().toISOString();

          if (docSnap.exists()) {
            const data = docSnap.data();
            const profileData = {
              ...data as ProfileData,
              name: data.name || auth.currentUser?.displayName || 'İsimsiz Kullanıcı',
              avatar: data.avatar || '/avatars/avatar1.svg',
              joinDate: data.joinDate || now,
              bio: data.bio || '',
              totalNotes: data.totalNotes || 0,
              updatedAt: data.updatedAt || now,
              lastLoginAt: data.lastLoginAt || now,
              activeDays: data.activeDays || 1,
              badges: data.badges || [],
              preferences: data.preferences || {},
            };
            
            setProfile(profileData);
            await updateActiveDays(profileData);
            await checkAndUpdateBadges(profileData);
          } else {
            const initialProfile: ProfileData = {
              name: auth.currentUser?.displayName || 'İsimsiz Kullanıcı',
              bio: '',
              avatar: '/avatars/avatar1.svg',
              joinDate: now,
              totalNotes: 0,
              updatedAt: now,
              lastLoginAt: now,
              activeDays: 1,
              badges: [],
              preferences: {},
            };
            await setDoc(docRef, initialProfile);
            setProfile(initialProfile);
            await checkAndUpdateBadges(initialProfile);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Profil yüklenirken bir hata oluştu');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [checkAndUpdateBadges, updateActiveDays]);

  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const docRef = doc(db, 'users', auth.currentUser.uid);
      
      const docSnap = await getDoc(docRef);
      const now = new Date().toISOString();
      
      if (!docSnap.exists()) {
        const initialProfile: ProfileData = {
          name: updates.name || auth.currentUser.displayName || 'İsimsiz Kullanıcı',
          bio: updates.bio || '',
          avatar: updates.avatar || '/avatars/avatar1.svg',
          joinDate: now,
          totalNotes: 0,
          updatedAt: now,
          lastLoginAt: now,
          activeDays: 1,
          badges: [],
          preferences: {},
        };
        await setDoc(docRef, initialProfile);
      } else {
        const updatedData = {
          ...updates,
          updatedAt: now,
          lastLoginAt: now,
          activeDays: 1,
          badges: [],
          preferences: {},
        };
        await updateDoc(docRef, updatedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTotalNotes = useCallback(async (count: number) => {
    if (!auth.currentUser) return;

    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      const now = new Date().toISOString();

      if (!docSnap.exists()) {
        const initialProfile: ProfileData = {
          name: auth.currentUser.displayName || 'İsimsiz Kullanıcı',
          bio: '',
          avatar: '/avatars/avatar1.svg',
          joinDate: now,
          totalNotes: count,
          updatedAt: now,
          lastLoginAt: now,
          activeDays: 1,
          badges: [],
          preferences: {},
        };
        await setDoc(docRef, initialProfile);
      } else {
        await updateDoc(docRef, {
          totalNotes: count,
          updatedAt: now,
          lastLoginAt: now,
          activeDays: 1,
          badges: [],
          preferences: {},
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not sayısı güncellenirken bir hata oluştu');
      throw err;
    }
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateTotalNotes,
    AVAILABLE_BADGES,
  };
} 