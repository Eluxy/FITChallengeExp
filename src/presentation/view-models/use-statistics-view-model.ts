import { fetchDailyProgressRange } from "@/src/data/firebase/firestore-rest";
import { fetchGoogleFitStatsRange } from "@/src/data/google-fit/fetch-google-fit-summary";
import { getStatsCache, saveStatsCache, type StatsCacheData } from "@/src/services/storage/cache-service";
import { useEffect, useRef, useState } from "react";

export type Period = "day" | "month" | "year";

export type DayStat = {
  date: string;
  steps: number;
  calories: number;
};

type StatsState = {
  totalSteps: number;
  totalCalories: number;
  totalDistance: number;
  avgSteps: number;
  avgCalories: number;
  bestDayDate: string;
  bestDaySteps: number;
  dailyBreakdown: DayStat[];
};

const EMPTY_STATS: StatsState = {
  totalSteps: 0,
  totalCalories: 0,
  totalDistance: 0,
  avgSteps: 0,
  avgCalories: 0,
  bestDayDate: "Нет данных",
  bestDaySteps: 0,
  dailyBreakdown: [],
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
  accessToken?: string | null,
) {
  const [period, setPeriod] = useState<Period>("day");
  const [stats, setStats] = useState<StatsState>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const periodRef = useRef<Period>("day");
  const mountedRef = useRef(true);
  const loadIdRef = useRef(0);

  const progressUserId = userId?.replace(/[@.]/g, "_") ?? process.env.EXPO_PUBLIC_PROGRESS_USER_ID ?? "guest";

  const loadStatistics = async () => {
    if (!isConnected) {
      setStats(EMPTY_STATS);
      setError("Войдите в аккаунт для просмотра статистики");
      return;
    }

    setIsLoading(true);
    setError(null);
    const currentPeriod = periodRef.current;
    const loadId = ++loadIdRef.current;

    try {
      const startDate = getStartDate(currentPeriod);
      const endDate = new Date();
      const startMs = startDate.getTime();
      const endMs = endDate.getTime();

      if (accessToken) {
        const fitStats = await fetchGoogleFitStatsRange({
          accessToken,
          startTimeMillis: startMs,
          endTimeMillis: endMs,
        });

        if (loadIdRef.current !== loadId || !mountedRef.current) return;

        if (fitStats !== null && fitStats.totalSteps > 0) {
          const days = fitStats.days ?? [];
          const dayCount = days.length || 1;
          let bestDaySteps = 0;
          let bestDayDate = "Нет данных";

          for (const day of days) {
            if (day.steps > bestDaySteps) {
              bestDaySteps = day.steps;
              bestDayDate = formatBestDate(day.date);
            }
          }

          const result: StatsCacheData = {
            totalSteps: fitStats.totalSteps,
            totalCalories: fitStats.totalCalories,
            totalDistance: fitStats.distanceMeters ?? 0,
            avgSteps: Math.round(fitStats.totalSteps / dayCount),
            avgCalories: Math.round(fitStats.totalCalories / dayCount),
            bestDayDate,
            bestDaySteps,
            dailyBreakdown: days.map((d) => ({ date: d.date, steps: d.steps, calories: d.calories })),
            dateIso: formatIsoDate(new Date()),
          };

          setStats(result);
          saveStatsCache(currentPeriod, result).catch(() => {});
          return;
        }
      }

      // Try cache
      const cached = await getStatsCache(currentPeriod);
      if (cached && loadIdRef.current === loadId && mountedRef.current) {
        setStats({
          totalSteps: cached.totalSteps,
          totalCalories: cached.totalCalories,
          totalDistance: cached.totalDistance ?? 0,
          avgSteps: cached.avgSteps ?? 0,
          avgCalories: cached.avgCalories ?? 0,
          bestDayDate: cached.bestDayDate,
          bestDaySteps: cached.bestDaySteps,
          dailyBreakdown: cached.dailyBreakdown ?? [],
        });
        setError("Показаны сохранённые данные");
        return;
      }

      // Fallback to Firebase daily_progress
      const rows = await fetchDailyProgressRange({
        userId: progressUserId,
        startDate: formatIsoDate(startDate),
        endDate: formatIsoDate(endDate),
      });

      if (loadIdRef.current !== loadId || !mountedRef.current) return;

      if (rows.length === 0) {
        setStats(EMPTY_STATS);
        return;
      }

      let totalSteps = 0;
      let totalCalories = 0;
      let bestDaySteps = 0;
      let bestDayDate = "Нет данных";
      const days: { date: string; steps: number; calories: number }[] = [];

      rows.forEach((data) => {
        totalSteps += data.steps;
        totalCalories += data.calories;
        if (data.steps > bestDaySteps && data.date) {
          bestDaySteps = data.steps;
          bestDayDate = formatBestDate(data.date);
        }
        if (data.date) days.push({ date: data.date, steps: data.steps, calories: data.calories });
      });

      const dayCount = days.length || 1;
      const result: StatsCacheData = {
        totalSteps,
        totalCalories,
        totalDistance: 0,
        avgSteps: Math.round(totalSteps / dayCount),
        avgCalories: Math.round(totalCalories / dayCount),
        bestDayDate,
        bestDaySteps,
        dailyBreakdown: days,
        dateIso: formatIsoDate(new Date()),
      };
      setStats(result);
      saveStatsCache(currentPeriod, result).catch(() => {});
    } catch {
      if (loadIdRef.current === loadId && mountedRef.current) {
        const cached = await getStatsCache(currentPeriod);
        if (cached) {
          setStats({
            totalSteps: cached.totalSteps,
            totalCalories: cached.totalCalories,
            totalDistance: cached.totalDistance ?? 0,
            avgSteps: cached.avgSteps ?? 0,
            avgCalories: cached.avgCalories ?? 0,
            bestDayDate: cached.bestDayDate,
            bestDaySteps: cached.bestDaySteps,
            dailyBreakdown: cached.dailyBreakdown ?? [],
          });
          setError("Показаны сохранённые данные");
        } else {
          setError("Не удалось загрузить статистику");
        }
      }
    } finally {
      if (loadIdRef.current === loadId && mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    periodRef.current = period;
    loadStatistics();
  }, [period, progressUserId, isConnected, accessToken]);

  return {
    period,
    setPeriod,
    stats,
    isLoading,
    error,
    refresh: loadStatistics,
  };
}
