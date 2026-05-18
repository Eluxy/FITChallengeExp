import { useAuth } from "@/src/context/auth-context";
import { getFirebaseAuth } from "@/src/config/firebase";
import { FirebaseChallengeRepository } from "@/src/data/repositories/firebase-challenge-repository";
import { useGoogleFitData } from "@/src/presentation/view-models/use-google-fit-data";
import type { Challenge } from "@/src/domain/entities/challenge";
import { getChallengeUnit, getChallengeIcon } from "@/src/domain/entities/challenge";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
  green: "#48B75A",
  red: "#D94A2B",
};

type Tab = "active" | "system" | "completed";

export default function ChallengesPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected } = useAuth();
  useGoogleFitData();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [systemChallenges, setSystemChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const repo = new FirebaseChallengeRepository();
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  const loadChallenges = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // Проверяем и завершаем истёкшие челленджи
      await repo.checkAndCompleteExpiredChallenges();

      const [allChallenges, system] = await Promise.all([
        repo.getUserChallenges(currentUser.uid),
        repo.getSystemChallenges(),
      ]);
      setActiveChallenges(allChallenges.filter((c) => c.status === "active" || c.status === "pending"));
      setSystemChallenges(system);
    } catch (err) {
      console.log("Error loading challenges:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const renderChallengeCard = (challenge: Challenge) => {
    const myParticipation = challenge.participants.find((p) => p.userId === currentUser?.uid);
    const myValue = myParticipation?.currentValue ?? 0;
    const progress = challenge.targetValue > 0
      ? Math.min(Math.round((myValue / challenge.targetValue) * 100), 100)
      : 0;

    return (
      <Pressable
        key={challenge.id}
        style={styles.challengeCard}
        onPress={() => router.push(`/challenge-detail_page?id=${challenge.id}`)}
      >
        <View style={styles.challengeTopRow}>
          <View style={styles.challengeLeft}>
            <MaterialCommunityIcons
              name={getChallengeIcon(challenge.type) as any}
              size={24}
              color={COLORS.accent}
            />
            <View>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeSubtitle}>
                {challenge.targetValue.toLocaleString()} {getChallengeUnit(challenge.type)}
                {challenge.isSystem ? " • Системный" : ""}
              </Text>
            </View>
          </View>
          <Text style={styles.challengeReward}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {challenge.participants.length} участников • до {new Date(challenge.endDate).toLocaleDateString("ru-RU")}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="flag-checkered" size={26} color={COLORS.text} />
        <Text style={styles.headerTitle}>ЧЕЛЛЕНДЖИ</Text>
        <MaterialCommunityIcons
          name="trophy-outline"
          size={24}
          color={COLORS.text}
          onPress={loadChallenges}
        />
      </View>

      <View style={styles.switchCard}>
        <Pressable onPress={() => setActiveTab("active")}>
          <Text style={activeTab === "active" ? styles.switchActive : styles.switchItem}>
            АКТИВНЫЕ
          </Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab("system")}>
          <Text style={activeTab === "system" ? styles.switchActive : styles.switchItem}>
            СИСТЕМНЫЕ
          </Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab("completed")}>
          <Text style={activeTab === "completed" ? styles.switchActive : styles.switchItem}>
            АРХИВ
          </Text>
        </Pressable>
      </View>

      {!isConnected ? (
        <View style={styles.notConnectedCard}>
          <MaterialCommunityIcons name="account-off-outline" size={48} color={COLORS.muted} />
          <Text style={styles.notConnectedText}>
            Войдите в аккаунт, чтобы участвовать в челленджах
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : activeTab === "active" ? (
        <View style={styles.listCard}>
          {activeChallenges.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialCommunityIcons name="flag-checkered" size={40} color={COLORS.muted} />
              <Text style={{ color: COLORS.muted, marginTop: 8 }}>Нет активных челленджей</Text>
            </View>
          ) : (
            activeChallenges.map(renderChallengeCard)
          )}
          <Pressable
            style={styles.newChallengeButton}
            onPress={() => router.push("/create-challenge_page")}
          >
            <MaterialCommunityIcons name="plus" size={18} color={COLORS.accent} />
            <Text style={styles.newChallengeText}>СОЗДАТЬ ЧЕЛЛЕНДЖ</Text>
          </Pressable>
        </View>
      ) : activeTab === "system" ? (
        <View style={styles.listCard}>
          {systemChallenges.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialCommunityIcons name="trophy-outline" size={40} color={COLORS.muted} />
              <Text style={{ color: COLORS.muted, marginTop: 8, textAlign: "center" }}>
                Системные челленджи появятся после настройки Cloud Functions
              </Text>
            </View>
          ) : (
            systemChallenges.map(renderChallengeCard)
          )}
        </View>
      ) : (
        <View style={styles.listCard}>
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <MaterialCommunityIcons name="archive-outline" size={40} color={COLORS.muted} />
            <Text style={{ color: COLORS.muted, marginTop: 8 }}>
              Завершённые челленджи
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 24, gap: 14 },
  header: {
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 34, color: COLORS.text, fontFamily: "Rimma_sans" },
  switchCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  switchActive: {
    fontSize: 24,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  switchItem: {
    fontSize: 20,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  notConnectedCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  notConnectedText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 14,
    elevation: 7,
  },
  challengeCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  challengeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  challengeLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  challengeTitle: {
    fontSize: 20,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  challengeSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
  },
  challengeReward: {
    fontSize: 18,
    color: COLORS.green,
    fontFamily: "Rimma_sans",
  },
  progressTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#E8D7B8",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  progressText: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },
  newChallengeButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
  },
  newChallengeText: {
    marginLeft: 4,
    fontSize: 18,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
});
