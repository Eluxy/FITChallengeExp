import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import type { ChatMessage } from "@/src/domain/entities/chat";
import type { ChatRepository } from "@/src/domain/repositories/chat-repository";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  limit,
} from "firebase/firestore";

export class FirebaseChatRepository implements ChatRepository {
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
