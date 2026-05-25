import type { Challenge, ChallengeParticipant, ChallengeType } from "@/src/domain/entities/challenge";

export interface ChallengeRepository {
  createChallenge(params: {
    title: string;
    description: string;
    type: ChallengeType;
    targetValue: number;
    startDate: string;
    endDate: string;
    isSystem?: boolean;
    participants?: ChallengeParticipant[];
  }): Promise<string>;

  getChallenge(id: string): Promise<Challenge | null>;
  getActiveChallenges(): Promise<Challenge[]>;
  getUserChallenges(userId: string): Promise<Challenge[]>;
  getSystemChallenges(): Promise<Challenge[]>;

  joinChallenge(challengeId: string): Promise<void>;
  updateParticipantValue(challengeId: string, userId: string, currentValue: number): Promise<void>;

  completeChallenge(challengeId: string, winnerId: string): Promise<void>;
  startChallenge(challengeId: string): Promise<void>;
  cancelChallenge(challengeId: string): Promise<void>;

  checkAndCompleteExpiredChallenges(): Promise<{ completed: number; winners: string[] }>;
}
