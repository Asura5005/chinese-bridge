'use client'
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const newProfile = {
          uid: currentUser.uid,
          name: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          xp: 0,
          streak: 0,
          hskLevel: 1,
          role: currentUser.email === 'aslanjumaboev007@gmail.com' ? 'admin' : 'student',
          joinDate: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserData(newProfile);
      }
    } catch (error) {
      console.error("Ошибка при входе:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = user?.email === 'aslanjumaboev007@gmail.com';

  return (
    <AuthContext.Provider value={{ user, userData, isAdmin, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);