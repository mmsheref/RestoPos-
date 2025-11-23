// FIX: Use a named import for `initializeApp` as required by the Firebase v9+ modular SDK.
import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  collection, 
  doc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

// =================================================================================
// 🔥 PASTE YOUR FIREBASE CONFIGURATION HERE 🔥
//
// You can get this from the Firebase Console:
// 1. Go to your project's settings.
// 2. In the "General" tab, scroll down to "Your apps".
// 3. Select the web app you're using.
// 4. Under "Firebase SDK snippet", choose "Config" and copy the object.
// =================================================================================
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with robust offline persistence, replacing getFirestore() and enableIndexedDbPersistence().
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// --- Authentication ---
// A memoized promise to ensure we only try to authenticate once per session load, preventing race conditions.
let authPromise: Promise<User>;

const getAuthUser = (): Promise<User> => {
    if (!authPromise) {
        authPromise = new Promise((resolve, reject) => {
            // Use onAuthStateChanged to get the current user. It resolves immediately if user is already signed in.
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                unsubscribe(); // We only need the initial state, so we unsubscribe to prevent memory leaks.
                if (user) {
                    resolve(user);
                } else {
                    // If no user, sign in anonymously.
                    try {
                        const userCredential = await signInAnonymously(auth);
                        resolve(userCredential.user);
                    } catch (error) {
                        console.error("Anonymous sign-in failed", error);
                        reject(error); // Reject the promise if sign-in fails.
                    }
                }
            }, reject); // Pass reject to handle any initial auth errors.
        });
    }
    return authPromise;
}
export const ensureAuthenticated = getAuthUser;


// --- Data Operations ---
// For simplicity, we'll operate on a single "restaurant" entity.
export const RESTAURANT_ID = 'main_restaurant'; 

export const clearAllData = async () => {
    // Ensure user is authenticated before performing a destructive action.
    await ensureAuthenticated();
    
    const collections = ['items', 'receipts', 'printers', 'saved_tickets', 'custom_grids', 'config'];
    const batch = writeBatch(db);
    
    for (const coll of collections) {
        const collRef = collection(db, 'restaurants', RESTAURANT_ID, coll);
        const snapshot = await getDocs(collRef);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }
    
    await batch.commit();
}


export { db, auth };