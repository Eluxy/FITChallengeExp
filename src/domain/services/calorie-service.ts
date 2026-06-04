import type { WorkoutType } from "@/src/domain/entities/workout";

const WORKOUT_MET: Record<WorkoutType, number> = {
  walking: 3.5,
  running: 8.0,
  cycling: 6.8,
  treadmill: 7.0,
};

export function calcCalories(type: WorkoutType, durationMinutes: number, weightKg: number = 70): number {
  return Math.round(durationMinutes * WORKOUT_MET[type] * 0.0175 * weightKg);
}

export { WORKOUT_MET };
