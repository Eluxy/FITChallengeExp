import { fetchDailyProgressByUids } from "@/src/data/firebase/firestore-rest";
import { FirebaseFriendRepository } from "@/src/data/repositories/firebase-friend-repository";
import { getFirebaseAuth } from "@/src/config/firebase";
import { getCache, saveCache, LEADERBOARD_CACHE_KEY } from "@/src/services/storage/cache-service";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

export type LeaderEntry = {
  userId: string;
  uid: string;
  displayName: string;
  steps: number;
  calories: number;
};

type LeaderboardCache = {
  entries: LeaderEntry[];
  timestamp: number;
};

function getTodayRange() {
  const now = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  const toLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return {
    startDate: toLocal(start),
    endDate: toLocal(end),
  };
}

export function useLeaderboardViewModel(
  firebaseUser: any,
  isConnected: boolean,
) {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!firebaseUser) {
      setError("Войдите в аккаунт для просмотра лидерборда");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Войдите в аккаунт для просмотра лидерборда");
        return;
      }

      const friendRepo = new FirebaseFriendRepository();
      const friends = await friendRepo.getFriends();
      const friendUids = friends.map((f) => f.userId).filter((uid): uid is string => Boolean(uid));

      const allUids = [currentUser.uid, ...friendUids.filter((uid) => uid !== currentUser.uid)];

      if (allUids.length === 0) {
        setLeaders([]);
        return;
      }

      const { startDate, endDate } = getTodayRange();
      const rows = await fetchDailyProgressByUids({
        uids: allUids,
        startDate,
        endDate,
      });

      const entryMap = new Map<string, LeaderEntry>();
      for (const row of rows) {
        const key = row.uid || row.userId || "";
        const existing = entryMap.get(key);
        if (existing) {
          existing.steps += row.steps;
          existing.calories += row.calories;
        } else {
          entryMap.set(key, {
            userId: row.userId ?? "",
            uid: row.uid ?? "",
            displayName: row.displayName ?? "Пользователь",
            steps: row.steps,
            calories: row.calories,
          });
        }
      }

      const entries = Array.from(entryMap.values());

      // Fill in missing friends/users with 0 steps so everyone appears
      const foundUids = new Set(entryMap.keys());
      const friendDisplayMap = new Map(
        friends.map((f) => [f.userId, f.displayName ?? "Пользователь"]),
      );

      for (const uid of allUids) {
        if (!foundUids.has(uid)) {
          entries.push({
            userId: "",
            uid,
            displayName: uid === currentUser.uid
              ? (currentUser.displayName ?? "Вы")
              : (friendDisplayMap.get(uid) ?? "Пользователь"),
            steps: 0,
            calories: 0,
          });
        }
      }

      entries.sort((a, b) => b.steps - a.steps);

      setLeaders(entries);
      setError(null);

      saveCache<LeaderboardCache>(LEADERBOARD_CACHE_KEY, {
        entries,
        timestamp: Date.now(),
      }).catch(() => {});
    } catch {
      const cached = await getCache<LeaderboardCache>(LEADERBOARD_CACHE_KEY);
      if (cached && cached.entries.length > 0) {
        setLeaders(cached.entries);
        setError("Показаны сохранённые данные");
      } else {
        setError("Не удалось загрузить лидерборд");
      }
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [loadLeaderboard]),
  );

  return {
    leaders,
    isLoading,
    error,
    myUserId: firebaseUser?.uid ?? "",
    refresh: loadLeaderboard,
  };
}
