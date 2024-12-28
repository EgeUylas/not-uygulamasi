import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAkyQ_dGPhiiutymc5uE34gZsTl_mfs3NQ",
  authDomain: "notuygulamas.firebaseapp.com",
  projectId: "notuygulamas",
  storageBucket: "notuygulamas.firebasestorage.app",
  messagingSenderId: "297165369928",
  appId: "1:297165369928:web:bba277db836cb55b981e7d",
  measurementId: "G-1VC6SRFN50"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Auth ve Firestore servislerini al
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 