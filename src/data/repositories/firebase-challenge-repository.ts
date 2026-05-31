import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import type { Challenge, ChallengeParticipant, ChallengeStatus, ChallengeType } from "@/src/domain/entities/challenge";
import type { ChallengeRepository } from "@/src/domain/repositories/challenge-repository";
import { createNotification } from "@/src/services/notifications/create-notification";
import { getCache, saveCache, CHALLENGES_CACHE_KEY, SYSTEM_CHALLENGES_CACHE_KEY } from "@/src/services/storage/cache-service";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

function challengeFromDoc(id: string, data: any): Challenge {
  return {
    id,
    title: data.title ?? "",
    description: data.description ?? "",
    creatorId: data.creatorId ?? "",
    type: data.type ?? "steps",
    targetValue: data.targetValue ?? 0,
    startDate: data.startDate ?? "",
    endDate: data.endDate ?? "",
    status: data.status ?? "pending",
    participants: data.participants ?? [],
    winnerId: data.winnerId,
    isSystem: data.isSystem ?? false,
    createdAt: data.createdAt ?? "",
  };
}

export class FirebaseChallengeRepository implements ChallengeRepository {
  private get challengesCol() {
    return collection(getFirebaseDb(), "challenges");
  }

  async createChallenge(params: {
    title: string;
    description: string;
    type: ChallengeType;
    targetValue: number;
    startDate: string;
    endDate: string;
    isSystem?: boolean;
    participants?: ChallengeParticipant[];
  }): Promise<string> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Вы не вошли в аккаунт. Войдите через Google или Email.");

    const participants = params.participants ?? [
      {
        userId: user.uid,
        displayName: user.displayName || user.email || "Пользователь",
        photoUrl: user.photoURL || null,
        joinedAt: new Date().toISOString(),
        currentValue: 0,
      },
    ];

    const challengeData = {
      title: params.title,
      description: params.description,
      creatorId: user.uid,
      type: params.type,
      targetValue: params.targetValue,
      startDate: params.startDate,
      endDate: params.endDate,
      status: "pending" as ChallengeStatus,
      participants,
      isSystem: params.isSystem ?? false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(this.challengesCol, challengeData);

    const invitedParticipants = participants.filter((p) => p.userId !== user.uid);
    const creatorName = user.displayName || user.email || "Пользователь";
    await Promise.all(
      invitedParticipants.map((p) =>
        createNotification(
          p.userId,
          "challenge_invite",
          "Новый челлендж!",
          `${creatorName} приглашает вас в "${params.title}"`,
          { challengeId: docRef.id },
        ),
      ),
    );

    return docRef.id;
  }

  async getChallenge(id: string): Promise<Challenge | null> {
    const docRef = doc(this.challengesCol, id);
    const docSnap = await withTimeout(getDoc(docRef));
    if (!docSnap.exists()) return null;
    return challengeFromDoc(id, docSnap.data());
  }

  async getActiveChallenges(): Promise<Challenge[]> {
    const q = query(
      this.challengesCol,
      where("status", "==", "active"),
      orderBy("endDate", "asc"),
    );
    const snapshot = await withTimeout(getDocs(q));
    return snapshot.docs.map((d) => challengeFromDoc(d.id, d.data()));
  }

   async getUserChallenges(userId: string): Promise<Challenge[]> {
      try {
        // Get challenges where user is creator (reliable query)
        const creatorQ = query(
          this.challengesCol,
          where("creatorId", "==", userId),
          orderBy("createdAt", "desc")
        );
        const creatorSnapshot = await withTimeout(getDocs(creatorQ));
        const creatorChallenges = creatorSnapshot.docs.map((d) => 
          challengeFromDoc(d.id, d.data())
        );

        // Get recent challenges to check for participant matches
        // We limit to avoid loading too much data; adjust as needed
        const recentQ = query(
          this.challengesCol,
          orderBy("createdAt", "desc"),
          limit(50) // Adjust this limit based on expected usage
        );
        const recentSnapshot = await withTimeout(getDocs(recentQ));
       const recentChallenges = recentSnapshot.docs.map((d) => 
         challengeFromDoc(d.id, d.data())
       );

       // Filter for challenges where user is a participant
       const participantChallenges = recentChallenges.filter(challenge =>
         challenge.participants.some(p => p.userId === userId)
       );

       // Combine and deduplicate by challenge ID
       const allChallenges = [...creatorChallenges, ...participantChallenges];
       const seenIds = new Set<string>();
       const uniqueChallenges = allChallenges.filter(challenge => {
         if (seenIds.has(challenge.id)) {
           return false;
         }
         seenIds.add(challenge.id);
         return true;
       });

       // Sort by createdAt descending
       const sorted = uniqueChallenges.sort((a, b) => 
         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
       );

      saveCache(CHALLENGES_CACHE_KEY, sorted).catch(() => {});

      return sorted;
    } catch (error) {
      console.error("Error in getUserChallenges:", error);
      try { const cached = await getCache<Challenge[]>(CHALLENGES_CACHE_KEY); if (cached) return cached; } catch {}
      return [];
    }
  }

  async getSystemChallenges(): Promise<Challenge[]> {
    try {
      const q = query(
        this.challengesCol,
        where("isSystem", "==", true),
        where("status", "in", ["pending", "active"]),
      );
      const snapshot = await withTimeout(getDocs(q));
      const result = snapshot.docs.map((d) => challengeFromDoc(d.id, d.data()));
      saveCache(SYSTEM_CHALLENGES_CACHE_KEY, result).catch(() => {});
      return result;
    } catch (error) {
      console.error("Error in getSystemChallenges:", error);
      try { const cached = await getCache<Challenge[]>(SYSTEM_CHALLENGES_CACHE_KEY); if (cached) return cached; } catch {}
      return [];
    }
  }

  async joinChallenge(challengeId: string): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const docRef = doc(this.challengesCol, challengeId);
    const docSnap = await withTimeout(getDoc(docRef));
    if (!docSnap.exists()) throw new Error("Challenge not found");

    const challenge = challengeFromDoc(challengeId, docSnap.data());
    const alreadyJoined = challenge.participants.some((p) => p.userId === user.uid);
    if (alreadyJoined) throw new Error("Already joined");

    const newParticipant: ChallengeParticipant = {
      userId: user.uid,
      displayName: user.displayName || user.email || "Пользователь",
      photoUrl: user.photoURL || null,
      joinedAt: new Date().toISOString(),
      currentValue: 0,
    };

    await updateDoc(docRef, {
      participants: [...challenge.participants, newParticipant],
    });

    if (challenge.creatorId && challenge.creatorId !== user.uid) {
      await createNotification(
        challenge.creatorId,
        "challenge_join",
        "Новый участник!",
        `${newParticipant.displayName} присоединился к "${challenge.title}"`,
        { challengeId },
      );
    }
  }

  async updateParticipantValue(challengeId: string, userId: string, currentValue: number): Promise<void> {
    const docRef = doc(this.challengesCol, challengeId);
    const docSnap = await withTimeout(getDoc(docRef));
    if (!docSnap.exists()) return;

    const challenge = challengeFromDoc(challengeId, docSnap.data());
    const updatedParticipants = challenge.participants.map((p) =>
      p.userId === userId ? { ...p, currentValue } : p,
    );

    if (challenge.status !== "active" && challenge.status !== "pending") return;

    await updateDoc(docRef, { participants: updatedParticipants });

    if (currentValue >= challenge.targetValue) {
      await updateDoc(docRef, {
        status: "completed",
        winnerId: userId,
        completedAt: new Date().toISOString(),
      });

      const winnerName = updatedParticipants.find((p) => p.userId === userId)?.displayName || "Победитель";
      await Promise.all(
        updatedParticipants.map((p) => {
          if (p.userId === userId) {
            return createNotification(
              p.userId,
              "challenge_win",
              "Победа!",
              `Вы выиграли челлендж "${challenge.title}"!`,
              { challengeId },
            );
          }
          return createNotification(
            p.userId,
            "challenge_lose",
            "Челлендж завершён",
            `Челлендж "${challenge.title}" завершён. Победитель: ${winnerName}`,
            { challengeId },
          );
        }),
      );
    }
  }

  async completeChallenge(challengeId: string, winnerId: string): Promise<void> {
    const docRef = doc(this.challengesCol, challengeId);
    await updateDoc(docRef, {
      status: "completed",
      winnerId,
    });
  }

  async startChallenge(challengeId: string): Promise<void> {
    const docRef = doc(this.challengesCol, challengeId);
    await updateDoc(docRef, {
      status: "active",
    });
  }

  async cancelChallenge(challengeId: string): Promise<void> {
    const docRef = doc(this.challengesCol, challengeId);
    await updateDoc(docRef, { status: "cancelled" });
  }

  async getCompletedChallenges(userId: string): Promise<Challenge[]> {
    try {
      const creatorQ = query(
        this.challengesCol,
        where("status", "==", "completed"),
        where("creatorId", "==", userId),
      );
      const creatorSnapshot = await withTimeout(getDocs(creatorQ));
      const creatorChallenges = creatorSnapshot.docs.map((d) =>
        challengeFromDoc(d.id, d.data()),
      );

      const allQ = query(
        this.challengesCol,
        where("status", "==", "completed"),
        limit(50),
      );
      const allSnapshot = await withTimeout(getDocs(allQ));
      const participantChallenges = allSnapshot.docs
        .map((d) => challengeFromDoc(d.id, d.data()))
        .filter((challenge) =>
          challenge.participants.some((p) => p.userId === userId) &&
          challenge.creatorId !== userId,
        );

      const allChallenges = [...creatorChallenges, ...participantChallenges];
      const seenIds = new Set<string>();
      const result = allChallenges
        .filter((challenge) => {
          if (seenIds.has(challenge.id)) return false;
          seenIds.add(challenge.id);
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      const cacheKey = `@fitapp_completed_challenges_${userId}`;
      saveCache(cacheKey, result).catch(() => {});
      return result;
    } catch (error) {
      console.error("Error in getCompletedChallenges:", error);
      try {
        const ck = `@fitapp_completed_challenges_${userId}`;
        const cached = await getCache<Challenge[]>(ck);
        if (cached) return cached;
      } catch {}
      return [];
    }
  }

  async deleteChallenge(challengeId: string): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Не авторизован");

    const docRef = doc(this.challengesCol, challengeId);
    const docSnap = await withTimeout(getDoc(docRef));
    if (!docSnap.exists()) throw new Error("Челлендж не найден");

    const data = docSnap.data();
    if (data.creatorId !== user.uid) {
      throw new Error("Только создатель может удалить челлендж");
    }

    const messagesCol = collection(docRef, "messages");
    const messagesSnap = await withTimeout(getDocs(messagesCol));
    const batch = writeBatch(getFirebaseDb());
    messagesSnap.docs.forEach((msgDoc) => batch.delete(msgDoc.ref));
    batch.delete(docRef);
    await batch.commit();
  }

  async checkAndCompleteExpiredChallenges(): Promise<{ completed: number; winners: string[] }> {
    const now = new Date().toISOString();
    const activeQ = query(
      this.challengesCol,
      where("status", "==", "active"),
    );
    const snapshot = await withTimeout(getDocs(activeQ));
    let completed = 0;
    const winners: string[] = [];

    const batch = snapshot.docs.filter((d) => {
      const data = d.data();
      return data.endDate && data.endDate < now;
    });

    for (const docSnap of batch) {
      const data = docSnap.data();
      const participants: ChallengeParticipant[] = data.participants ?? [];
      const challengeTitle = data.title ?? "Челлендж";

      const updateData: Record<string, any> = {
        status: "completed",
        completedAt: now,
      };

      const hasProgress = participants.some((p) => p.currentValue > 0);
      let winnerId: string | undefined;

      if (hasProgress) {
        const sorted = [...participants].sort((a, b) => b.currentValue - a.currentValue);
        winnerId = sorted[0].userId;
        updateData.winnerId = winnerId;
        winners.push(winnerId);
      }

      await updateDoc(doc(this.challengesCol, docSnap.id), updateData);

      const winnerName = winnerId
        ? participants.find((p) => p.userId === winnerId)?.displayName || "Победитель"
        : null;

      await Promise.all(
        participants.map((p) => {
          if (winnerId && p.userId === winnerId) {
            return createNotification(
              p.userId,
              "challenge_win",
              "Победа!",
              `Вы выиграли челлендж "${challengeTitle}"!`,
              { challengeId: docSnap.id },
            );
          }
          if (winnerId) {
            return createNotification(
              p.userId,
              "challenge_lose",
              "Челлендж завершён",
              `Челлендж "${challengeTitle}" завершён. Победитель: ${winnerName}`,
              { challengeId: docSnap.id },
            );
          }
          return createNotification(
            p.userId,
            "challenge_end",
            "Челлендж завершён",
            `Челлендж "${challengeTitle}" завершён. Никто не выполнил цель.`,
            { challengeId: docSnap.id },
          );
        }),
      );

      completed++;
    }

    return { completed, winners };
  }
}
