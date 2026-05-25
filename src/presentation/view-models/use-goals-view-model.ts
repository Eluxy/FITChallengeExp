import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import type { UserGoals } from "@/src/domain/entities/user-settings";
import { DEFAULT_GOALS } from "@/src/domain/entities/user-settings";

export function useGoalsViewModel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dailySteps, setDailySteps] = useState(String(DEFAULT_GOALS.dailySteps));
  const [dailyCalories, setDailyCalories] = useState(String(DEFAULT_GOALS.dailyCalories));
  const [dailyDistance, setDailyDistance] = useState(String(DEFAULT_GOALS.dailyDistanceKm));

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) { setIsLoading(false); return; }

      const db = getFirebaseDb();
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const goals = data.goals as UserGoals | undefined;
        if (goals) {
          setDailySteps(String(goals.dailySteps));
          setDailyCalories(String(goals.dailyCalories));
          setDailyDistance(String(goals.dailyDistanceKm));
        }
      }
    } catch (err) {
      console.log("Error loading goals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGoals = useCallback(async (): Promise<string | null> => {
    setIsSaving(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return "Пользователь не найден";

      const db = getFirebaseDb();
      const goals: UserGoals = {
        dailySteps: parseInt(dailySteps) || DEFAULT_GOALS.dailySteps,
        dailyCalories: parseInt(dailyCalories) || DEFAULT_GOALS.dailyCalories,
        dailyDistanceKm: parseFloat(dailyDistance) || DEFAULT_GOALS.dailyDistanceKm,
      };

      await setDoc(doc(db, "users", user.uid), { goals }, { merge: true });
      return null;
    } catch {
      return "Не удалось сохранить цели";
    } finally {
      setIsSaving(false);
    }
  }, [dailySteps, dailyCalories, dailyDistance]);

  return {
    isLoading,
    isSaving,
    dailySteps, setDailySteps,
    dailyCalories, setDailyCalories,
    dailyDistance, setDailyDistance,
    saveGoals,
  };
}
