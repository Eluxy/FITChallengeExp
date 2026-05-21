import type { Profile } from "@/src/domain/entities/profile";
import type { ProfileRepository } from "@/src/domain/repositories/profile-repository";

export class GetProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  execute(): Promise<Profile> {
    return this.profileRepository.getProfile();
  }
}

