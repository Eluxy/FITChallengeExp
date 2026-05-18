import { FirebaseChatRepository, type ChatMessage } from "@/src/data/repositories/firebase-chat-repository";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
  green: "#48B75A",
};

export default function ChatPage() {
  const { challengeId, challengeTitle } = useLocalSearchParams<{
    challengeId: string;
    challengeTitle: string;
  }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const repo = useRef(new FirebaseChatRepository());
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!challengeId) return;
    setIsLoading(false);

    const unsubscribe = repo.current.subscribeToMessages(challengeId, (msgs) => {
      setMessages(msgs);
    });

    return unsubscribe;
  }, [challengeId]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !challengeId) return;
    try {
      await repo.current.sendMessage(challengeId, text.trim());
      setText("");
    } catch (err) {
      console.log("Error sending message:", err);
    }
  }, [text, challengeId]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {challengeTitle ?? "Чат"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            <Text style={styles.messageAuthor}>{item.displayName}</Text>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyChat}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>Начните общение в челлендже</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Сообщение..."
          placeholderTextColor={COLORS.muted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <Pressable
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <MaterialCommunityIcons
            name="send"
            size={22}
            color={text.trim() ? "#FFF" : COLORS.muted}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cream,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, color: COLORS.text, fontFamily: "Rimma_sans", flex: 1, textAlign: "center" },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 14, paddingVertical: 12 },
  messageBubble: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
    maxWidth: "85%",
    alignSelf: "flex-start",
    elevation: 2,
  },
  messageAuthor: { fontSize: 12, color: COLORS.accent, fontFamily: "Rimma_sans", marginBottom: 2 },
  messageText: { fontSize: 15, color: COLORS.text },
  messageTime: { fontSize: 11, color: COLORS.muted, textAlign: "right", marginTop: 4 },
  emptyChat: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, color: COLORS.muted, marginTop: 12 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: COLORS.cream,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: COLORS.card },
});
