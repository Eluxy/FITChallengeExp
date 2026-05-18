import { useAuth } from "@/src/context/auth-context";
import { upsertDailyProgress } from "@/src/data/firebase/firestore-rest";
import { fetchGoogleFitSummary } from "@/src/data/google-fit/fetch-google-fit-summary";
import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { DashboardStats } from "@/src/domain/entities/dashboard";
import type { UserGoals } from "@/src/domain/entities/user-settings";
import { DEFAULT_GOALS } from "@/src/domain/entities/user-settings";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_STATS: DashboardStats = {
  progressPercent: 0,
  stepsPercent: 0,
  caloriesPercent: 0,
};

const SAVE_INTERVAL_MS = 2 * 60 * 1000;

function getDayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return {
    startTimeMillis: start.getTime(),
    endTimeMillis: end.getTime(),
    dateIso: start.toISOString().slice(0, 10),
  };
}

export function useGoogleFitData() {
  const { isConnected, accessToken, userInfo } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [distance, setDistance] = useState<number | undefined>();
  const [heartRate, setHeartRate] = useState<number | undefined>();
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressUserId = userInfo?.email?.replace(/[@.]/g, "_") ?? "guest";
  const displayName = userInfo?.name ?? "Гость";

  useEffect(() => {
    loadUserGoals();
  }, [isConnected]);

  const loadUserGoals = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirebaseDb();
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userGoals = docSnap.data().goals as UserGoals | undefined;
        if (userGoals) {
          setGoals(userGoals);
        }
      }
    } catch {
      // Keep defaults
    }
  }, []);

  const mapSummaryToStats = useCallback(
    (nextSteps: number, nextCalories: number) => {
      const stepsPercent = Math.min(Math.round((nextSteps / goals.dailySteps) * 100), 100);
      const caloriesPercent = Math.min(Math.round((nextCalories / goals.dailyCalories) * 100), 100);
      const progressPercent = Math.min(
        Math.round(stepsPercent * 0.7 + caloriesPercent * 0.3),
        100,
      );
      return { stepsPercent, caloriesPercent, progressPercent };
    },
    [goals],
  );

  const saveTodayProgress = useCallback(
    async (nextSteps: number, nextCalories: number, nextProgressPercent: number) => {
      const { dateIso } = getDayRange();
      const documentId = `${progressUserId}_${dateIso}`;
      await upsertDailyProgress({
        documentId,
        userId: progressUserId,
        displayName,
        date: dateIso,
        steps: nextSteps,
        calories: nextCalories,
        progressPercent: nextProgressPercent,
      });
    },
    [progressUserId, displayName],
  );

  const loadTodayStats = useCallback(
    async (token: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const range = getDayRange();
        const summary = await fetchGoogleFitSummary({
          accessToken: token,
          startTimeMillis: range.startTimeMillis,
          endTimeMillis: range.endTimeMillis,
        });

        const nextStats = mapSummaryToStats(summary.steps, summary.calories);
        setSteps(summary.steps);
        setCalories(summary.calories);
        setDistance(summary.distanceMeters);
        setHeartRate(summary.heartRate);
        setStats(nextStats);

        await saveTodayProgress(summary.steps, summary.calories, nextStats.progressPercent);
      } catch (err: any) {
        setError("Не удалось загрузить данные из Google Fit");
      } finally {
        setIsLoading(false);
      }
    },
    [mapSummaryToStats, saveTodayProgress],
  );

  useEffect(() => {
    if (isConnected && accessToken) {
      loadTodayStats(accessToken);
    }
  }, [isConnected, accessToken]);

  useEffect(() => {
    if (!isConnected || !accessToken) return;
    const interval = setInterval(() => {
      loadTodayStats(accessToken);
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isConnected, accessToken, loadTodayStats]);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    await loadTodayStats(accessToken);
  }, [accessToken, loadTodayStats]);

  return {
    stats,
    steps,
    calories,
    distance,
    heartRate,
    goals,
    isLoading,
    error,
    refresh,
  };
}
