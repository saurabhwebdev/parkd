// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhZpdh1VlmeytAHOiXv_Ltmg_mfgXTte0",
  authDomain: "parkd-5ca81.firebaseapp.com",
  projectId: "parkd-5ca81",
  storageBucket: "parkd-5ca81.firebasestorage.app",
  messagingSenderId: "830317608453",
  appId: "1:830317608453:web:d1e29a3b8d5f8c7e9e266c",
  measurementId: "G-1YPZQFD23N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db }; 