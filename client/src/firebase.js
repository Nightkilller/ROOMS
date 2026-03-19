import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "rooms-c80a3.firebaseapp.com",
  projectId: "rooms-c80a3",
  storageBucket: "rooms-c80a3.firebasestorage.app",
  messagingSenderId: "94781643158",
  appId: "1:94781643158:web:c8717f1fba866afcbde5b7",
  measurementId: "G-DTR69TNQH4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
