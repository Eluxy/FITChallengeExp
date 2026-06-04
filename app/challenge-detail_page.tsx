import { useAuth } from "@/src/context/auth-context";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import {
  useChallengeDetailViewModel,
  type Challenge,
  getChallengeUnit,
  getChallengeIcon,
} from "@/src/presentation/view-models/use-challenge-detail-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChallengeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { colors } = useAppTheme();
  const s = createStyles(colors);
  const currentUser = firebaseUser;

  const {
    challenge,
    isLoading,
    isJoining,
    error,
    joinChallenge,
    deleteChallenge,
    refresh,
  } = useChallengeDetailViewModel(id);

  const handleDelete = () => {
    if (!challenge) return;
    Alert.alert(
      "Удалить челлендж",
      `Удалить "${challenge.title}"? Это действие необратимо.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            await deleteChallenge(challenge.id);
            router.back();
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={[s.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[s.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.muted }}>Челлендж не найден</Text>
      </View>
    );
  }

  const isParticipant = challenge.participants.some((p) => p.userId === currentUser?.uid);
  const isCreator = challenge.creatorId === currentUser?.uid;
  const sortedParticipants = [...challenge.participants].sort((a, b) => b.currentValue - a.currentValue);
  const winner = challenge.winnerId
    ? challenge.participants.find((p) => p.userId === challenge.winnerId)
    : null;
  const startDate = new Date(challenge.startDate).toLocaleDateString("ru-RU");
  const endDate = new Date(challenge.endDate).toLocaleDateString("ru-RU");

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>ЧЕЛЛЕНДЖ</Text>
        {isCreator ? (
          <Pressable onPress={handleDelete} hitSlop={12}>
            <MaterialCommunityIcons name="delete-outline" size={26} color={colors.error} />
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      {error ? (
        <View style={s.errorCard}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {challenge.status === "completed" && winner ? (
        <View style={s.winnerBanner}>
          <MaterialCommunityIcons name="crown" size={32} color={colors.gold} />
          <View style={s.winnerInfo}>
            <Text style={s.winnerLabel}>ПОБЕДИТЕЛЬ</Text>
            <Text style={s.winnerName}>{winner.displayName}</Text>
            <Text style={s.winnerValue}>
              {winner.currentValue.toLocaleString()} {getChallengeUnit(challenge.type)}
            </Text>
          </View>
          <MaterialCommunityIcons name="trophy" size={32} color={colors.gold} />
        </View>
      ) : challenge.status === "completed" ? (
        <View style={[s.winnerBanner, { borderColor: colors.muted }]}>
          <MaterialCommunityIcons name="flag-off" size={32} color={colors.muted} />
          <View style={s.winnerInfo}>
            <Text style={[s.winnerLabel]}>ЗАВЕРШЁН</Text>
            <Text style={[s.winnerName, { color: colors.muted }]}>Никто не выполнил</Text>
          </View>
        </View>
      ) : null}

      <View style={s.mainCard}>
        <MaterialCommunityIcons
          name={getChallengeIcon(challenge.type) as any}
          size={40}
          color={colors.accent}
        />
        <Text style={s.title}>{challenge.title}</Text>
        {challenge.description ? (
          <Text style={s.desc}>{challenge.description}</Text>
        ) : null}

        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Цель</Text>
            <Text style={s.metaValue}>
              {challenge.targetValue.toLocaleString()} {getChallengeUnit(challenge.type)}
            </Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Статус</Text>
            <Text style={[s.metaValue, { color: challenge.status === "active" ? colors.green : colors.accent }]}>
              {challenge.status === "active" ? "АКТИВЕН" : challenge.status === "completed" ? "ЗАВЕРШЁН" : challenge.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Старт</Text>
            <Text style={s.metaValue}>{startDate}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Финиш</Text>
            <Text style={s.metaValue}>{endDate}</Text>
          </View>
        </View>
      </View>

      {(challenge.status === "active" || challenge.status === "completed") && (
        <Pressable
          style={s.chatButton}
          onPress={() => router.push({
            pathname: "/chat_page",
            params: { challengeId: challenge.id, challengeTitle: challenge.title }
          })}
        >
          <MaterialCommunityIcons name="chat-processing" size={24} color={colors.accent} />
          <Text style={s.chatButtonText}>ЧАТ ЧЕЛЛЕНДЖА</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>
      )}

      <View style={s.participantsCard}>
        <Text style={s.sectionTitle}>
          УЧАСТНИКИ ({sortedParticipants.length})
        </Text>
        {sortedParticipants.map((p, index) => (
          <View key={p.userId} style={s.participantRow}>
            <Text style={s.rank}>#{index + 1}</Text>
            <View style={s.avatar}>
              <MaterialCommunityIcons name="account-circle" size={36} color={colors.accent} />
            </View>
            <View style={s.participantInfo}>
              <Text style={s.participantName}>
                {p.displayName}
                {p.userId === currentUser?.uid ? " (Вы)" : ""}
                {p.userId === challenge.winnerId ? " 👑" : ""}
              </Text>
              <Text style={s.participantValue}>
                {p.currentValue.toLocaleString()} {getChallengeUnit(challenge.type)}
              </Text>
            </View>
            {challenge.targetValue > 0 && (
              <View style={s.miniProgressTrack}>
                <View
                  style={[
                    s.miniProgressFill,
                    { width: `${Math.min((p.currentValue / challenge.targetValue) * 100, 100)}%` },
                  ]}
                />
              </View>
            )}
          </View>
        ))}

        {!isParticipant && challenge.status === "pending" ? (
          <Pressable
            style={({ pressed }) => [
              s.joinBtn,
              pressed && s.btnPressed,
              isJoining && s.btnDisabled,
            ]}
            onPress={joinChallenge}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={s.joinBtnText}>ПРИСОЕДИНИТЬСЯ</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cream,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    headerTitle: { fontSize: 28, color: colors.text, fontFamily: "Rimma_sans" },
    errorCard: {
      backgroundColor: colors.error + "15",
      borderRadius: 12,
      padding: 12,
    },
    errorText: { fontSize: 14, color: colors.error },
    winnerBanner: {
      backgroundColor: "#FFF8DC",
      borderRadius: 24,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      elevation: 5,
      borderWidth: 2,
      borderColor: colors.gold,
    },
    winnerInfo: { flex: 1, alignItems: "center" },
    winnerLabel: { fontSize: 12, color: colors.muted, fontFamily: "Rimma_sans" },
    winnerName: { fontSize: 22, color: colors.accent, fontFamily: "Rimma_sans" },
    winnerValue: { fontSize: 14, color: colors.muted },
    mainCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      alignItems: "center",
      gap: 8,
      elevation: 5,
    },
    title: { fontSize: 28, color: colors.text, fontFamily: "Rimma_sans", textAlign: "center" },
    desc: { fontSize: 14, color: colors.muted, textAlign: "center" },
    metaRow: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
      marginTop: 8,
    },
    metaItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: colors.cream,
      borderRadius: 12,
      padding: 10,
    },
    metaLabel: { fontSize: 12, color: colors.muted },
    metaValue: { fontSize: 16, color: colors.text, fontFamily: "Rimma_sans", marginTop: 2 },
    participantsCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      gap: 8,
      elevation: 5,
    },
    sectionTitle: { fontSize: 16, color: colors.muted, fontFamily: "Rimma_sans" },
    participantRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    rank: { fontSize: 18, color: colors.accent, fontFamily: "Rimma_sans", width: 30 },
    avatar: { width: 36 },
    participantInfo: { flex: 1 },
    participantName: { fontSize: 16, color: colors.text, fontFamily: "Rimma_sans" },
    participantValue: { fontSize: 13, color: colors.muted },
    miniProgressTrack: {
      width: 50,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.divider,
      overflow: "hidden",
    },
    miniProgressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.accent },
    joinBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    joinBtnText: { fontSize: 18, color: colors.bg, fontFamily: "Rimma_sans" },
    btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    btnDisabled: { opacity: 0.6 },
    chatButton: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      elevation: 5,
    },
    chatButtonText: {
      flex: 1,
      fontSize: 20,
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
  });
}
