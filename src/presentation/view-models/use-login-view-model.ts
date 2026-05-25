import { useAuth } from "@/src/context/auth-context";
import { useCallback, useEffect, useState } from "react";

export function useLoginViewModel(onConnected?: () => void) {
  const { signInWithEmail, signInWithGoogle, isLoading, error, clearError, isConnected } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isConnected) {
      onConnected?.();
    }
  }, [isConnected, onConnected]);

  const handleEmailLogin = useCallback(async () => {
    clearError();
    await signInWithEmail(email.trim(), password);
  }, [clearError, signInWithEmail, email, password]);

  const handleGoogleLogin = useCallback(async () => {
    clearError();
    await signInWithGoogle();
  }, [clearError, signInWithGoogle]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleEmailLogin,
    handleGoogleLogin,
  };
}
