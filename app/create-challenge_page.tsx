import { getFirebaseAuth } from "@/src/config/firebase";
import { FirebaseChallengeRepository } from "@/src/data/repositories/firebase-challenge-repository";
import { FirebaseFriendRepository, type FriendInfo } from "@/src/data/repositories/firebase-friend-repository";
import { sendPushToUser } from "@/src/services/notifications/notification-service";
import type { ChallengeType } from "@/src/domain/entities/challenge";
import { getChallengeUnit, getChallengeIcon } from "@/src/domain/entities/challenge";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

const CHALLENGE_TYPES: { type: ChallengeType; label: string }[] = [
  { type: "steps", label: "Шаги" },
  { type: "distance", label: "Дистанция" },
  { type: "calories", label: "Калории" },
  { type: "time", label: "Время" },
];

const DURATIONS = [
  { days: 1, label: "1 день" },
  { days: 3, label: "3 дня" },
  { days: 7, label: "Неделя" },
  { days: 14, label: "2 недели" },
  { days: 30, label: "Месяц" },
];

export default function CreateChallengePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { friendId, friendName } = useLocalSearchParams<{ friendId?: string; friendName?: string }>();
  const [title, setTitle] = useState(friendName ? `Челлендж с ${friendName}` : "");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChallengeType>("steps");
  const [targetValue, setTargetValue] = useState("");
  const [duration, setDuration] = useState(7);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  const repo = new FirebaseChallengeRepository();
  const friendRepo = new FirebaseFriendRepository();
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (friendId) {
      setSelectedFriendIds(new Set([friendId]));
    }
    loadFriends();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const friendsList = await friendRepo.getFriends();
      setFriends(friendsList);
    } catch (err) {
      console.log("Error loading friends:", err);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    const newSet = new Set(selectedFriendIds);
    if (newSet.has(friendId)) {
      newSet.delete(friendId);
    } else {
      newSet.add(friendId);
    }
    setSelectedFriendIds(newSet);
  };

  const getTargetPlaceholder = () => {
    switch (type) {
      case "steps": return "Например: 50000";
      case "distance": return "Например: 20 (км)";
      case "calories": return "Например: 5000 (ккал)";
      case "time": return "Например: 300 (мин)";
    }
  };

  const selectedFriends = friends.filter((f) => selectedFriendIds.has(f.userId));

  const handleCreate = async () => {
    setError(null);

    if (!currentUser) {
      setError("Войдите в аккаунт");
      return;
    }

    if (!title.trim()) {
      setError("Введите название челленджа");
      return;
    }
    if (!targetValue.trim() || parseInt(targetValue) <= 0) {
      setError("Введите корректное целевое значение");
      return;
    }

    setIsSaving(true);
    try {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      const participants = [
        {
          userId: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email || "Пользователь",
          photoUrl: currentUser.photoURL || undefined,
          joinedAt: new Date().toISOString(),
          currentValue: 0,
        },
      ];

      const invitedFriends: FriendInfo[] = [];
      for (const friend of selectedFriends) {
        participants.push({
          userId: friend.userId,
          displayName: friend.displayName,
          photoUrl: friend.photoUrl,
          joinedAt: new Date().toISOString(),
          currentValue: 0,
        });
        invitedFriends.push(friend);
      }

      const challengeId = await repo.createChallenge({
        title: title.trim(),
        description: description.trim(),
        type,
        targetValue: parseInt(targetValue),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        participants,
      });

      for (const friend of invitedFriends) {
        sendPushToUser(
          friend.userId,
          "Новый вызов!",
          `${currentUser.displayName || currentUser.email || "Пользователь"} приглашает вас в челлендж "${title.trim()}"`,
          { type: "challenge_invite", challengeId },
        );
      }

      const invitedCount = invitedFriends.length;
      if (invitedCount > 0) {
        Alert.alert(
          "Челлендж создан!",
          `${invitedCount} ${invitedCount === 1 ? "участник приглашён" : invitedCount < 5 ? "участника приглашены" : "участников приглашены"}.`,
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        router.back();
      }
    } catch (err: any) {
      setError(err.message || "Ошибка создания челленджа");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {friendName ? `ЧЕЛЛЕНДЖ С ${friendName.toUpperCase()}` : "СОЗДАТЬ ЧЕЛЛЕНДЖ"}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {selectedFriends.length > 0 && (
          <View style={styles.selectedFriends}>
            <Text style={styles.selectedFriendsTitle}>УЧАСТНИКИ ({selectedFriends.length})</Text>
            <View style={styles.badgeRow}>
              {selectedFriends.map((friend) => (
                <View key={friend.userId} style={styles.badge}>
                  <MaterialCommunityIcons name="account-circle" size={16} color={COLORS.accent} />
                  <Text style={styles.badgeText}>{friend.displayName}</Text>
                  <Pressable onPress={() => toggleFriend(friend.userId)} style={styles.badgeRemove}>
                    <MaterialCommunityIcons name="close" size={14} color={COLORS.muted} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        <Pressable
          style={styles.addFriendsBtn}
          onPress={() => setShowFriendSelector(!showFriendSelector)}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color={COLORS.accent} />
          <Text style={styles.addFriendsBtnText}>
            {showFriendSelector ? "Скрыть список" : "+ Добавить участников"}
          </Text>
        </Pressable>

        {showFriendSelector && (
          <View style={styles.friendSelectorCard}>
            {isLoadingFriends ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : friends.length === 0 ? (
              <Text style={styles.noFriendsText}>У вас пока нет друзей</Text>
            ) : (
              friends.map((friend) => {
                const isSelected = selectedFriendIds.has(friend.userId);
                return (
                  <Pressable
                    key={friend.userId}
                    style={[styles.friendRow, isSelected && styles.friendRowSelected]}
                    onPress={() => toggleFriend(friend.userId)}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                      size={24}
                      color={isSelected ? COLORS.accent : COLORS.muted}
                    />
                    <MaterialCommunityIcons name="account-circle" size={32} color={COLORS.accent} />
                    <Text style={[styles.friendName, isSelected && styles.friendNameSelected]}>
                      {friend.displayName}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#A4371D" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.label}>Название</Text>
          <TextInput
            style={styles.input}
            placeholder='Например: "Марафон выходного дня"'
            placeholderTextColor={COLORS.muted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Описание (необязательно)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Опишите челлендж"
            placeholderTextColor={COLORS.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Тип активности</Text>
          <View style={styles.typeRow}>
            {CHALLENGE_TYPES.map((t) => (
              <Pressable
                key={t.type}
                style={[styles.typeBtn, type === t.type && styles.typeActive]}
                onPress={() => setType(t.type)}
              >
                <MaterialCommunityIcons
                  name={getChallengeIcon(t.type) as any}
                  size={20}
                  color={type === t.type ? "#FFF" : COLORS.text}
                />
                <Text style={[styles.typeText, type === t.type && styles.typeTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Цель ({getChallengeUnit(type)})</Text>
          <TextInput
            style={styles.input}
            placeholder={getTargetPlaceholder()}
            placeholderTextColor={COLORS.muted}
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Длительность</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <Pressable
                key={d.days}
                style={[styles.durationBtn, duration === d.days && styles.durationActive]}
                onPress={() => setDuration(d.days)}
              >
                <Text style={[styles.durationText, duration === d.days && styles.durationTextActive]}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.createBtn,
              pressed && styles.btnPressed,
              isSaving && styles.btnDisabled,
            ]}
            onPress={handleCreate}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.createBtnText}>
                {selectedFriends.length > 0 ? `СОЗДАТЬ И ПРИГЛАСИТЬ (${selectedFriends.length})` : "СОЗДАТЬ ЧЕЛЛЕНДЖ"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  headerTitle: { fontSize: 18, color: COLORS.text, fontFamily: "Rimma_sans", flex: 1, textAlign: "center" },
  selectedFriends: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 3,
  },
  selectedFriendsTitle: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
  },
  badgeText: {
    fontSize: 13,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  badgeRemove: {
    marginLeft: 2,
  },
  addFriendsBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.cream,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
    elevation: 2,
  },
  addFriendsBtnText: {
    fontSize: 16,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
  friendSelectorCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 8,
    elevation: 3,
  },
  noFriendsText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    paddingVertical: 12,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 10,
    borderRadius: 10,
  },
  friendRowSelected: {
    backgroundColor: COLORS.cream,
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  friendNameSelected: {
    color: COLORS.accent,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE8E0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 14, color: "#A4371D" },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    elevation: 5,
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
  textArea: { minHeight: 70, textAlignVertical: "top" },
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
  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durationBtn: {
    backgroundColor: COLORS.cream,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  durationActive: { backgroundColor: COLORS.accent },
  durationText: { fontSize: 14, color: COLORS.text, fontFamily: "Rimma_sans" },
  durationTextActive: { color: "#FFF" },
  createBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  createBtnText: { fontSize: 18, color: "#FFF", fontFamily: "Rimma_sans" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
});
