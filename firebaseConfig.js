import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPSJRGCE96mnKyAAvNdWH--If2lZKzG2E",
  authDomain: "week1labs.firebaseapp.com",
  projectId: "week1labs",
  storageBucket: "week1labs.firebasestorage.app",
  messagingSenderId: "93541425435",
  appId: "1:93541425435:web:09542f6f422a6a2147b3be"
};

// Check if an app instance already exists to prevent Fast Refresh crashes
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);

// Guard initializeAuth against duplicate calls during hot reload
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };