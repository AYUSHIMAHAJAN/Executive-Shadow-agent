import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  collection,
  onSnapshot
} from "firebase/firestore";
import config from "../../firebase-applet-config.json";

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app, (config as any).firestoreDatabaseId);

// Authentication helper structures
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const initAuthTokenListener = () => {
  // Not needed anymore since we don't cache tokens
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (error: any) {
    console.error("Firebase Auth Google Login Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Firebase SignOut Error:", error);
    throw error;
  }
};
