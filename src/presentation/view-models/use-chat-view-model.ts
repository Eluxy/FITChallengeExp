import type { ChatMessage } from "@/src/domain/entities/chat";
import type { ChatRepository } from "@/src/domain/repositories/chat-repository";
import { useCallback, useEffect, useRef, useState } from "react";

export function useChatViewModel(
  chatRepository: ChatRepository,
  challengeId: string | undefined,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!challengeId) return;
    setIsLoading(false);

    const unsubscribe = chatRepository.subscribeToMessages(challengeId, (msgs) => {
      setMessages(msgs);
    });

    return unsubscribe;
  }, [challengeId, chatRepository]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !challengeId) return;
    try {
      await chatRepository.sendMessage(challengeId, text.trim());
      setText("");
    } catch (err) {
      console.log("Error sending message:", err);
    }
  }, [text, challengeId, chatRepository]);

  return {
    messages,
    text,
    setText,
    isLoading,
    handleSend,
  };
}
