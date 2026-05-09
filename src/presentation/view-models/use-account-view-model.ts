import { useEffect, useMemo, useState } from "react";

import { StaticProfileRepository } from "@/src/data/repositories/static-profile-repository";
import type { Profile } from "@/src/domain/entities/profile";
import { GetProfileUseCase } from "@/src/domain/use-cases/get-profile-use-case";

const DEFAULT_PROFILE: Profile = {
  name: "NAME",
  age: 0,
  heightCm: 0,
  weightKg: 0,
};

export function useAccountViewModel() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  const useCase = useMemo(() => {
    return new GetProfileUseCase(new StaticProfileRepository());
  }, []);

  useEffect(() => {
    let isMounted = true;

    void useCase.execute().then((data) => {
      if (!isMounted) {
        return;
      }

      setProfile(data);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [useCase]);

  return {
    profile,
    isLoading,
  };
}

