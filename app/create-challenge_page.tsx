import { FirebaseChallengeRepository } from "@/src/data/repositories/firebase-challenge-repository";
import type { ChallengeType } from "@/src/domain/entities/challenge";
import { getChallengeUnit, getChallengeIcon } from "@/src/domain/entities/challenge";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

  const repo = new FirebaseChallengeRepository();

  const getTargetPlaceholder = () => {
    switch (type) {
      case "steps": return "Например: 50000";
      case "distance": return "Например: 20 (км)";
      case "calories": return "Например: 5000 (ккал)";
      case "time": return "Например: 300 (мин)";
    }
  };

  const handleCreate = async () => {
    setError(null);

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

      await repo.createChallenge({
        title: title.trim(),
        description: description.trim(),
        type,
        targetValue: parseInt(targetValue),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      router.back();
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
          <Text style={styles.headerTitle}>СОЗДАТЬ ЧЕЛЛЕНДЖ</Text>
          <View style={{ width: 28 }} />
        </View>

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
              <Text style={styles.createBtnText}>СОЗДАТЬ ЧЕЛЛЕНДЖ</Text>
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
  headerTitle: { fontSize: 22, color: COLORS.text, fontFamily: "Rimma_sans", flex: 1, textAlign: "center" },
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
