import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";

export type UserInfo = {
  email: string;
  name: string;
  photo?: string;
};

export type AuthMethod = "google" | "email" | null;

const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
];

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
  if (existingSnap.exists()) return;

  await setDoc(userRef, {
    name,
    email: user.email || null,
    photoUrl: photoUrl || null,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  }, { merge: true });
}

export class AuthService {
  private auth = getFirebaseAuth();
  private db = getFirebaseDb();

  configureGoogleSignIn() {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: GOOGLE_FIT_SCOPES,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  async fetchUserProfile(userId: string): Promise<Record<string, any> | null> {
    const userRef = doc(this.db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, { lastActive: new Date().toISOString() });
      return userSnap.data();
    }
    return null;
  }

  async signInWithGoogle(): Promise<{
    success: boolean;
    user?: FirebaseUser;
    accessToken?: string;
    error?: string;
  }> {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();

      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        return { success: false, error: "Не удалось получить idToken от Google" };
      }

      const tokens = await GoogleSignin.getTokens();
      const googleAccessToken = tokens.accessToken;

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(this.auth, credential);

      await saveUserProfileToDb(
        result.user,
        result.user.displayName ?? result.user.email ?? "Пользователь",
        result.user.photoURL,
      );

      return { success: true, user: result.user, accessToken: googleAccessToken };
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: "Вход отменён" };
      }
      return { success: false, error: err.message || "Ошибка авторизации Google" };
    }
  }

  async signInWithEmail(email: string, password: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!isValidEmail(email)) {
      return { success: false, error: "Введите корректный email" };
    }
    if (!password.trim()) {
      return { success: false, error: "Введите пароль" };
    }

    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: getFirebaseErrorMessage(err.code) };
    }
  }

  async registerWithEmail(email: string, password: string, name: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!name.trim()) {
      return { success: false, error: "Введите имя" };
    }
    if (!isValidEmail(email)) {
      return { success: false, error: "Введите корректный email" };
    }
    if (password.length < 6) {
      return { success: false, error: "Пароль должен содержать минимум 6 символов" };
    }

    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(result.user, { displayName: name.trim() });
      await saveUserProfileToDb(result.user, name.trim(), null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: getFirebaseErrorMessage(err.code) };
    }
  }

  async resetPassword(email: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!isValidEmail(email)) {
      return { success: false, error: "Введите корректный email" };
    }

    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: getFirebaseErrorMessage(err.code) };
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      await firebaseSignOut(this.auth);
    } catch (err) {
      console.log("Error signing out:", err);
    }
  }
}
