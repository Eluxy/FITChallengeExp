import { getFirebaseDb } from "@/src/config/firebase";
import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";
import type { WorkoutRecord } from "@/src/domain/entities/workout";

export const workoutRepository = {
  async saveWorkout(userId: string, record: WorkoutRecord): Promise<void> {
    const db = getFirebaseDb();
    await addDoc(collection(db, "workouts"), { userId, ...record });
  },

  async getWorkouts(userId: string, maxCount: number = 30): Promise<WorkoutRecord[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", userId),
      limit(maxCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<WorkoutRecord, "id">),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },
};
