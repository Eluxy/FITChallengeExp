export type ChallengeType = "steps" | "distance" | "calories" | "time";
export type ChallengeStatus = "pending" | "active" | "completed" | "cancelled";

export type ChallengeParticipant = {
  userId: string;
  displayName: string;
  photoUrl?: string | null;
  joinedAt: string;
  currentValue: number;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  type: ChallengeType;
  targetValue: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  participants: ChallengeParticipant[];
  winnerId?: string;
  isSystem: boolean;
  createdAt: string;
};

export function getChallengeUnit(type: ChallengeType): string {
  switch (type) {
    case "steps": return "шагов";
    case "distance": return "км";
    case "calories": return "ккал";
    case "time": return "мин";
  }
}

export function getChallengeIcon(type: ChallengeType): string {
  switch (type) {
    case "steps": return "shoe-sneaker";
    case "distance": return "map-marker-distance";
    case "calories": return "fire";
    case "time": return "clock-outline";
  }
}
