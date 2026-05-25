import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Appearance } from "react-native";
import { useCallback, useEffect, useState } from "react";

export type ThemeOption = "system" | "light" | "dark";

export function useThemeViewModel() {
  const [selected, setSelected] = useState<ThemeOption>("system");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const theme = snap.data().theme as ThemeOption | undefined;
          if (theme === "light" || theme === "dark") {
            setSelected(theme);
          }
        }
      } catch {
        // keep default
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  const handleSelect = useCallback(async (option: ThemeOption) => {
    setSelected(option);

    if (option === "system") {
      Appearance.setColorScheme(null);
    } else {
      Appearance.setColorScheme(option);
    }

    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
      const db = getFirebaseDb();
      await setDoc(doc(db, "users", user.uid), { theme: option }, { merge: true });
    }
  }, []);

  return {
    selected,
    isLoading,
    handleSelect,
  };
}
