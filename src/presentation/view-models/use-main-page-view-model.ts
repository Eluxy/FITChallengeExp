import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useCallback, useEffect, useMemo, useState } from "react";

import { upsertDailyProgress } from "@/src/data/firebase/firestore-rest";
import { fetchGoogleFitSummary } from "@/src/data/google-fit/fetch-google-fit-summary";
import { getFirebaseAuth } from "@/src/config/firebase";
import type { DashboardStats } from "@/src/domain/entities/dashboard";

const DEFAULT_STATS: DashboardStats = {
  progressPercent: 0,
  stepsPercent: 0,
  caloriesPercent: 0,
};

const GOAL_STEPS = 10000;
const GOAL_CALORIES = 2000;
const SAVE_INTERVAL_MS = 2 * 60 * 1000; // 2 минуты
const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.location.read",
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
  const [userInfo, setUserInfo] = useState<{
    email: string;
    name: string;
    photo?: string;
  } | null>(null);

  const progressUserId = useMemo(
    () => userInfo?.email?.replace(/[@.]/g, "_") ?? process.env.EXPO_PUBLIC_PROGRESS_USER_ID ?? "guest",
    [userInfo],
  );

  const displayName = useMemo(
    () => userInfo?.name ?? process.env.EXPO_PUBLIC_PROGRESS_DISPLAY_NAME ?? "Гость",
    [userInfo],
  );

  const connectGoogleFit = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      console.log("🔵 Checking Play Services...");
      await GoogleSignin.hasPlayServices();
      console.log("✅ Play Services OK");
      
      console.log("🔵 Starting Google Sign In...");
      const signInResult = await GoogleSignin.signIn();
      console.log("✅ Sign In successful:", signInResult.data?.user?.email);
      
      // Сохраняем информацию о пользователе
      const user = signInResult.data?.user;
      if (user) {
        setUserInfo({
          email: user.email || "",
          name: user.name || user.email || "Пользователь",
          photo: user.photo || undefined,
        });
        console.log("👤 User info saved:", user.name, user.email);
      }
      
      console.log("🔵 Getting tokens...");
      const tokens = await GoogleSignin.getTokens();
      console.log("✅ Tokens received");
      
      const token = tokens.accessToken;

      if (!token) {
        console.log("❌ No access token");
        setError("Не удалось получить токен доступа");
        setIsLoading(false);
        return;
      }

      console.log("✅ Access token OK, loading stats...");
      setAccessToken(token);
      await loadTodayStats(token);
    } catch (err: any) {
      console.log("❌ Error:", err);
      console.log("Error code:", err.code);
      console.log("Error message:", err.message);
      setError(err.message || "Ошибка авторизации Google");
      setIsLoading(false);
    }
  }, []);

  const saveTodayProgress = useCallback(
    async (nextSteps: number, nextCalories: number, nextProgressPercent: number) => {
      const { dateIso } = getDayRange();
      const documentId = `${progressUserId}_${dateIso}`;

      const firebaseUid = getFirebaseAuth().currentUser?.uid ?? progressUserId;
      await upsertDailyProgress({
        documentId,
        userId: progressUserId,
        uid: firebaseUid,
        displayName: displayName,
        date: dateIso,
        steps: nextSteps,
        calories: nextCalories,
        progressPercent: nextProgressPercent,
      });
    },
    [progressUserId, displayName],
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
        console.log("📅 Loading today's stats for range:", range);
        
        const summary = await fetchGoogleFitSummary({
          accessToken: token,
          startTimeMillis: range.startTimeMillis,
          endTimeMillis: range.endTimeMillis,
        });

        if (summary === null) {
          setError("Не удалось загрузить данные из Google Fit");
          setIsLoading(false);
          return;
        }

        console.log("📊 Summary received:", summary);
        console.log("📊 Steps:", summary.steps, "Calories:", summary.calories);
        
        const nextStats = mapSummaryToStats(summary.steps, summary.calories);
        console.log("📊 Calculated stats:", nextStats);
        
        setSteps(summary.steps);
        setCalories(summary.calories);
        setStats(nextStats);
        
        console.log("✅ State updated - Steps:", summary.steps, "Calories:", summary.calories);
        
        // Включаем сохранение в Firebase
        await saveTodayProgress(summary.steps, summary.calories, nextStats.progressPercent);
        
        console.log("✅ Stats loaded and saved successfully");
      } catch (err: any) {
        console.log("❌ Error loading stats:", err);
        console.log("❌ Error message:", err.message);
        setError("Не удалось загрузить данные из Google Fit");
      } finally {
        setIsLoading(false);
      }
    },
    [mapSummaryToStats, saveTodayProgress],
  );

  useEffect(() => {
    console.log("🔧 Configuring GoogleSignin...");
    console.log("Web Client ID:", process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
    
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: GOOGLE_FIT_SCOPES,
      offlineAccess: true,
    });
    
    console.log("✅ GoogleSignin configured");
    
    // Автоматически проверяем, есть ли сохранённая сессия
    checkSignedIn();
  }, []);

  const checkSignedIn = useCallback(async () => {
    try {
      // Пробуем получить текущего пользователя
      const currentUser = await GoogleSignin.getCurrentUser();
      console.log("🔍 Current user:", currentUser);
      
      if (currentUser) {
        const user = currentUser as any;
        setUserInfo({
          email: user.email || "",
          name: user.name || user.email || "Пользователь",
          photo: user.photo || undefined,
        });
        console.log("👤 User info loaded:", user.name, user.email);
        
        const tokens = await GoogleSignin.getTokens();
        const token = tokens.accessToken;
        
        if (token) {
          console.log("✅ User already signed in, loading data...");
          setAccessToken(token);
          await loadTodayStats(token);
        }
      }
    } catch (err) {
      console.log("ℹ️ No user signed in yet");
    }
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    // Автоматическое обновление каждые 10 минут
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing data...");
      void loadTodayStats(accessToken);
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [accessToken, loadTodayStats]);

  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
      setAccessToken(null);
      setUserInfo(null);
      setStats(DEFAULT_STATS);
      setSteps(0);
      setCalories(0);
      console.log("✅ User signed out");
    } catch (err) {
      console.log("❌ Error signing out:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    console.log("🔄 Manual refresh triggered");
    await loadTodayStats(accessToken);
  }, [accessToken, loadTodayStats]);

  return {
    stats,
    steps,
    calories,
    isLoading,
    error,
    isConnected: Boolean(accessToken),
    userInfo,
    connectGoogleFit,
    signOut,
    refresh,
  };
}
