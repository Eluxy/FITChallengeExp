export type WorkoutType = "walking" | "running" | "cycling" | "treadmill";

export type WorkoutRecord = {
  id?: string;
  type: WorkoutType;
  durationSeconds: number;
  steps: number;
  distanceMeters: number;
  calories: number;
  avgSpeedKmh: number;
  dateIso: string;
  createdAt: string;
};

export type WorkoutStatus = "idle" | "running" | "paused" | "finished";
