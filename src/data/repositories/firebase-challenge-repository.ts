import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import type { Challenge, ChallengeParticipant, ChallengeStatus, ChallengeType } from "@/src/domain/entities/challenge";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

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

export class FirebaseChallengeRepository {
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
  }): Promise<string> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const challengeData = {
      title: params.title,
      description: params.description,
      creatorId: user.uid,
      type: params.type,
      targetValue: params.targetValue,
      startDate: params.startDate,
      endDate: params.endDate,
      status: "pending" as ChallengeStatus,
      participants: [
        {
          userId: user.uid,
          displayName: user.displayName || user.email || "Пользователь",
          photoUrl: user.photoURL || undefined,
          joinedAt: new Date().toISOString(),
          currentValue: 0,
        },
      ],
      isSystem: params.isSystem ?? false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(this.challengesCol, challengeData);
    return docRef.id;
  }

  async getChallenge(id: string): Promise<Challenge | null> {
    const docRef = doc(this.challengesCol, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return challengeFromDoc(id, docSnap.data());
  }

  async getActiveChallenges(): Promise<Challenge[]> {
    const q = query(
      this.challengesCol,
      where("status", "==", "active"),
      orderBy("endDate", "asc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => challengeFromDoc(d.id, d.data()));
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    const q = query(
      this.challengesCol,
      where("participants", "array-contains", { userId }),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => challengeFromDoc(d.id, d.data()));
  }

  async joinChallenge(challengeId: string): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const docRef = doc(this.challengesCol, challengeId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Challenge not found");

    const challenge = challengeFromDoc(challengeId, docSnap.data());
    const alreadyJoined = challenge.participants.some((p) => p.userId === user.uid);
    if (alreadyJoined) throw new Error("Already joined");

    const newParticipant: ChallengeParticipant = {
      userId: user.uid,
      displayName: user.displayName || user.email || "Пользователь",
      photoUrl: user.photoURL || undefined,
      joinedAt: new Date().toISOString(),
      currentValue: 0,
    };

    await updateDoc(docRef, {
      participants: [...challenge.participants, newParticipant],
    });
  }

  async updateParticipantValue(challengeId: string, userId: string, currentValue: number): Promise<void> {
    const docRef = doc(this.challengesCol, challengeId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const challenge = challengeFromDoc(challengeId, docSnap.data());
    const updatedParticipants = challenge.participants.map((p) =>
      p.userId === userId ? { ...p, currentValue } : p,
    );

    await updateDoc(docRef, { participants: updatedParticipants });
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

  async getSystemChallenges(): Promise<Challenge[]> {
    const q = query(
      this.challengesCol,
      where("isSystem", "==", true),
      where("status", "in", ["pending", "active"]),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => challengeFromDoc(d.id, d.data()));
  }

  async checkAndCompleteExpiredChallenges(): Promise<{ completed: number; winners: string[] }> {
    const now = new Date().toISOString();
    const activeQ = query(
      this.challengesCol,
      where("status", "==", "active"),
    );
    const snapshot = await getDocs(activeQ);
    let completed = 0;
    const winners: string[] = [];

    const batch = snapshot.docs.filter((d) => {
      const data = d.data();
      return data.endDate && data.endDate < now;
    });

    for (const docSnap of batch) {
      const data = docSnap.data();
      const participants: ChallengeParticipant[] = data.participants ?? [];
      if (participants.length === 0) continue;

      const sorted = [...participants].sort((a, b) => b.currentValue - a.currentValue);
      const winnerId = sorted[0].userId;

      await updateDoc(doc(this.challengesCol, docSnap.id), {
        status: "completed",
        winnerId,
        completedAt: now,
      });

      completed++;
      winners.push(winnerId);
    }

    return { completed, winners };
  }
}
