import * as Google from "expo-auth-session/providers/google";
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

  const redirectUri = "com.eluxy.FitApp:/oauthredirect";

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: GOOGLE_FIT_SCOPES,
    redirectUri,
  });

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

  useEffect(() => {
    if (response?.type !== "success") {
      return;
    }

    const token = response.authentication?.accessToken;
    if (!token) {
      setError("Google авторизация не вернула access token");
      return;
    }

    setAccessToken(token);
    void loadStats(token);
  }, [loadStats, response]);

  const connectGoogleFit = useCallback(async () => {
    if (!request) {
      setError("OAuth не настроен. Проверь EXPO_PUBLIC_GOOGLE_*_CLIENT_ID");
      return;
    }

    setError(null);
    await promptAsync();
  }, [promptAsync, request]);

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

