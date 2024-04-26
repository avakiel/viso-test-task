import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_DB_KEY,
  authDomain: "map-test-task-5dda0.firebaseapp.com",
  databaseURL: "https://map-test-task-5dda0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "map-test-task-5dda0",
  storageBucket: "map-test-task-5dda0.appspot.com",
  messagingSenderId: "229879411433",
  appId: "1:229879411433:web:eff96d34b6993a719c7678"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);