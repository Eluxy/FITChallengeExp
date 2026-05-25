import { fetchDailyProgressRange } from "@/src/data/firebase/firestore-rest";
import { useCallback, useEffect, useMemo, useState } from "react";

export type Period = "day" | "month" | "year";

type StatsState = {
  totalSteps: number;
  totalCalories: number;
  bestDayDate: string;
  bestDaySteps: number;
};

const EMPTY_STATS: StatsState = {
  totalSteps: 0,
  totalCalories: 0,
  bestDayDate: "Нет данных",
  bestDaySteps: 0,
};

function getStartDate(period: Period): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === "month") date.setDate(1);
  else if (period === "year") date.setMonth(0, 1);
  return date;
}

function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatBestDate(isoDate: string): string {
  try {
    const parsed = new Date(isoDate);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
    }).format(parsed);
  } catch {
    return isoDate;
  }
}

export function getPeriodTitle(period: Period): string {
  const now = new Date();
  if (period === "day") {
    return `Сегодня, ${new Intl.DateTimeFormat("ru-RU", {
      day: "numeric", month: "long", year: "numeric",
    }).format(now)}`;
  }
  if (period === "month") {
    return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(now);
  }
  return String(now.getFullYear());
}

export function useStatisticsViewModel(
  userId: string | undefined,
  isConnected: boolean,
) {
  const [period, setPeriod] = useState<Period>("day");
  const [stats, setStats] = useState<StatsState>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressUserId = useMemo(
    () => userId?.replace(/[@.]/g, "_") ?? process.env.EXPO_PUBLIC_PROGRESS_USER_ID ?? "guest",
    [userId],
  );

  const loadStatistics = useCallback(async () => {
    if (!isConnected) {
      setStats(EMPTY_STATS);
      setError("Войдите в аккаунт для просмотра статистики");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startDate = getStartDate(period);
      const endDate = new Date();
      const rows = await fetchDailyProgressRange({
        userId: progressUserId,
        startDate: formatIsoDate(startDate),
        endDate: formatIsoDate(endDate),
      });

      if (rows.length === 0) {
        setStats(EMPTY_STATS);
        return;
      }

      let totalSteps = 0;
      let totalCalories = 0;
      let bestDaySteps = 0;
      let bestDayDate = "Нет данных";

      rows.forEach((data) => {
        totalSteps += data.steps;
        totalCalories += data.calories;
        if (data.steps > bestDaySteps && data.date) {
          bestDaySteps = data.steps;
          bestDayDate = formatBestDate(data.date);
        }
      });

      setStats({ totalSteps, totalCalories, bestDayDate, bestDaySteps });
    } catch {
      setError("Не удалось загрузить статистику из Firebase");
    } finally {
      setIsLoading(false);
    }
  }, [period, progressUserId, isConnected]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return {
    period,
    setPeriod,
    stats,
    isLoading,
    error,
    refresh: loadStatistics,
  };
}
