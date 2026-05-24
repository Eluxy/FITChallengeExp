export type UserGoals = {
  dailySteps: number;
  dailyCalories: number;
  dailyDistanceKm: number;
};

export type UserProfile = {
  name: string;
  email: string;
  age: number;
  gender: "male" | "female" | "other" | "";
  heightCm: number;
  weightKg: number;
  goals: UserGoals;
  photoUrl?: string | null;
  createdAt: string;
};

export const DEFAULT_GOALS: UserGoals = {
  dailySteps: 10000,
  dailyCalories: 2000,
  dailyDistanceKm: 5,
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  age: 0,
  gender: "",
  heightCm: 0,
  weightKg: 0,
  goals: DEFAULT_GOALS,
  createdAt: new Date().toISOString(),
};
