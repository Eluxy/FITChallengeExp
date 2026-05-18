import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
  onAuthStateChanged,
} from "firebase/auth";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getFirebaseAuth } from "@/src/config/firebase";

const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
];

type UserInfo = {
  email: string;
  name: string;
  photo?: string;
};

type AuthMethod = "google" | "email" | null;

type AuthContextType = {
  isConnected: boolean;
  userInfo: UserInfo | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  authMethod: AuthMethod;
  firebaseUser: FirebaseUser | null;

  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: GOOGLE_FIT_SCOPES,
      offlineAccess: true,
    });

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setUserInfo({
          email: user.email ?? "",
          name: user.displayName ?? user.email ?? "Пользователь",
          photo: user.photoURL ?? undefined,
        });
        setIsConnected(true);
      }
    });

    checkGoogleSignIn();

    return () => unsubscribe();
  }, []);

  const checkGoogleSignIn = useCallback(async () => {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        const user = (currentUser as any).user ?? currentUser;
        setUserInfo({
          email: user.email || "",
          name: user.name || user.email || "Пользователь",
          photo: user.photo || undefined,
        });

        const tokens = await GoogleSignin.getTokens();
        const token = tokens.accessToken;
        if (token) {
          setAccessToken(token);
          setIsConnected(true);
          setAuthMethod("google");
        }
      }
    } catch {
      // No user signed in
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();

      const user = signInResult.data?.user;
      if (user) {
        setUserInfo({
          email: user.email || "",
          name: user.name || user.email || "Пользователь",
          photo: user.photo || undefined,
        });
      }

      const tokens = await GoogleSignin.getTokens();
      const token = tokens.accessToken;

      if (!token) {
        setError("Не удалось получить токен доступа");
        setIsLoading(false);
        return;
      }

      setAccessToken(token);
      setIsConnected(true);
      setAuthMethod("google");
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации Google");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      setIsConnected(true);
      setAuthMethod("email");
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string, name: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setIsConnected(true);
      setAuthMethod("email");
      setUserInfo({
        email: result.user.email ?? email,
        name,
      });
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      setAccessToken(null);
      setUserInfo(null);
      setIsConnected(false);
      setAuthMethod(null);
    } catch (err) {
      console.log("Error signing out:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isConnected,
        userInfo,
        accessToken,
        isLoading,
        error,
        authMethod,
        firebaseUser,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        resetPassword,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function getFirebaseErrorMessage(code: string | undefined): string {
  switch (code) {
    case "auth/user-not-found":
      return "Пользователь с таким email не найден";
    case "auth/wrong-password":
      return "Неверный пароль";
    case "auth/email-already-in-use":
      return "Этот email уже используется";
    case "auth/weak-password":
      return "Пароль должен содержать минимум 6 символов";
    case "auth/invalid-email":
      return "Некорректный email";
    case "auth/invalid-credential":
      return "Неверный email или пароль";
    case "auth/too-many-requests":
      return "Слишком много попыток. Попробуйте позже";
    default:
      return "Произошла ошибка. Попробуйте снова";
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
