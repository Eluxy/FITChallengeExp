export type AchievementDef = {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: "steps" | "calories" | "distance" | "streak" | "challenge" | "social" | "special";
  condition: (stats: AchievementCheckStats) => boolean;
  progress: (stats: AchievementCheckStats) => { current: number; total: number };
};

export type AchievementCheckStats = {
  totalSteps: number;
  totalCalories: number;
  totalDistanceMeters: number;
  currentDaySteps: number;
  currentDayCalories: number;
  streakDays: number;
  challengesWon: number;
  challengesParticipated: number;
  friendsCount: number;
  workoutsLogged: number;
};

export type UserAchievement = {
  id: string;
  unlockedAt: string;
};
