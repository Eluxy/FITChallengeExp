import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/src/context/auth-context";
import {
  fetchDailyProgress,
  upsertDailyProgress,
} from "@/src/data/firebase/firestore-rest";
import { fetchGoogleFitSummary } from "@/src/data/google-fit/fetch-google-fit-summary";
import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import { FirebaseChallengeRepository } from "@/src/data/repositories/firebase-challenge-repository";
import { doc, getDoc } from "firebase/firestore";
import type { DashboardStats } from "@/src/domain/entities/dashboard";
import type { UserGoals } from "@/src/domain/entities/user-settings";
import { DEFAULT_GOALS } from "@/src/domain/entities/user-settings";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_STATS: DashboardStats = {
  progressPercent: 0,
  stepsPercent: 0,
  caloriesPercent: 0,
};

const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

function getDayRange() {
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return {
    startTimeMillis: start.getTime(),
    endTimeMillis: end.getTime(),
    dateIso: localDate,
  };
}

function computeStats(
  steps: number,
  calories: number,
  goals: UserGoals,
): DashboardStats {
  const stepsPercent = Math.min(
    Math.round((steps / goals.dailySteps) * 100),
    100,
  );
  const caloriesPercent = Math.min(
    Math.round((calories / goals.dailyCalories) * 100),
    100,
  );
  const progressPercent = Math.min(
    Math.round(stepsPercent * 0.7 + caloriesPercent * 0.3),
    100,
  );
  return { stepsPercent, caloriesPercent, progressPercent };
}

async function syncChallengeProgress(
  currentSteps: number,
  currentCalories: number,
  currentDistance: number | undefined,
) {
  try {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) return;
    const repo = new FirebaseChallengeRepository();
    const userChallenges = await repo.getUserChallenges(uid);
    const activeChallenges = userChallenges.filter(
      (c) =>
        (c.status === "active" || c.status === "pending") &&
        c.participants.some((p) => p.userId === uid),
    );
    for (const challenge of activeChallenges) {
      let value = 0;
      if (challenge.type === "steps") value = currentSteps;
      else if (challenge.type === "calories") value = currentCalories;
      else if (challenge.type === "distance")
        value = Math.round((currentDistance ?? 0) / 1000);
      if (value > 0) {
        await repo.updateParticipantValue(challenge.id, uid, value);
      }
    }
  } catch (err) {
    console.log("Error syncing challenge progress:", err);
  }
}

export function useGoogleFitData() {
  const { isConnected, accessToken, userInfo } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [distance, setDistance] = useState<number | undefined>();
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalsRef = useRef(goals);
  goalsRef.current = goals;

  const progressUserId = userInfo?.email?.replace(/[@.]/g, "_") ?? "guest";
  const displayName = userInfo?.name ?? "Гость";

  const fetchAndSave = useCallback(async () => {
    if (!accessToken) return;

    const range = getDayRange();
    const docId = `${progressUserId}_${range.dateIso}`;
    const summary = await fetchGoogleFitSummary({
      accessToken,
      startTimeMillis: range.startTimeMillis,
      endTimeMillis: range.endTimeMillis,
    }).catch(() => ({ steps: 0, calories: 0, distanceMeters: undefined }));

    setSteps(summary.steps);
    setCalories(summary.calories);
    setDistance(summary.distanceMeters);
    setStats(
      computeStats(summary.steps, summary.calories, goalsRef.current),
    );

    const s = computeStats(summary.steps, summary.calories, goalsRef.current);
    await upsertDailyProgress({
      documentId: docId,
      userId: progressUserId,
      displayName,
      date: range.dateIso,
      steps: summary.steps,
      calories: summary.calories,
      progressPercent: s.progressPercent,
    }).catch(() => {});

    syncChallengeProgress(
      summary.steps,
      summary.calories,
      summary.distanceMeters,
    );
  }, [accessToken, progressUserId, displayName]);

  // Load user goals once
  useEffect(() => {
    if (!isConnected) return;
    const loadUserGoals = async () => {
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        if (!user) return;
        const db = getFirebaseDb();
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userGoals = docSnap.data().goals as UserGoals | undefined;
          if (userGoals) setGoals(userGoals);
        }
      } catch {}
    };
    loadUserGoals();
  }, [isConnected]);

  // Initial load: show cached Firebase data immediately, then fetch from API
  useEffect(() => {
    if (!isConnected || !accessToken) return;
    let cancelled = false;

    const initialLoad = async () => {
      setIsLoading(true);
      setError(null);

      // Show cached data from Firebase immediately
      const range = getDayRange();
      const docId = `${progressUserId}_${range.dateIso}`;
      const cached = await fetchDailyProgress(docId).catch(() => null);
      if (!cancelled && cached !== null) {
        setSteps(cached);
        setStats(computeStats(cached, calories, goalsRef.current));
      }

      // Then fetch fresh data from API
      await fetchAndSave();
      if (!cancelled) setIsLoading(false);
    };

    initialLoad();

    return () => { cancelled = true; };
  }, [isConnected, accessToken, progressUserId, displayName, fetchAndSave]);

  // Periodic refresh every 30 seconds
  useEffect(() => {
    if (!isConnected || !accessToken) return;
    let cancelled = false;

    const interval = setInterval(async () => {
      if (cancelled) return;
      await fetchAndSave();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isConnected, accessToken, fetchAndSave]);

  // Refresh on tab focus
  useFocusEffect(
    useCallback(() => {
      if (!isConnected || !accessToken) return;
      fetchAndSave();
    }, [isConnected, accessToken, fetchAndSave]),
  );

  useEffect(() => {
    setStats(computeStats(steps, calories, goals));
  }, [goals]);

  const refresh = useCallback(async () => {
    await fetchAndSave();
  }, [fetchAndSave]);

  return {
    stats,
    steps,
    calories,
    distance,
    goals,
    isLoading,
    error,
    refresh,
  };
}
