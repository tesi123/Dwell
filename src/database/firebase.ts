import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: use vault
// https://developer.hashicorp.com/vault/install
// also since this is pushed to git with exposed keys, regenerate all

const firebaseConfig = {
  apiKey: "AIzaSyA3RFB3jI3QsiD8mEGJiInv3NtA75A48oU",
  authDomain: "dwell-79652.firebaseapp.com",
  projectId: "dwell-79652",
  storageBucket: "dwell-79652.firebasestorage.app",
  messagingSenderId: "263133206157",
  appId: "1:263133206157:web:b08c05913dca82d979b4c4",
  measurementId: "G-TQLFJHT3D0",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
