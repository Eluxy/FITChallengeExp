import type { ChallengeParticipant, ChallengeType } from "@/src/domain/entities/challenge";
import type { ChallengeRepository } from "@/src/domain/repositories/challenge-repository";

export class CreateChallengeUseCase {
  constructor(private readonly challengeRepository: ChallengeRepository) {}

  async execute(params: {
    title: string;
    description: string;
    type: ChallengeType;
    targetValue: number;
    startDate: string;
    endDate: string;
    isSystem?: boolean;
    participants?: ChallengeParticipant[];
  }): Promise<string> {
    return this.challengeRepository.createChallenge(params);
  }
}
