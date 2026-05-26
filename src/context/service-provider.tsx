import React, { createContext, useContext, useRef } from "react";
import { FirebaseChallengeRepository } from "@/src/data/repositories/firebase-challenge-repository";
import { FirebaseChatRepository } from "@/src/data/repositories/firebase-chat-repository";
import { FirebaseFriendRepository } from "@/src/data/repositories/firebase-friend-repository";
import { FirebaseAchievementRepository } from "@/src/data/repositories/firebase-achievement-repository";
import { FirebaseNotificationRepository } from "@/src/data/repositories/firebase-notification-repository";
import type { ChallengeRepository } from "@/src/domain/repositories/challenge-repository";
import type { ChatRepository } from "@/src/domain/repositories/chat-repository";
import type { FriendRepository } from "@/src/domain/repositories/friend-repository";
import type { AchievementRepository } from "@/src/domain/repositories/achievement-repository";
import type { NotificationRepository } from "@/src/domain/repositories/notification-repository";

type Services = {
  challengeRepository: ChallengeRepository;
  chatRepository: ChatRepository;
  friendRepository: FriendRepository;
  achievementRepository: AchievementRepository;
  notificationRepository: NotificationRepository;
};

const ServiceContext = createContext<Services | null>(null);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const services = useRef<Services>({
    challengeRepository: new FirebaseChallengeRepository(),
    chatRepository: new FirebaseChatRepository(),
    friendRepository: new FirebaseFriendRepository(),
    achievementRepository: new FirebaseAchievementRepository(),
    notificationRepository: new FirebaseNotificationRepository(),
  }).current;

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices(): Services {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
}
