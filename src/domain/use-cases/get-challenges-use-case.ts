import type { Challenge } from "@/src/domain/entities/challenge";
import type { ChallengeRepository } from "@/src/domain/repositories/challenge-repository";

export class GetChallengesUseCase {
  constructor(private readonly challengeRepository: ChallengeRepository) {}

  async getActive(): Promise<Challenge[]> {
    return this.challengeRepository.getActiveChallenges();
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    return this.challengeRepository.getUserChallenges(userId);
  }

  async getSystem(): Promise<Challenge[]> {
    return this.challengeRepository.getSystemChallenges();
  }

  async getById(id: string): Promise<Challenge | null> {
    return this.challengeRepository.getChallenge(id);
  }
}
