import React, { createContext, useContext } from "react";
import { useAuthViewModel } from "@/src/presentation/view-models/use-auth-view-model";

type AuthContextType = {
  isConnected: boolean;
  userInfo: { email: string; name: string; photo?: string } | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  authMethod: "google" | "email" | null;
  firebaseUser: any;

  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const viewModel = useAuthViewModel();

  return (
    <AuthContext.Provider value={viewModel}>
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
