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
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token in memory
let cachedAccessToken: string | null = null;

export const initAuthTokenListener = () => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
  });
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Firebase Auth Google Login Error:", error);
    throw error;
  }
};

export const getAccessToken = () => cachedAccessToken;

export const logoutUser = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error: any) {
    console.error("Firebase SignOut Error:", error);
    throw error;
  }
};
