import { useCallback, useEffect, useMemo, useState } from "react";

import { upsertDailyProgress } from "@/src/data/firebase/firestore-rest";
import { fetchGoogleFitSummary } from "@/src/data/google-fit/fetch-google-fit-summary";
import type { DashboardStats } from "@/src/domain/entities/dashboard";

const DEFAULT_STATS: DashboardStats = {
  progressPercent: 0,
  stepsPercent: 0,
  caloriesPercent: 0,
};

const GOAL_STEPS = 10000;
const GOAL_CALORIES = 2000;
const SAVE_INTERVAL_MS = 10 * 60 * 1000;
const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
];

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

export function useMainPageViewModel() {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const progressUserId = useMemo(
    () => process.env.EXPO_PUBLIC_PROGRESS_USER_ID ?? "guest",
    [],
  );

  const connectGoogleFit = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const tokens = await GoogleSignin.getTokens();
      const token = tokens.accessToken;

      if (!token) {
        setError("Не удалось получить токен доступа");
        setIsLoading(false);
        return;
      }

      setAccessToken(token);
      await loadTodayStats(token);
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации Google");
      setIsLoading(false);
    }
  }, []);

  const saveTodayProgress = useCallback(
    async (nextSteps: number, nextCalories: number, nextProgressPercent: number) => {
      const { dateIso } = getDayRange();
      const documentId = `${progressUserId}_${dateIso}`;

      await upsertDailyProgress({
        documentId,
        userId: progressUserId,
        displayName: process.env.EXPO_PUBLIC_PROGRESS_DISPLAY_NAME ?? "Гость",
        date: dateIso,
        steps: nextSteps,
        calories: nextCalories,
        progressPercent: nextProgressPercent,
      });
    },
    [progressUserId],
  );

  const mapSummaryToStats = useCallback((nextSteps: number, nextCalories: number) => {
    const stepsPercent = Math.min(Math.round((nextSteps / GOAL_STEPS) * 100), 100);
    const caloriesPercent = Math.min(Math.round((nextCalories / GOAL_CALORIES) * 100), 100);
    const progressPercent = Math.min(
      Math.round(stepsPercent * 0.7 + caloriesPercent * 0.3),
      100,
    );

    return { stepsPercent, caloriesPercent, progressPercent };
  }, []);

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
        setStats(nextStats);
        await saveTodayProgress(summary.steps, summary.calories, nextStats.progressPercent);
      } catch {
        setError("Не удалось загрузить данные из Google Fit");
      } finally {
        setIsLoading(false);
      }
    },
    [mapSummaryToStats, saveTodayProgress],
  );

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: GOOGLE_FIT_SCOPES,
      offlineAccess: true,
    });
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const interval = setInterval(() => {
      void loadTodayStats(accessToken);
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [accessToken, loadTodayStats]);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    await loadTodayStats(accessToken);
  }, [accessToken, loadTodayStats]);

  return {
    stats,
    steps,
    calories,
    isLoading,
    error,
    isConnected: Boolean(accessToken),
    connectGoogleFit,
    refresh,
  };
}
