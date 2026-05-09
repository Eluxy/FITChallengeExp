import type { Profile } from "@/src/domain/entities/profile";
import type { ProfileRepository } from "@/src/domain/repositories/profile-repository";

const PROFILE: Profile = {
  name: "NAME",
  age: 20,
  heightCm: 175,
  weightKg: 72,
};

export class StaticProfileRepository implements ProfileRepository {
  async getProfile(): Promise<Profile> {
    return PROFILE;
  }
}

