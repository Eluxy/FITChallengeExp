import { useAuth } from "@/src/context/auth-context";
import { getFirebaseAuth } from "@/src/config/firebase";
import { getFirebaseDb } from "@/src/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import type { UserGoals } from "@/src/domain/entities/user-settings";
import { DEFAULT_GOALS } from "@/src/domain/entities/user-settings";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
};

export default function GoalsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dailySteps, setDailySteps] = useState(String(DEFAULT_GOALS.dailySteps));
  const [dailyCalories, setDailyCalories] = useState(String(DEFAULT_GOALS.dailyCalories));
  const [dailyDistance, setDailyDistance] = useState(String(DEFAULT_GOALS.dailyDistanceKm));

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      const db = getFirebaseDb();
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const goals = data.goals as UserGoals | undefined;
        if (goals) {
          setDailySteps(String(goals.dailySteps));
          setDailyCalories(String(goals.dailyCalories));
          setDailyDistance(String(goals.dailyDistanceKm));
        }
      }
    } catch (err) {
      console.log("Error loading goals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirebaseDb();
      const goals: UserGoals = {
        dailySteps: parseInt(dailySteps) || DEFAULT_GOALS.dailySteps,
        dailyCalories: parseInt(dailyCalories) || DEFAULT_GOALS.dailyCalories,
        dailyDistanceKm: parseFloat(dailyDistance) || DEFAULT_GOALS.dailyDistanceKm,
      };

      await setDoc(doc(db, "users", user.uid), { goals }, { merge: true });
      router.back();
    } catch (err) {
      console.log("Error saving goals:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>ЦЕЛИ АКТИВНОСТИ</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.muted} />
          <Text style={styles.infoText}>
            Установите ежедневные цели для шагов, калорий и дистанции
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.goalRow}>
            <MaterialCommunityIcons name="shoe-sneaker" size={28} color={COLORS.accent} />
            <View style={styles.goalInputWrap}>
              <Text style={styles.goalLabel}>Шаги в день</Text>
              <TextInput
                style={styles.goalInput}
                value={dailySteps}
                onChangeText={setDailySteps}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.goalRow}>
            <MaterialCommunityIcons name="fire" size={28} color={COLORS.accent} />
            <View style={styles.goalInputWrap}>
              <Text style={styles.goalLabel}>Калории в день (ккал)</Text>
              <TextInput
                style={styles.goalInput}
                value={dailyCalories}
                onChangeText={setDailyCalories}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.goalRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={28} color={COLORS.accent} />
            <View style={styles.goalInputWrap}>
              <Text style={styles.goalLabel}>Дистанция в день (км)</Text>
              <TextInput
                style={styles.goalInput}
                value={dailyDistance}
                onChangeText={setDailyDistance}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.btnPressed,
            isSaving && styles.btnDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>СОХРАНИТЬ ЦЕЛИ</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 20, color: COLORS.text, fontFamily: "Rimma_sans", flex: 1, textAlign: "center" },
  infoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    alignItems: "center",
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.muted },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    elevation: 5,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  goalInputWrap: { flex: 1 },
  goalLabel: { fontSize: 14, color: COLORS.muted, fontFamily: "Rimma_sans" },
  goalInput: {
    backgroundColor: COLORS.cream,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
    marginTop: 4,
  },
  divider: { height: 1, backgroundColor: "#EBDCC2", marginVertical: 4 },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 18, color: "#FFF", fontFamily: "Rimma_sans" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
});
