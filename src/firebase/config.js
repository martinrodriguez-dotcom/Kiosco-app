// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Base de datos
import { getAuth } from "firebase/auth";           // Autenticación (Login)

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfniZVLGzatksiK1qBeO259XqpY46PbX0",
  authDomain: "kiosco-app-79b58.firebaseapp.com",
  projectId: "kiosco-app-79b58",
  storageBucket: "kiosco-app-79b58.firebasestorage.app",
  messagingSenderId: "610299820416",
  appId: "1:610299820416:web:a643e728ba5ee6d7a7e965"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializamos y exportamos los servicios que usaremos en la app
export const db = getFirestore(app);
export const auth = getAuth(app);
