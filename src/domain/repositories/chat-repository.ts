import type { ChatMessage } from "@/src/domain/entities/chat";

export interface ChatRepository {
  sendMessage(challengeId: string, text: string): Promise<void>;
  getMessages(challengeId: string, messageLimit?: number): Promise<ChatMessage[]>;
  subscribeToMessages(
    challengeId: string,
    onMessages: (messages: ChatMessage[]) => void,
  ): () => void;
}
