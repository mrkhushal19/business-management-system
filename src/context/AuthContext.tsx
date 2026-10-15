import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  operatorName: string;
  operatorEmail: string;
  setOperatorName: (name: string) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  operatorName: 'Elena Rostova (Lead Ops)',
  operatorEmail: 'elena@omniflow.io',
  setOperatorName: () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [operatorName, setOperatorName] = useState<string>('Elena Rostova (Lead Ops)');
  const [operatorEmail, setOperatorEmail] = useState<string>('elena@omniflow.io');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) {
        setOperatorName(currentUser.displayName);
        setOperatorEmail(currentUser.email || '');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user.displayName) {
        setOperatorName(result.user.displayName);
        setOperatorEmail(result.user.email || '');
      }
    } catch (err: unknown) {
      console.error('Google Sign In error:', err);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setOperatorName('Guest Operations Analyst');
      setOperatorEmail('guest@omniflow.io');
    } catch (err: unknown) {
      console.error('Sign Out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        operatorName,
        operatorEmail,
        setOperatorName,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
