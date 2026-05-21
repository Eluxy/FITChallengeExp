import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  limit,
  Timestamp,
} from "firebase/firestore";

export type ChatMessage = {
  id: string;
  challengeId: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: string;
};

export class FirebaseChatRepository {
  private getMessagesCol(challengeId: string) {
    return collection(getFirebaseDb(), "challenges", challengeId, "messages");
  }

  async sendMessage(challengeId: string, text: string): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    await addDoc(this.getMessagesCol(challengeId), {
      challengeId,
      userId: user.uid,
      displayName: user.displayName || user.email || "Пользователь",
      text,
      createdAt: new Date().toISOString(),
    });
  }

  async getMessages(challengeId: string, messageLimit = 50): Promise<ChatMessage[]> {
    const q = query(
      this.getMessagesCol(challengeId),
      orderBy("createdAt", "desc"),
      limit(messageLimit),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as ChatMessage))
      .reverse();
  }

  subscribeToMessages(
    challengeId: string,
    onMessages: (messages: ChatMessage[]) => void,
  ): () => void {
    const q = query(
      this.getMessagesCol(challengeId),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ChatMessage[];
      onMessages(messages);
    });

    return unsubscribe;
  }
}
