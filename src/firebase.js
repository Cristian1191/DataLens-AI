
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import {
  getAI,
  GoogleAIBackend
} from "firebase/ai";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCfHEsz1wU65SzBRwCtp1mgi0Bj1sl5wE8",
  authDomain: "datalens-ai-73f03.firebaseapp.com",
  projectId: "datalens-ai-73f03",
  storageBucket: "datalens-ai-73f03.firebasestorage.app",
  messagingSenderId: "867707193924",
  appId: "1:867707193924:web:f37bf95062a54d0801ca11",
  measurementId: "G-W201WC1RDM"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Inicializar Analytics
export const analytics =
  typeof window !== "undefined"
    ? getAnalytics(app)
    : null;

// Inicializar Firebase AI Logic
export const ai = getAI(app, {
  backend: new GoogleAIBackend()
});
