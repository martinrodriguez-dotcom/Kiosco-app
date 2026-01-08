import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const authContext = createContext();

export const useAuth = () => {
  const context = useContext(authContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Intentando conectar con Firebase Auth..."); // <--- DIAGNÓSTICO

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Firebase respondió. Usuario:", currentUser); // <--- DIAGNÓSTICO
      
      setLoading(true);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole('cajero');
          }
          setUser(currentUser);
        } catch (error) {
          console.error("Error leyendo rol:", error); // <--- ERROR VISIBLE
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = () => {
    signOut(auth);
    setUser(null);
    setUserRole(null);
  };

  // SI ESTO SE MUESTRA, SIGNIFICA QUE FIREBASE ESTÁ PENSANDO
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <h1 className="text-2xl font-bold text-blue-800 animate-pulse">
          Conectando con el Kiosco...
        </h1>
      </div>
    );
  }

  return (
    <authContext.Provider value={{ user, userRole, logout, loading }}>
      {children}
    </authContext.Provider>
  );
};
