import type { AchievementCheckStats } from "@/src/domain/entities/achievement";
import { ACHIEVEMENTS } from "@/src/domain/services/achievement-service";
import { getLevelInfo, getLevelProgress, calculateTotalDailyXp } from "@/src/domain/services/points-system";
import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import { FirebaseAchievementRepository } from "@/src/data/repositories/firebase-achievement-repository";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

export function useAchievementsViewModel(
  steps: number,
  calories: number,
  isConnected: boolean,
  distance?: number,
) {
  const [firestoreUnlocked, setFirestoreUnlocked] = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp] = useState(0);

  const uid = getFirebaseAuth().currentUser?.uid;

  useEffect(() => {
    if (!uid || !isConnected) return;
    let cancelled = false;

    const load = async () => {
      try {
        const repo = new FirebaseAchievementRepository();
        const userAchievements = await repo.getUserAchievements(uid);
        if (!cancelled) {
          setFirestoreUnlocked(new Set(userAchievements.map((a) => a.id)));
        }

        const db = getFirebaseDb();
        const userSnap = await getDoc(doc(db, "users", uid));
        if (!cancelled && userSnap.exists()) {
          setTotalXp(userSnap.data().totalXp ?? 0);
        }
      } catch {
        // keep defaults
      }
    };

    load();
    return () => { cancelled = true; };
  }, [uid, isConnected]);

  const checkStats: AchievementCheckStats = useMemo(() => ({
    totalSteps: steps,
    totalCalories: calories,
    totalDistanceMeters: distance ?? 0,
    currentDaySteps: steps,
    currentDayCalories: calories,
    streakDays: 0,
    challengesWon: 0,
    challengesParticipated: 0,
    friendsCount: 0,
    workoutsLogged: 0,
  }), [steps, calories, distance]);

  const dailyXp = useMemo(() => calculateTotalDailyXp(steps, calories), [steps, calories]);

  // Use cumulative XP for level calculation (prefer Firestore, fall back to daily)
  const effectiveXp = totalXp > 0 ? totalXp : dailyXp;
  const levelInfo = useMemo(() => getLevelInfo(effectiveXp), [effectiveXp]);
  const levelProgress = useMemo(() => getLevelProgress(effectiveXp), [effectiveXp]);

  // Merge: condition + already unlocked from Firestore
  const conditionallyUnlocked = useMemo(
    () => new Set(ACHIEVEMENTS.filter((a) => a.condition(checkStats)).map((a) => a.id)),
    [checkStats],
  );

  const allUnlocked = new Set([...firestoreUnlocked, ...conditionallyUnlocked]);

  const unlockedCount = allUnlocked.size;
  const totalCount = ACHIEVEMENTS.length;

  return {
    checkStats,
    dailyXp,
    levelInfo,
    levelProgress,
    achievements: ACHIEVEMENTS,
    unlockedSet: allUnlocked,
    unlockedCount,
    totalCount,
  };
}
