import type { Profile } from "@/src/domain/entities/profile";

export interface ProfileRepository {
  getProfile(): Promise<Profile>;
}

