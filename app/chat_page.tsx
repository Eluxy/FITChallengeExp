import { useServices } from "@/src/context/service-provider";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { useChatViewModel } from "@/src/presentation/view-models/use-chat-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
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

export default function ChatPage() {
  const { challengeId, challengeTitle } = useLocalSearchParams<{
    challengeId: string;
    challengeTitle: string;
  }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { chatRepository } = useServices();
  const { colors } = useAppTheme();
  const s = createStyles(colors);
  const flatListRef = useRef<FlatList>(null);

  const { messages, text, setText, isLoading, handleSend } = useChatViewModel(
    chatRepository,
    challengeId,
  );

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>
          {challengeTitle ?? "Чат"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={s.messageList}
        contentContainerStyle={s.messageListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={s.messageBubble}>
            <Text style={s.messageAuthor}>{item.displayName}</Text>
            <Text style={s.messageText}>{item.text}</Text>
            <Text style={s.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.emptyChat}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={colors.muted} />
              <Text style={s.emptyText}>Начните общение в челлендже</Text>
            </View>
          ) : null
        }
      />

      <View style={s.inputBar}>
        <TextInput
          style={s.textInput}
          placeholder="Сообщение..."
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <Pressable
          style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <MaterialCommunityIcons
            name="send"
            size={22}
            color={text.trim() ? colors.bg : colors.muted}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cream,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    headerTitle: { fontSize: 20, color: colors.text, fontFamily: "Rimma_sans", flex: 1, textAlign: "center" },
    messageList: { flex: 1 },
    messageListContent: { paddingHorizontal: 14, paddingVertical: 12 },
    messageBubble: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 10,
      marginBottom: 8,
      maxWidth: "85%",
      alignSelf: "flex-start",
      elevation: 2,
    },
    messageAuthor: { fontSize: 12, color: colors.accent, fontFamily: "Rimma_sans", marginBottom: 2 },
    messageText: { fontSize: 15, color: colors.text },
    messageTime: { fontSize: 11, color: colors.muted, textAlign: "right", marginTop: 4 },
    emptyChat: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
    emptyText: { fontSize: 16, color: colors.muted, marginTop: 12 },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      backgroundColor: colors.cream,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      maxHeight: 100,
    },
    sendBtn: {
      backgroundColor: colors.accent,
      borderRadius: 22,
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { backgroundColor: colors.card },
  });
}
