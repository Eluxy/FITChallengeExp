import { useCallback, useEffect, useMemo, useState } from "react";

import {
    fetchGoogleFitSummary,
    type GoogleFitSummary,
} from "@/src/data/google-fit/fetch-google-fit-summary";

type WeekRange = {
  startTimeMillis: number;
  endTimeMillis: number;
  label: string;
};

function getCurrentWeekRange(): WeekRange {
  const now = new Date();
  const day = now.getDay();
  const mondayDiff = day === 0 ? -6 : 1 - day;

  const start = new Date(now);
  start.setDate(now.getDate() + mondayDiff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "long" });
  const month = monthFormatter.format(start).toUpperCase();

  return {
    startTimeMillis: start.getTime(),
    endTimeMillis: end.getTime(),
    label: `${start.getDate()} - ${end.getDate() - 1} ${month}`,
  };
}

const EMPTY_SUMMARY: GoogleFitSummary = {
  steps: 0,
  calories: 0,
};

const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
];

export function useGoogleFitStatsViewModel() {
  const [summary, setSummary] = useState<GoogleFitSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const weekRange = useMemo(() => getCurrentWeekRange(), []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: GOOGLE_FIT_SCOPES,
      offlineAccess: true,
    });
  }, []);

  const loadStats = useCallback(
    async (token: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const nextSummary = await fetchGoogleFitSummary({
          accessToken: token,
          startTimeMillis: weekRange.startTimeMillis,
          endTimeMillis: weekRange.endTimeMillis,
        });

        setSummary(nextSummary);
      } catch {
        setError("Не удалось загрузить шаги и калории из Google Fit");
      } finally {
        setIsLoading(false);
      }
    },
    [weekRange.endTimeMillis, weekRange.startTimeMillis],
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
      await loadStats(token);
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации Google");
      setIsLoading(false);
    }
  }, [loadStats]);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    await loadStats(accessToken);
  }, [accessToken, loadStats]);

  return {
    summary,
    periodLabel: weekRange.label,
    isLoading,
    error,
    isConnected: Boolean(accessToken),
    connectGoogleFit,
    refresh,
  };
}

