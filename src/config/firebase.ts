import { getApps, getApp, initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCIs5XqMVs5gEvoWhNtaBhy-QJDD23m1fU',
  authDomain: 'azius-6acb5.firebaseapp.com',
  projectId: 'azius-6acb5',
  storageBucket: 'azius-6acb5.firebasestorage.app',
  messagingSenderId: '1063696631700',
  appId: '1:1063696631700:web:7ed11f06cbd65851493181',
  measurementId: 'G-SHVLGQXM3W',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
