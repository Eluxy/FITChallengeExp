import { useAuth } from "@/src/context/auth-context";
import { useCallback, useState } from "react";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function useRegisterViewModel(onSuccess?: () => void) {
  const { registerWithEmail, isLoading, error, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = useCallback(async () => {
    clearError();
    setLocalError(null);

    if (!name.trim()) { setLocalError("Введите имя"); return; }
    if (!email.trim()) { setLocalError("Введите email"); return; }
    if (!isValidEmail(email)) { setLocalError("Введите корректный email"); return; }
    if (password.length < 6) { setLocalError("Пароль должен быть минимум 6 символов"); return; }
    if (password !== confirmPassword) { setLocalError("Пароли не совпадают"); return; }

    const success = await registerWithEmail(email.trim(), password, name.trim());
    if (success) {
      onSuccess?.();
    }
  }, [clearError, registerWithEmail, name, email, password, confirmPassword, onSuccess]);

  return {
    name, setName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    isLoading,
    error,
    localError,
    handleRegister,
  };
}
