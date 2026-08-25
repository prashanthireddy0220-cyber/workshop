import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDb8iQiQ-42WT0hpc2RSoRvjdbC_w1Tjuw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'workshop-3a4e6.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'workshop-3a4e6',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'workshop-3a4e6.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '878212566358',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:878212566358:web:ab7bad45173677aa4a9af7'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Set custom parameters for Google Auth Account Chooser & Domain Restriction
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: 'klu.ac.in'
});

/**
 * Executes Google Sign-In with Firebase Authentication Popup
 * 1. Opens Google Account Chooser popup
 * 2. Fetches user profile (displayName, email, photoURL)
 * 3. Enforces @klu.ac.in domain restriction
 */
export const signInWithGoogleFirebase = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const googleIdToken = credential?.idToken;
    const firebaseUser = result.user;

    const email = firebaseUser.email ? firebaseUser.email.toLowerCase().trim() : '';

    // Enforce @klu.ac.in domain validation
    if (!email.endsWith('@klu.ac.in')) {
      await signOut(auth);
      throw new Error('Please sign in using your KLU (@klu.ac.in) Google account.');
    }

    const firebaseIdToken = await firebaseUser.getIdToken();

    return {
      firebaseUser: {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || email.split('@')[0],
        name: firebaseUser.displayName || email.split('@')[0],
        email: email,
        photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        profilePhoto: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      },
      idToken: googleIdToken || firebaseIdToken
    };
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Your browser blocked the Google sign-in popup. Please allow popups for this site or use the direct KLU Email sign-in option below.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      throw new Error(`Domain "${currentHost}" is not authorized in Firebase. Please add "${currentHost}" and "vercel.app" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled.');
    }
    if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key-not-valid')) {
      throw new Error('Firebase API Key is missing or invalid in frontend/.env.');
    }
    throw error;
  }
};

export { auth, googleProvider };
