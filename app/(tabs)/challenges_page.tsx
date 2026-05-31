import { useAuth } from "@/src/context/auth-context";
import { useServices } from "@/src/context/service-provider";
import { useGoogleFitData } from "@/src/presentation/view-models/use-google-fit-data";
import { useSwipeableTab } from "@/src/utils/use-swipeable-tab";
import { useChallengesViewModel } from "@/src/presentation/view-models/use-challenges-view-model";
import type { Challenge, ChallengeType } from "@/src/domain/entities/challenge";
import {
  getChallengeUnit,
  getChallengeIcon,
} from "@/src/domain/entities/challenge";
import { NotificationBell } from "@/components/notification-bell";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#F8EDAD",
  cream: "#F8EDAD",
  card: "#F8EDAD",
  text: "#ED7C30",
  accent: "#ED7C30",
  muted: "#B35A22",
  green: "#4CAF50",
  red: "#f44336",
};

type Tab = "active" | "daily" | "completed";

const CHALLENGE_TYPES: { type: ChallengeType; label: string }[] = [
  { type: "steps", label: "Шаги" },
  { type: "distance", label: "Дистанция" },
  { type: "calories", label: "Калории" },
  { type: "time", label: "Время" },
];

export default function ChallengesPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected, firebaseUser } = useAuth();
  const currentUserId = firebaseUser?.uid;
  const { challengeRepository } = useServices();
  useGoogleFitData();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const swipeHandlers = useSwipeableTab("challenges_page");

  const {
    activeChallenges,
    dailyChallenges,
    completedChallenges,
    isLoading,
    refresh,
    createDailyChallenge,
    deleteChallenge,
  } = useChallengesViewModel(challengeRepository, currentUserId, isConnected);

  const [showDailyForm, setShowDailyForm] = useState(false);
  const [dailyType, setDailyType] = useState<ChallengeType>("steps");
  const [dailyTarget, setDailyTarget] = useState("");
  const [isCreatingDaily, setIsCreatingDaily] = useState(false);

  const handleCreateDaily = async () => {
    const val = parseInt(dailyTarget);
    if (!val || val <= 0) {
      Alert.alert("Ошибка", "Введите корректное целевое значение");
      return;
    }
    setIsCreatingDaily(true);
    try {
      await createDailyChallenge(dailyType, val);
      setShowDailyForm(false);
      setDailyTarget("");
      setDailyType("steps");
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось создать");
    } finally {
      setIsCreatingDaily(false);
    }
  };

  const handleDeleteChallenge = (challenge: Challenge) => {
    Alert.alert(
      "Удалить челлендж",
      `Удалить "${challenge.title}"? Это действие необратимо.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChallenge(challenge.id);
            } catch (err: any) {
              Alert.alert("Ошибка", err.message);
            }
          },
        },
      ],
    );
  };

  const renderChallengeCard = (challenge: Challenge, showDelete = false) => {
    const myParticipation = challenge.participants.find(
      (p) => p.userId === currentUserId,
    );
    const myValue = myParticipation?.currentValue ?? 0;
    const progress =
      challenge.targetValue > 0
        ? Math.min(Math.round((myValue / challenge.targetValue) * 100), 100)
        : 0;
    const isCompleted = challenge.status === "completed";
    const isCreator = challenge.creatorId === currentUserId;

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
            <View style={{ flex: 1 }}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeSubtitle}>
                {challenge.targetValue.toLocaleString()}{" "}
                {getChallengeUnit(challenge.type)}
                {challenge.isSystem ? " • Ежедневный" : ""}
              </Text>
            </View>
          </View>
          {isCompleted && challenge.winnerId ? (
            <Text style={styles.challengeWinner}>
              👑 {challenge.participants.find((p) => p.userId === challenge.winnerId)?.displayName ?? "Победитель"}
            </Text>
          ) : isCompleted ? (
            <Text style={[styles.challengeWinner, { color: COLORS.muted }]}>Никто не выполнил</Text>
          ) : (
            <Text style={styles.challengeReward}>{progress}%</Text>
          )}
        </View>

        {!isCompleted && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}

        <View style={styles.challengeBottomRow}>
          <Text style={styles.progressText}>
            {challenge.participants.length} участников • до{" "}
            {new Date(challenge.endDate).toLocaleDateString("ru-RU")}
          </Text>
          {showDelete && isCreator && (
            <Pressable
              onPress={() => handleDeleteChallenge(challenge)}
              hitSlop={8}
              style={styles.deleteBtn}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.red} />
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  const renderDailyFormModal = () => (
    <Modal visible={showDailyForm} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>НОВЫЙ ЕЖЕДНЕВНЫЙ ВЫЗОВ</Text>
            <Pressable onPress={() => setShowDailyForm(false)}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>

          <Text style={styles.label}>Тип активности</Text>
          <View style={styles.typeRow}>
            {CHALLENGE_TYPES.map((t) => (
              <Pressable
                key={t.type}
                style={[styles.typeBtn, dailyType === t.type && styles.typeActive]}
                onPress={() => setDailyType(t.type)}
              >
                <MaterialCommunityIcons
                  name={getChallengeIcon(t.type) as any}
                  size={20}
                  color={dailyType === t.type ? "#FFF" : COLORS.text}
                />
                <Text style={[styles.typeText, dailyType === t.type && styles.typeTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>
            Цель ({getChallengeUnit(dailyType)})
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Например: 10000"
            placeholderTextColor={COLORS.muted}
            value={dailyTarget}
            onChangeText={setDailyTarget}
            keyboardType="number-pad"
          />

          <Text style={styles.hint}>
            Челлендж создаётся на 1 день. Выполняйте — и он автоматически завершится.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.createBtn,
              pressed && styles.btnPressed,
              isCreatingDaily && styles.btnDisabled,
            ]}
            onPress={handleCreateDaily}
            disabled={isCreatingDaily}
          >
            {isCreatingDaily ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.createBtnText}>СОЗДАТЬ ВЫЗОВ</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
      {...swipeHandlers}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ЧЕЛЛЕНДЖИ</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <NotificationBell color={COLORS.text} />
        </View>
      </View>

      <View style={styles.switchCard}>
        <Pressable onPress={() => setActiveTab("active")}>
          <Text
            style={
              activeTab === "active" ? styles.switchActive : styles.switchItem
            }
          >
            АКТИВНЫЕ
          </Text>
        </Pressable>
        <Text style={styles.switchDivider}> | </Text>
        <Pressable onPress={() => setActiveTab("daily")}>
          <Text
            style={
              activeTab === "daily" ? styles.switchActive : styles.switchItem
            }
          >
            ЕЖЕДНЕВНЫЕ
          </Text>
        </Pressable>
        <Text style={styles.switchDivider}> | </Text>
        <Pressable onPress={() => setActiveTab("completed")}>
          <Text
            style={
              activeTab === "completed" ? styles.switchActive : styles.switchItem
            }
          >
            АРХИВ
          </Text>
        </Pressable>
      </View>

      {!isConnected ? (
        <View style={styles.notConnectedCard}>
          <MaterialCommunityIcons
            name="account-off-outline"
            size={48}
            color={COLORS.muted}
          />
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
              <MaterialCommunityIcons
                name="flag-checkered"
                size={40}
                color={COLORS.muted}
              />
              <Text style={{ color: COLORS.muted, marginTop: 8 }}>
                Нет активных челленджей
              </Text>
            </View>
          ) : (
            activeChallenges.map((c) => renderChallengeCard(c))
          )}
          <Pressable
            style={styles.newChallengeButton}
            onPress={() => router.push("/create-challenge_page")}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={COLORS.bg}
            />
            <Text style={styles.newChallengeText}>СОЗДАТЬ ЧЕЛЛЕНДЖ</Text>
          </Pressable>
        </View>
      ) : activeTab === "daily" ? (
        <View style={styles.listCard}>
          {dailyChallenges.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialCommunityIcons
                name="calendar-today"
                size={40}
                color={COLORS.muted}
              />
              <Text style={{ color: COLORS.muted, marginTop: 8, textAlign: "center" }}>
                Нет ежедневных вызовов
              </Text>
            </View>
          ) : (
            dailyChallenges.map((c) => renderChallengeCard(c, true))
          )}
          <Pressable
            style={styles.newChallengeButton}
            onPress={() => setShowDailyForm(true)}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={COLORS.bg}
            />
            <Text style={styles.newChallengeText}>+ ЕЖЕДНЕВНЫЙ ВЫЗОВ</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.listCard}>
          {completedChallenges.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialCommunityIcons
                name="archive-outline"
                size={40}
                color={COLORS.muted}
              />
              <Text style={{ color: COLORS.muted, marginTop: 8 }}>
                Ещё нет завершённых челленджей
              </Text>
            </View>
          ) : (
            completedChallenges.map((c) => renderChallengeCard(c, true))
          )}
        </View>
      )}

      {renderDailyFormModal()}
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
  },
  switchActive: {
    fontSize: 17,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  switchItem: {
    fontSize: 15,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  switchDivider: {
    color: COLORS.muted,
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
  challengeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
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
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
  challengeWinner: {
    fontSize: 13,
    color: COLORS.green,
    fontFamily: "Rimma_sans",
    maxWidth: 140,
    textAlign: "right",
  },
  challengeBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
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
    fontSize: 13,
    color: COLORS.muted,
  },
  deleteBtn: {
    padding: 4,
  },
  newChallengeButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
  },
  newChallengeText: {
    marginLeft: 4,
    fontSize: 18,
    color: COLORS.bg,
    fontFamily: "Rimma_sans",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  label: { fontSize: 14, color: COLORS.muted, fontFamily: "Rimma_sans" },
  input: {
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  hint: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    fontStyle: "italic",
  },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingVertical: 10,
  },
  typeActive: { backgroundColor: COLORS.accent },
  typeText: { fontSize: 12, color: COLORS.text, fontFamily: "Rimma_sans" },
  typeTextActive: { color: "#FFF" },
  createBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  createBtnText: { fontSize: 18, color: COLORS.bg, fontFamily: "Rimma_sans" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
});
