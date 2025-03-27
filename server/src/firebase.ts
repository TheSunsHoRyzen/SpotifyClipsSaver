// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6iBv1BRvC87qSxCHC6j-RGa8cFpbO6as",
  authDomain: "spotifyclipsaver.firebaseapp.com",
  projectId: "spotifyclipsaver",
  storageBucket: "spotifyclipsaver.firebasestorage.app",
  messagingSenderId: "433729723389",
  appId: "1:433729723389:web:c7c62410cddc8af9d51794",
  measurementId: "G-4CJXK3XM5R",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
