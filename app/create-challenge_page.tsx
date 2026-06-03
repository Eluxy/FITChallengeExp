import { useServices } from "@/src/context/service-provider";
import { useAuth } from "@/src/context/auth-context";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import type { ChallengeType } from "@/src/domain/entities/challenge";
import { getChallengeUnit, getChallengeIcon } from "@/src/domain/entities/challenge";
import { useCreateChallengeViewModel } from "@/src/presentation/view-models/use-create-challenge-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
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
  const { challengeRepository, friendRepository } = useServices();
  const { firebaseUser } = useAuth();
  const { colors } = useAppTheme();
  const s = createStyles(colors);

  const vm = useCreateChallengeViewModel(
    challengeRepository,
    friendRepository,
    firebaseUser,
    (invitedCount) => {
      if (invitedCount > 0) {
        Alert.alert(
          "Челлендж создан!",
          `${invitedCount} ${invitedCount === 1 ? "участник приглашён" : invitedCount < 5 ? "участника приглашены" : "участников приглашены"}.`,
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        router.back();
      }
    },
    friendId,
    friendName,
  );

  const {
    title, setTitle,
    description, setDescription,
    type, setType,
    targetValue, setTargetValue,
    duration, setDuration,
    isSaving,
    error,
    friends,
    selectedFriendIds,
    selectedFriends,
    showFriendSelector, setShowFriendSelector,
    isLoadingFriends,
    toggleFriend,
    handleCreate,
  } = vm;

  const getTargetPlaceholder = () => {
    switch (type) {
      case "steps": return "Например: 50000";
      case "distance": return "Например: 20 (км)";
      case "calories": return "Например: 5000 (ккал)";
      case "time": return "Например: 300 (мин)";
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
          </Pressable>
          <Text style={s.headerTitle}>
            {friendName ? `ЧЕЛЛЕНДЖ С ${friendName.toUpperCase()}` : "СОЗДАТЬ ЧЕЛЛЕНДЖ"}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {selectedFriends.length > 0 && (
          <View style={s.selectedFriends}>
            <Text style={s.selectedFriendsTitle}>УЧАСТНИКИ ({selectedFriends.length})</Text>
            <View style={s.badgeRow}>
              {selectedFriends.map((friend) => (
                <View key={friend.userId} style={s.badge}>
                  <MaterialCommunityIcons name="account-circle" size={16} color={colors.accent} />
                  <Text style={s.badgeText}>{friend.displayName}</Text>
                  <Pressable onPress={() => toggleFriend(friend.userId)} style={s.badgeRemove}>
                    <MaterialCommunityIcons name="close" size={14} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        <Pressable
          style={s.addFriendsBtn}
          onPress={() => setShowFriendSelector(!showFriendSelector)}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color={colors.accent} />
          <Text style={s.addFriendsBtnText}>
            {showFriendSelector ? "Скрыть список" : "+ Добавить участников"}
          </Text>
        </Pressable>

        {showFriendSelector && (
          <View style={s.friendSelectorCard}>
            {isLoadingFriends ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : friends.length === 0 ? (
              <Text style={s.noFriendsText}>У вас пока нет друзей</Text>
            ) : (
              friends.map((friend) => {
                const isSelected = selectedFriendIds.has(friend.userId);
                return (
                  <Pressable
                    key={friend.userId}
                    style={[s.friendRow, isSelected && s.friendRowSelected]}
                    onPress={() => toggleFriend(friend.userId)}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                      size={24}
                      color={isSelected ? colors.accent : colors.muted}
                    />
                    <MaterialCommunityIcons name="account-circle" size={32} color={colors.accent} />
                    <Text style={[s.friendName, isSelected && s.friendNameSelected]}>
                      {friend.displayName}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {error ? (
          <View style={s.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={s.formCard}>
          <Text style={s.label}>Название</Text>
          <TextInput
            style={s.input}
            placeholder='Например: "Марафон выходного дня"'
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={s.label}>Описание (необязательно)</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Опишите челлендж"
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={s.label}>Тип активности</Text>
          <View style={s.typeRow}>
            {CHALLENGE_TYPES.map((t) => (
              <Pressable
                key={t.type}
                style={[s.typeBtn, type === t.type && s.typeActive]}
                onPress={() => setType(t.type)}
              >
                <MaterialCommunityIcons
                  name={getChallengeIcon(t.type) as any}
                  size={20}
                  color={type === t.type ? colors.bg : colors.text}
                />
                <Text style={[s.typeText, type === t.type && s.typeTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>Цель ({getChallengeUnit(type)})</Text>
          <TextInput
            style={s.input}
            placeholder={getTargetPlaceholder()}
            placeholderTextColor={colors.muted}
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="number-pad"
          />

          <Text style={s.label}>Длительность</Text>
          <View style={s.durationRow}>
            {DURATIONS.map((d) => (
              <Pressable
                key={d.days}
                style={[s.durationBtn, duration === d.days && s.durationActive]}
                onPress={() => setDuration(d.days)}
              >
                <Text style={[s.durationText, duration === d.days && s.durationTextActive]}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              s.createBtn,
              pressed && s.btnPressed,
              isSaving && s.btnDisabled,
            ]}
            onPress={handleCreate}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={s.createBtnText}>
                {selectedFriends.length > 0 ? `СОЗДАТЬ И ПРИГЛАСИТЬ (${selectedFriends.length})` : "СОЗДАТЬ ЧЕЛЛЕНДЖ"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 32 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cream,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 14,
    },
    headerTitle: { fontSize: 18, color: colors.text, fontFamily: "Rimma_sans", flex: 1, textAlign: "center" },
    selectedFriends: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      elevation: 3,
    },
    selectedFriendsTitle: {
      fontSize: 12,
      color: colors.muted,
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
      backgroundColor: colors.cream,
      borderRadius: 20,
      paddingVertical: 4,
      paddingHorizontal: 10,
      gap: 4,
    },
    badgeText: {
      fontSize: 13,
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    badgeRemove: {
      marginLeft: 2,
    },
    addFriendsBtn: {
      flexDirection: "row",
      backgroundColor: colors.cream,
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
      color: colors.accent,
      fontFamily: "Rimma_sans",
    },
    friendSelectorCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      gap: 8,
      elevation: 3,
    },
    noFriendsText: {
      fontSize: 14,
      color: colors.muted,
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
      backgroundColor: colors.cream,
    },
    friendName: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    friendNameSelected: {
      color: colors.accent,
    },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.error + "15",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      gap: 8,
    },
    errorText: { flex: 1, fontSize: 14, color: colors.error },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      gap: 12,
      elevation: 5,
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
    textArea: { minHeight: 70, textAlignVertical: "top" },
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
    durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    durationBtn: {
      backgroundColor: colors.cream,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    durationActive: { backgroundColor: colors.accent },
    durationText: { fontSize: 14, color: colors.text, fontFamily: "Rimma_sans" },
    durationTextActive: { color: colors.bg },
    createBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    createBtnText: { fontSize: 18, color: colors.bg, fontFamily: "Rimma_sans" },
    btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    btnDisabled: { opacity: 0.6 },
  });
}
