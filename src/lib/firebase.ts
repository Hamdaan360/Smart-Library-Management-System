import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || 'AIzaSyB4w1anT4eXSAKcmBlNuekPfg2U4xr5_sU',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || 'gen-lang-client-0776789634.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || 'gen-lang-client-0776789634',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || 'gen-lang-client-0776789634.firebasestorage.app',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || '387059375481',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || '1:387059375481:web:2b140419324a0bb51623a8',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the provisioned database ID or default
const databaseId =
  import.meta.env?.VITE_FIRESTORE_DATABASE_ID ||
  firebaseConfigData.firestoreDatabaseId ||
  'ai-studio-smartlibrarymana-9ad1d61d-eaf4-4c36-92c8-1bfb7f0caeb5';
export const db = getFirestore(app, databaseId);

export default app;
