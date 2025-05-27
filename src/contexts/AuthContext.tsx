import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  sendEmailLink: (email: string) => Promise<void>;
  completeSignInWithEmailLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Action code settings for email link sign-in
  const actionCodeSettings = {
    // URL you want to redirect back to after sign-in
    url: window.location.origin + '/finishSignIn',
    // This must be true for email link sign-in
    handleCodeInApp: true
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Send email link for passwordless sign-in
  const sendEmailLink = async (email: string) => {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save the email locally to use it later when completing sign-in
    window.localStorage.setItem('emailForSignIn', email);
  };

  // Complete sign-in with email link
  const completeSignInWithEmailLink = async (email: string) => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      try {
        await signInWithEmailLink(auth, email, window.location.href);
        // Clear email from storage
        window.localStorage.removeItem('emailForSignIn');
      } catch (error) {
        console.error('Error completing sign-in with email link:', error);
        throw error;
      }
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    loading,
    signUp,
    login,
    sendEmailLink,
    completeSignInWithEmailLink,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 