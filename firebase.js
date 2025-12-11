// firebase.js

// ==================== IMPORTS ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ==================== CONFIG ====================
const firebaseConfig = {
  apiKey: "AIzaSyAZzVlGpwFJC54_UEOmmPCk8BhViBSahfo",
  authDomain: "bambuweb-8e65c.firebaseapp.com",
  projectId: "bambuweb-8e65c",
  storageBucket: "bambuweb-8e65c.firebasestorage.app",
  messagingSenderId: "1037146282776",
  appId: "1:1037146282776:web:b602b5cbf990615f0d9c6d",
  measurementId: "G-E908B8M180"
};


// ==================== INIT APP, DB, AUTH ====================
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);


// ==================== APP CHECK (OPSIONAL) ====================
// Ganti 'MASUKKAN_RECAPTCHA_SITE_KEY_ANDA_DI_SINI' dengan
// SITE KEY reCAPTCHA v3 milik project ini.
// Kalau belum punya / belum mau pakai App Check,
// sementara BISA DI-COMMENT seluruh blok ini.
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('MASUKKAN_RECAPTCHA_SITE_KEY_ANDA_DI_SINI'),
  isTokenAutoRefreshEnabled: true,
});


// ==================== EXPORT ====================
export {
  app,
  db,
  collection,
  addDoc,
  serverTimestamp,
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
};
