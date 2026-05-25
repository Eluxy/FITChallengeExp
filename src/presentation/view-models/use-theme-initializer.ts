import { useAuth } from "@/src/context/auth-context";
import { getFirebaseDb } from "@/src/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Appearance, type ColorSchemeName } from "react-native";

export function useThemeInitializer() {
  const { firebaseUser } = useAuth();
  const [themeOverride, setThemeOverride] = useState<ColorSchemeName | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setThemeOverride(null);
      Appearance.setColorScheme(null);
      return;
    }

    const loadTheme = async () => {
      try {
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!snap.exists()) return;

        const data = snap.data();
        if (data.theme === "light" || data.theme === "dark") {
          setThemeOverride(data.theme);
          Appearance.setColorScheme(data.theme);
        } else {
          setThemeOverride(null);
          Appearance.setColorScheme(null);
        }
      } catch {
        // keep current
      }
    };

    loadTheme();
  }, [firebaseUser]);

  return themeOverride;
}
