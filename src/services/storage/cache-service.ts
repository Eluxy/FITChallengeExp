import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Period } from "@/src/presentation/view-models/use-statistics-view-model";

const METRICS_CACHE_KEY = "@fitapp_metrics_cache";
const CHALLENGES_CACHE_KEY = "@fitapp_challenges_cache";
const SYSTEM_CHALLENGES_CACHE_KEY = "@fitapp_system_challenges_cache";
const FRIENDS_CACHE_KEY = "@fitapp_friends_cache";
const STATS_CACHE_PREFIX = "@fitapp_stats_cache_";

type MetricsCache = {
  steps: number;
  calories: number;
  distance: number | undefined;
  dateIso: string;
  timestamp: number;
};

type StatsCacheData = {
  totalSteps: number;
  totalCalories: number;
  bestDayDate: string;
  bestDaySteps: number;
  dateIso: string;
};

export async function saveMetricsCache(
  steps: number,
  calories: number,
  distance: number | undefined,
  dateIso: string,
): Promise<void> {
  const cache: MetricsCache = {
    steps,
    calories,
    distance,
    dateIso,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(METRICS_CACHE_KEY, JSON.stringify(cache));
}

export async function getMetricsCache(): Promise<MetricsCache | null> {
  const raw = await AsyncStorage.getItem(METRICS_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MetricsCache;
  } catch {
    return null;
  }
}

export async function clearMetricsCache(): Promise<void> {
  await AsyncStorage.removeItem(METRICS_CACHE_KEY);
}

export async function saveCache<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function clearCache(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function saveStatsCache(
  period: Period,
  data: StatsCacheData,
): Promise<void> {
  await AsyncStorage.setItem(
    `${STATS_CACHE_PREFIX}${period}`,
    JSON.stringify({ ...data, timestamp: Date.now() }),
  );
}

export async function getStatsCache(
  period: Period,
): Promise<StatsCacheData | null> {
  const raw = await AsyncStorage.getItem(`${STATS_CACHE_PREFIX}${period}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StatsCacheData;
  } catch {
    return null;
  }
}

export {
  CHALLENGES_CACHE_KEY,
  SYSTEM_CHALLENGES_CACHE_KEY,
  FRIENDS_CACHE_KEY,
};
