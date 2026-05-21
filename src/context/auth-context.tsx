import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";

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
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
    case "auth/network-request-failed":
      return "Ошибка сети. Проверьте подключение";
    case "auth/user-disabled":
      return "Аккаунт заблокирован";
    default:
      return "Произошла ошибка. Попробуйте снова";
  }
}

async function saveUserProfileToDb(user: FirebaseUser, name: string, photoUrl?: string | null) {
  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);

  const existingSnap = await getDoc(userRef);
  if (existingSnap.exists()) {
    return;
  }

  await setDoc(userRef, {
    name,
    email: user.email || null,
    photoUrl: photoUrl || null,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  }, { merge: true });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const isInitialized = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const syncUserInfo = useCallback((user: FirebaseUser, dbData?: any) => {
    const name = dbData?.name ?? user.displayName ?? user.email ?? "Пользователь";
    const photo = dbData?.photoUrl ?? user.photoURL ?? null;

    setUserInfo({
      email: user.email ?? "",
      name,
      photo: photo || undefined,
    });
    setIsConnected(true);
  }, []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: GOOGLE_FIT_SCOPES,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        if (!isInitialized.current) {
          isInitialized.current = true;

          try {
            const db = getFirebaseDb();
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const data = userSnap.data();
              syncUserInfo(user, data);

              await updateDoc(userRef, {
                lastActive: new Date().toISOString(),
              });
            } else {
              await saveUserProfileToDb(user, user.displayName ?? user.email ?? "Пользователь", user.photoURL);
              syncUserInfo(user);
            }
          } catch (err) {
            console.log("Error syncing user profile:", err);
            syncUserInfo(user);
          }
        } else {
          syncUserInfo(user);
        }
      } else {
        setIsConnected(false);
        setUserInfo(null);
        setAccessToken(null);
        setAuthMethod(null);
      }
    });

    return () => unsubscribe();
  }, [syncUserInfo]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();

      const signInResult = await GoogleSignin.signIn();

      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        setError("Не удалось получить idToken от Google");
        setIsLoading(false);
        return;
      }

      const tokens = await GoogleSignin.getTokens();
      const googleAccessToken = tokens.accessToken;

      const auth = getFirebaseAuth();
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);

      if (googleAccessToken) {
        setAccessToken(googleAccessToken);
      }

      setAuthMethod("google");

      await saveUserProfileToDb(
        result.user,
        result.user.displayName ?? result.user.email ?? "Пользователь",
        result.user.photoURL,
      );
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        setError("Вход отменён");
      } else {
        setError(err.message || "Ошибка авторизации Google");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);

    if (!isValidEmail(email)) {
      setError("Введите корректный email");
      return false;
    }
    if (!password.trim()) {
      setError("Введите пароль");
      return false;
    }

    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      setAuthMethod("email");
      return true;
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setError(null);

    if (!name.trim()) {
      setError("Введите имя");
      return false;
    }
    if (!isValidEmail(email)) {
      setError("Введите корректный email");
      return false;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return false;
    }

    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      const result = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(result.user, {
        displayName: name.trim(),
      });

      await saveUserProfileToDb(result.user, name.trim(), null);

      setAuthMethod("email");
      return true;
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);

    if (!isValidEmail(email)) {
      setError("Введите корректный email");
      return false;
    }

    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      return false;
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
      isInitialized.current = false;
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
