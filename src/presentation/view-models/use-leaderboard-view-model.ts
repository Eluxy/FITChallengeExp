import { fetchDailyProgressRange } from "@/src/data/firebase/firestore-rest";
import { useCallback, useEffect, useState } from "react";

export type LeaderEntry = {
  userId: string;
  displayName: string;
  steps: number;
  calories: number;
};

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function useLeaderboardViewModel(
  userId: string | undefined,
  isConnected: boolean,
) {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myUserId = userId?.replace(/[@.]/g, "_") ?? "";

  const loadLeaderboard = useCallback(async () => {
    if (!isConnected) {
      setError("Войдите в аккаунт для просмотра лидерборда");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getTodayRange();
      const rows = await fetchDailyProgressRange({
        userId: myUserId,
        startDate,
        endDate,
      });

      const entries: LeaderEntry[] = rows.map((row) => ({
        userId: (row as any).userId ?? "",
        displayName: (row as any).displayName ?? "Пользователь",
        steps: row.steps,
        calories: row.calories,
      }));

      entries.sort((a, b) => b.steps - a.steps);
      setLeaders(entries);
    } catch {
      setError("Не удалось загрузить лидерборд");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, myUserId]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return {
    leaders,
    isLoading,
    error,
    myUserId,
    refresh: loadLeaderboard,
  };
}
