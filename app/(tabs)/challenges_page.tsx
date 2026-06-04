import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { useAuth } from "@/src/context/auth-context";
import { useGoogleFitData } from "@/src/presentation/view-models/use-google-fit-data";
import { useSwipeableTab } from "@/src/utils/use-swipeable-tab";
import {
  useChallengesViewModel,
  type Challenge,
  type ChallengeType,
  getChallengeUnit,
  getChallengeIcon,
} from "@/src/presentation/view-models/use-challenges-view-model";
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
  useGoogleFitData();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const swipeHandlers = useSwipeableTab("challenges_page");
  const { colors } = useAppTheme();
  const s = createStyles(colors);

  const {
    activeChallenges,
    dailyChallenges,
    completedChallenges,
    isLoading,
    refresh,
    createDailyChallenge,
    deleteChallenge,
  } = useChallengesViewModel(currentUserId, isConnected);

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
        style={s.challengeCard}
        onPress={() => router.push(`/challenge-detail_page?id=${challenge.id}`)}
      >
        <View style={s.challengeTopRow}>
          <View style={s.challengeLeft}>
            <MaterialCommunityIcons
              name={getChallengeIcon(challenge.type) as any}
              size={24}
              color={colors.accent}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.challengeTitle}>{challenge.title}</Text>
              <Text style={s.challengeSubtitle}>
                {challenge.targetValue.toLocaleString()}{" "}
                {getChallengeUnit(challenge.type)}
                {challenge.isSystem ? " • Ежедневный" : ""}
              </Text>
            </View>
          </View>
          {isCompleted && challenge.winnerId ? (
            <Text style={s.challengeWinner}>
              👑 {challenge.participants.find((p) => p.userId === challenge.winnerId)?.displayName ?? "Победитель"}
            </Text>
          ) : isCompleted ? (
            <Text style={[s.challengeWinner, { color: colors.muted }]}>Никто не выполнил</Text>
          ) : (
            <Text style={s.challengeReward}>{progress}%</Text>
          )}
        </View>

        {!isCompleted && (
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress}%` }]} />
          </View>
        )}

        <View style={s.challengeBottomRow}>
          <Text style={s.progressText}>
            {challenge.participants.length} участников • до{" "}
            {new Date(challenge.endDate).toLocaleDateString("ru-RU")}
          </Text>
          {showDelete && isCreator && (
            <Pressable
              onPress={() => handleDeleteChallenge(challenge)}
              hitSlop={8}
              style={s.deleteBtn}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  const renderDailyFormModal = () => (
    <Modal visible={showDailyForm} transparent animationType="slide">
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>НОВЫЙ ЕЖЕДНЕВНЫЙ ВЫЗОВ</Text>
            <Pressable onPress={() => setShowDailyForm(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <Text style={s.label}>Тип активности</Text>
          <View style={s.typeRow}>
            {CHALLENGE_TYPES.map((t) => (
              <Pressable
                key={t.type}
                style={[s.typeBtn, dailyType === t.type && s.typeActive]}
                onPress={() => setDailyType(t.type)}
              >
                <MaterialCommunityIcons
                  name={getChallengeIcon(t.type) as any}
                  size={20}
                  color={dailyType === t.type ? "#FFF" : colors.text}
                />
                <Text style={[s.typeText, dailyType === t.type && s.typeTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>
            Цель ({getChallengeUnit(dailyType)})
          </Text>
          <TextInput
            style={s.input}
            placeholder="Например: 10000"
            placeholderTextColor={colors.muted}
            value={dailyTarget}
            onChangeText={setDailyTarget}
            keyboardType="number-pad"
          />

          <Text style={s.hint}>
            Челлендж создаётся на 1 день. Выполняйте — и он автоматически завершится.
          </Text>

          <Pressable
            style={({ pressed }) => [
              s.createBtn,
              pressed && s.btnPressed,
              isCreatingDaily && s.btnDisabled,
            ]}
            onPress={handleCreateDaily}
            disabled={isCreatingDaily}
          >
            {isCreatingDaily ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.createBtnText}>СОЗДАТЬ ВЫЗОВ</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
      {...swipeHandlers}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>ЧЕЛЛЕНДЖИ</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <NotificationBell color={colors.text} />
        </View>
      </View>

      <View style={s.switchCard}>
        <Pressable onPress={() => setActiveTab("active")}>
          <Text
            style={
              activeTab === "active" ? s.switchActive : s.switchItem
            }
          >
            АКТИВНЫЕ
          </Text>
        </Pressable>
        <Text style={s.switchDivider}> | </Text>
        <Pressable onPress={() => setActiveTab("daily")}>
          <Text
            style={
              activeTab === "daily" ? s.switchActive : s.switchItem
            }
          >
            ЕЖЕДНЕВНЫЕ
          </Text>
        </Pressable>
        <Text style={s.switchDivider}> | </Text>
        <Pressable onPress={() => setActiveTab("completed")}>
          <Text
            style={
              activeTab === "completed" ? s.switchActive : s.switchItem
            }
          >
            АРХИВ
          </Text>
        </Pressable>
      </View>

      {!isConnected ? (
        <View style={s.notConnectedCard}>
          <MaterialCommunityIcons
            name="account-off-outline"
            size={48}
            color={colors.muted}
          />
          <Text style={s.notConnectedText}>
            Войдите в аккаунт, чтобы участвовать в челленджах
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : activeTab === "active" ? (
        <View style={s.listCard}>
          {activeChallenges.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialCommunityIcons
                name="flag-checkered"
                size={40}
                color={colors.muted}
              />
              <Text style={{ color: colors.muted, marginTop: 8 }}>
                Нет активных челленджей
              </Text>
            </View>
          ) : (
            activeChallenges.map((c) => renderChallengeCard(c))
          )}
          <Pressable
            style={s.newChallengeButton}
            onPress={() => router.push("/create-challenge_page")}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={colors.bg}
            />
            <Text style={s.newChallengeText}>СОЗДАТЬ ЧЕЛЛЕНДЖ</Text>
          </Pressable>
        </View>
      ) : activeTab === "daily" ? (
        <View style={s.listCard}>
          {dailyChallenges.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialCommunityIcons
                name="calendar-today"
                size={40}
                color={colors.muted}
              />
              <Text style={{ color: colors.muted, marginTop: 8, textAlign: "center" }}>
                Нет ежедневных вызовов
              </Text>
            </View>
          ) : (
            dailyChallenges.map((c) => renderChallengeCard(c, true))
          )}
          <Pressable
            style={s.newChallengeButton}
            onPress={() => setShowDailyForm(true)}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={colors.bg}
            />
            <Text style={s.newChallengeText}>+ ЕЖЕДНЕВНЫЙ ВЫЗОВ</Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.listCard}>
          {completedChallenges.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialCommunityIcons
                name="archive-outline"
                size={40}
                color={colors.muted}
              />
              <Text style={{ color: colors.muted, marginTop: 8 }}>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 24, gap: 14 },
    header: {
      backgroundColor: colors.cream,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    headerTitle: { fontSize: 34, color: colors.text, fontFamily: "Rimma_sans" },
    switchCard: {
      backgroundColor: colors.cream,
      borderRadius: 24,
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: "row",
    },
    switchActive: {
      fontSize: 17,
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    switchItem: {
      fontSize: 15,
      color: colors.muted,
      fontFamily: "Rimma_sans",
    },
    switchDivider: {
      color: colors.muted,
    },
    notConnectedCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 18,
    },
    notConnectedText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.muted,
      textAlign: "center",
      fontFamily: "Rimma_sans",
    },
    listCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 14,
      elevation: 7,
    },
    challengeCard: {
      backgroundColor: colors.cream,
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
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    challengeSubtitle: {
      fontSize: 13,
      color: colors.muted,
    },
    challengeReward: {
      fontSize: 18,
      color: colors.accent,
      fontFamily: "Rimma_sans",
    },
    challengeWinner: {
      fontSize: 13,
      color: colors.green,
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
      backgroundColor: colors.divider,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 6,
      backgroundColor: colors.accent,
    },
    progressText: {
      fontSize: 13,
      color: colors.muted,
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
      backgroundColor: colors.accent,
    },
    newChallengeText: {
      marginLeft: 4,
      fontSize: 18,
      color: colors.bg,
      fontFamily: "Rimma_sans",
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.bg,
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
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    label: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans" },
    input: {
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    hint: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "center",
      fontStyle: "italic",
    },
    typeRow: { flexDirection: "row", gap: 8 },
    typeBtn: {
      flex: 1,
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingVertical: 10,
    },
    typeActive: { backgroundColor: colors.accent },
    typeText: { fontSize: 12, color: colors.text, fontFamily: "Rimma_sans" },
    typeTextActive: { color: colors.bg },
    createBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
    },
    createBtnText: { fontSize: 18, color: colors.bg, fontFamily: "Rimma_sans" },
    btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    btnDisabled: { opacity: 0.6 },
  });
}
