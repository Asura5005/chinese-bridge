// lib/useWords.js
import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export function useWords() {
  const[words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "words"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWords(data);
      setLoading(false);
    });
    return () => unsubscribe();
  },[]);

  return { words, loading };
}