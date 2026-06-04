import { Pedometer } from "expo-sensors";
import * as Location from "expo-location";
import { useState, useEffect, useRef, useCallback } from "react";
import { saveCache, getCache } from "@/src/services/storage/cache-service";
import { calcCalories } from "@/src/domain/services/calorie-service";
import { haversineDistance } from "@/src/domain/services/geo-service";
import { WorkoutSessionService } from "@/src/domain/services/workout-session-service";
import { workoutRepository } from "@/src/data/repositories/workout-repository";
import { getFirebaseAuth } from "@/src/config/firebase";
import type { WorkoutType, WorkoutRecord, WorkoutStatus } from "@/src/domain/entities/workout";

const WORKOUTS_CACHE_KEY = "@fitapp_workouts_cache";

export { type WorkoutType, type WorkoutRecord, type WorkoutStatus };

export const WORKOUT_LABELS: Record<WorkoutType, string> = {
  walking: "Ходьба",
  running: "Бег",
  cycling: "Велосипед",
  treadmill: "Беговая дорожка",
};

export const WORKOUT_ICONS: Record<WorkoutType, string> = {
  walking: "walk",
  running: "run-fast",
  cycling: "bike",
  treadmill: "run",
};

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} км`;
  }
  return `${Math.round(meters)} м`;
}

export function useWorkoutsViewModel() {
  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [status, setStatus] = useState<WorkoutStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [history, setHistory] = useState<WorkoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "searching" | "fixed">(
    "idle",
  );
  const [hasGps, setHasGps] = useState(false);
  const [lastRecord, setLastRecord] = useState<WorkoutRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<WorkoutSessionService | null>(null);
  const pedometerSubRef = useRef<{ remove: () => void } | null>(null);
  const locationSubRef = useRef<{ remove: () => void } | null>(null);
  const lastPositionRef = useRef<{ lat: number; lon: number } | null>(null);
  const typeRef = useRef<WorkoutType | null>(null);
  const stepsRef = useRef<number>(0);
  const distanceRef = useRef<number>(0);

  useEffect(() => {
    sessionRef.current = new WorkoutSessionService((tick) => {
      setElapsed(tick);
    });
    return () => {
      sessionRef.current?.reset();
    };
  }, []);

  const cleanupSensors = useCallback(() => {
    if (pedometerSubRef.current) {
      pedometerSubRef.current.remove();
      pedometerSubRef.current = null;
    }
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  }, []);

  const startWorkout = useCallback(
    async (type: WorkoutType) => {
      cleanupSensors();
      typeRef.current = type;
      stepsRef.current = 0;
      distanceRef.current = 0;
      setWorkoutType(type);
      setStatus("running");
      setElapsed(0);
      setSteps(0);
      setDistance(0);
      setCalories(0);
      setAvgSpeed(0);
      setGpsStatus("idle");
      setLastRecord(null);
      setError(null);
      lastPositionRef.current = null;

      sessionRef.current?.reset();
      sessionRef.current?.start();

      if (type !== "cycling") {
        try {
          const isAvailable = await Pedometer.isAvailableAsync();
          if (isAvailable) {
            const sub = Pedometer.watchStepCount((result) => {
              stepsRef.current = result.steps;
              setSteps(result.steps);
            });
            pedometerSubRef.current = sub;
          }
        } catch {
          // Pedometer not available
        }
      }

      if (type !== "treadmill") {
        setGpsStatus("searching");
        try {
          const { status: perm } =
            await Location.requestForegroundPermissionsAsync();
          if (perm !== "granted") {
            setHasGps(false);
            setGpsStatus("idle");
          } else {
            setHasGps(true);
            const sub = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                distanceInterval: 5,
                timeInterval: 5000,
              },
              (loc) => {
                const { latitude, longitude } = loc.coords;
                setGpsStatus("fixed");
                if (lastPositionRef.current) {
                  const delta = haversineDistance(
                    lastPositionRef.current.lat,
                    lastPositionRef.current.lon,
                    latitude,
                    longitude,
                  );
                  distanceRef.current += Math.max(0, delta);
                  setDistance(distanceRef.current);
                }
                lastPositionRef.current = { lat: latitude, lon: longitude };
              },
            );
            locationSubRef.current = sub;
          }
        } catch {
          setHasGps(false);
          setGpsStatus("idle");
        }
      }
    },
    [cleanupSensors],
  );

  useEffect(() => {
    if (status === "running" && typeRef.current) {
      const minutes = elapsed / 60;
      const curDist = distance;
      setCalories(calcCalories(typeRef.current, minutes));
      if (curDist > 0 && elapsed > 0) {
        setAvgSpeed((curDist / 1000) / (elapsed / 3600));
      }
    }
  }, [elapsed, distance, status]);

  const pauseWorkout = useCallback(() => {
    if (status !== "running") return;
    setStatus("paused");
    sessionRef.current?.pause();
  }, [status]);

  const resumeWorkout = useCallback(() => {
    if (status !== "paused" || !typeRef.current) return;
    setStatus("running");
    sessionRef.current?.resume();
  }, [status]);

  const stopWorkout = useCallback(async () => {
    if (!typeRef.current) return;
    sessionRef.current?.stop();
    cleanupSensors();

    const totalSeconds = sessionRef.current?.elapsed ?? 0;
    const totalMinutes = totalSeconds / 60;
    const finalCalories = calcCalories(typeRef.current, totalMinutes);
    const finalSpeed =
      distance > 0 && totalSeconds > 0
        ? (distance / 1000) / (totalSeconds / 3600)
        : 0;
    const finalSteps = typeRef.current === "cycling" ? 0 : stepsRef.current;

    setCalories(finalCalories);
    setAvgSpeed(Math.round(finalSpeed * 10) / 10);

    const record: WorkoutRecord = {
      type: typeRef.current,
      durationSeconds: totalSeconds,
      steps: finalSteps,
      distanceMeters: Math.round(distance),
      calories: finalCalories,
      avgSpeedKmh: Math.round(finalSpeed * 10) / 10,
      dateIso: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    let savedToFirestore = false;
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (user) {
        await workoutRepository.saveWorkout(user.uid, record);
        savedToFirestore = true;
      }
    } catch {
      // Firestore save failed, cache fallback below
    }

    const cached = (await getCache<WorkoutRecord[]>(WORKOUTS_CACHE_KEY)) ?? [];
    cached.unshift(record);
    await saveCache(WORKOUTS_CACHE_KEY, cached.slice(0, 50));

    if (savedToFirestore) {
      const cachedAll = await getCache<WorkoutRecord[]>(WORKOUTS_CACHE_KEY);
      if (!cachedAll || cachedAll.length === 0) {
        await saveCache(WORKOUTS_CACHE_KEY, [record]);
      }
    }

    setLastRecord(record);
    setHistory((prev) => [record, ...prev]);
    setStatus("finished");

    setTimeout(() => {
      setStatus("idle");
      setWorkoutType(null);
      typeRef.current = null;
    }, 3000);
  }, [cleanupSensors, distance]);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }
      const records = await workoutRepository.getWorkouts(user.uid);
      setHistory(records);
      await saveCache(WORKOUTS_CACHE_KEY, records);
    } catch {
      const cached = await getCache<WorkoutRecord[]>(WORKOUTS_CACHE_KEY);
      if (cached) setHistory(cached);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      sessionRef.current?.reset();
      cleanupSensors();
    };
  }, [cleanupSensors]);

  return {
    workoutType,
    status,
    elapsed,
    steps,
    distance,
    calories,
    avgSpeed,
    history,
    isLoading,
    gpsStatus,
    hasGps,
    lastRecord,
    error,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    loadHistory,
  };
}
