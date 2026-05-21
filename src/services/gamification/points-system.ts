export type LevelInfo = {
  level: number;
  minXp: number;
  title: string;
};

export const LEVELS: LevelInfo[] = [
  { level: 1, minXp: 0, title: "Новичок" },
  { level: 2, minXp: 100, title: "Начинающий" },
  { level: 3, minXp: 300, title: "Активный" },
  { level: 4, minXp: 600, title: "Спортсмен" },
  { level: 5, minXp: 1000, title: "Энтузиаст" },
  { level: 6, minXp: 1500, title: "Фитнес-эксперт" },
  { level: 7, minXp: 2200, title: "Чемпион" },
  { level: 8, minXp: 3000, title: "Легенда" },
  { level: 9, minXp: 4000, title: "Мастер" },
  { level: 10, minXp: 5500, title: "Титан" },
  { level: 11, minXp: 7500, title: "Бессмертный" },
  { level: 12, minXp: 10000, title: "Бог фитнеса" },
];

const XP_RATES = {
  steps: 10,       // XP per 1000 steps
  calories: 5,     // XP per 100 kcal
  streak: 50,      // XP per day of streak
  challenge_win: 200,
  challenge_participate: 50,
  social: 25,      // XP per friend added
};

export function calculateXpForSteps(steps: number): number {
  return Math.floor(steps / 1000) * XP_RATES.steps;
}

export function calculateXpForCalories(calories: number): number {
  return Math.floor(calories / 100) * XP_RATES.calories;
}

export function calculateTotalDailyXp(steps: number, calories: number): number {
  return calculateXpForSteps(steps) + calculateXpForCalories(calories);
}

export function getLevelInfo(totalXp: number): LevelInfo {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXp >= level.minXp) {
      currentLevel = level;
    } else {
      break;
    }
  }
  return currentLevel;
}

export function getLevelProgress(totalXp: number): { currentXp: number; nextLevelXp: number; progress: number } {
  const current = getLevelInfo(totalXp);
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level) + 1;

  if (nextIndex >= LEVELS.length) {
    return { currentXp: 0, nextLevelXp: 1, progress: 100 };
  }

  const nextLevel = LEVELS[nextIndex];
  const currentXp = totalXp - current.minXp;
  const nextLevelXp = nextLevel.minXp - current.minXp;
  const progress = Math.min(Math.round((currentXp / nextLevelXp) * 100), 100);

  return { currentXp, nextLevelXp, progress };
}
