import { useServices } from "@/src/context/service-provider";
import { useAuth } from "@/src/context/auth-context";
import type { Challenge } from "@/src/domain/entities/challenge";
import { getChallengeUnit, getChallengeIcon } from "@/src/domain/entities/challenge";
import { useChallengeDetailViewModel } from "@/src/presentation/view-models/use-challenge-detail-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#F8EDAD",
  cream: "#F8EDAD",
  card: "#F8EDAD",
  text: "#ED7C30",
  accent: "#ED7C30",
  muted: "#B35A22",
  green: "#48B75A",
  gold: "#F5C518",
};

export default function ChallengeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { challengeRepository } = useServices();
  const { firebaseUser } = useAuth();
  const currentUser = firebaseUser;

  const {
    challenge,
    isLoading,
    isJoining,
    error,
    joinChallenge,
  } = useChallengeDetailViewModel(challengeRepository, id);

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: COLORS.muted }}>Челлендж не найден</Text>
      </View>
    );
  }

  const isParticipant = challenge.participants.some((p) => p.userId === currentUser?.uid);
  const isCreator = challenge.creatorId === currentUser?.uid;
  const sortedParticipants = [...challenge.participants].sort((a, b) => b.currentValue - a.currentValue);
  const startDate = new Date(challenge.startDate).toLocaleDateString("ru-RU");
  const endDate = new Date(challenge.endDate).toLocaleDateString("ru-RU");

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>ЧЕЛЛЕНДЖ</Text>
        <View style={{ width: 28 }} />
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.mainCard}>
        <MaterialCommunityIcons
          name={getChallengeIcon(challenge.type) as any}
          size={40}
          color={COLORS.accent}
        />
        <Text style={styles.title}>{challenge.title}</Text>
        {challenge.description ? (
          <Text style={styles.desc}>{challenge.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Цель</Text>
            <Text style={styles.metaValue}>
              {challenge.targetValue.toLocaleString()} {getChallengeUnit(challenge.type)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Статус</Text>
            <Text style={[styles.metaValue, { color: challenge.status === "active" ? COLORS.green : COLORS.accent }]}>
              {challenge.status === "active" ? "АКТИВЕН" : challenge.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Старт</Text>
            <Text style={styles.metaValue}>{startDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Финиш</Text>
            <Text style={styles.metaValue}>{endDate}</Text>
          </View>
        </View>
      </View>

      {(challenge.status === "active" || challenge.status === "completed") && (
        <Pressable
          style={styles.chatButton}
          onPress={() => router.push({
            pathname: "/chat_page",
            params: { challengeId: challenge.id, challengeTitle: challenge.title }
          })}
        >
          <MaterialCommunityIcons name="chat-processing" size={24} color={COLORS.accent} />
          <Text style={styles.chatButtonText}>ЧАТ ЧЕЛЛЕНДЖА</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
        </Pressable>
      )}

      <View style={styles.participantsCard}>
        <Text style={styles.sectionTitle}>
          УЧАСТНИКИ ({sortedParticipants.length})
        </Text>
        {sortedParticipants.map((p, index) => (
          <View key={p.userId} style={styles.participantRow}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account-circle" size={36} color={COLORS.accent} />
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {p.displayName}
                {p.userId === currentUser?.uid ? " (Вы)" : ""}
                {p.userId === challenge.winnerId ? " 👑" : ""}
              </Text>
              <Text style={styles.participantValue}>
                {p.currentValue.toLocaleString()} {getChallengeUnit(challenge.type)}
              </Text>
            </View>
            {challenge.targetValue > 0 && (
              <View style={styles.miniProgressTrack}>
                <View
                  style={[
                    styles.miniProgressFill,
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
              styles.joinBtn,
              pressed && styles.btnPressed,
              isJoining && styles.btnDisabled,
            ]}
            onPress={joinChallenge}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.joinBtnText}>ПРИСОЕДИНИТЬСЯ</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 28, color: COLORS.text, fontFamily: "Rimma_sans" },
  errorCard: {
    backgroundColor: "#FDE8E0",
    borderRadius: 12,
    padding: 12,
  },
  errorText: { fontSize: 14, color: "#A4371D" },
  mainCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    gap: 8,
    elevation: 5,
  },
  title: { fontSize: 28, color: COLORS.text, fontFamily: "Rimma_sans", textAlign: "center" },
  desc: { fontSize: 14, color: COLORS.muted, textAlign: "center" },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  metaItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    padding: 10,
  },
  metaLabel: { fontSize: 12, color: COLORS.muted },
  metaValue: { fontSize: 16, color: COLORS.text, fontFamily: "Rimma_sans", marginTop: 2 },
  participantsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    gap: 8,
    elevation: 5,
  },
  sectionTitle: { fontSize: 16, color: COLORS.muted, fontFamily: "Rimma_sans" },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  rank: { fontSize: 18, color: COLORS.accent, fontFamily: "Rimma_sans", width: 30 },
  avatar: { width: 36 },
  participantInfo: { flex: 1 },
  participantName: { fontSize: 16, color: COLORS.text, fontFamily: "Rimma_sans" },
  participantValue: { fontSize: 13, color: COLORS.muted },
  miniProgressTrack: {
    width: 50,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EBDCC2",
    overflow: "hidden",
  },
  miniProgressFill: { height: "100%", borderRadius: 3, backgroundColor: COLORS.accent },
  joinBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  joinBtnText: { fontSize: 18, color: "#FFF", fontFamily: "Rimma_sans" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
  chatButton: {
    backgroundColor: COLORS.card,
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
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
});
