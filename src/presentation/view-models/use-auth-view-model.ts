import { useCallback, useEffect, useRef, useState } from "react";
import { AuthService, type AuthMethod, type UserInfo } from "@/src/domain/services/auth-service";

const authService = new AuthService();

export function useAuthViewModel() {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isInitialized = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const syncUserInfo = useCallback((user: any, dbData?: any) => {
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
    authService.configureGoogleSignIn();

    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);

      if (user) {
        if (!isInitialized.current) {
          isInitialized.current = true;

          try {
            const data = await authService.fetchUserProfile(user.uid);
            if (data) {
              syncUserInfo(user, data);
            } else {
              syncUserInfo(user);
            }
          } catch {
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

    const result = await authService.signInWithGoogle();
    if (result.success && result.user) {
      setFirebaseUser(result.user);
      if (result.accessToken) setAccessToken(result.accessToken);
      setAuthMethod("google");
    } else if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    const result = await authService.signInWithEmail(email, password);
    if (result.success) {
      setAuthMethod("email");
    } else if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
    return result.success;
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    const result = await authService.registerWithEmail(email, password, name);
    if (result.success) {
      setAuthMethod("email");
    } else if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
    return result.success;
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    const result = await authService.resetPassword(email);
    if (!result.success && result.error) {
      setError(result.error);
    }

    setIsLoading(false);
    return result.success;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setAccessToken(null);
    setUserInfo(null);
    setIsConnected(false);
    setAuthMethod(null);
    isInitialized.current = false;
  }, []);

  return {
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
  };
}
