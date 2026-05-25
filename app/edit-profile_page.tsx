import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useEditProfileViewModel } from "@/src/presentation/view-models/use-edit-profile-view-model";
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
  bg: "#F8EDAD",
  cream: "#F8EDAD",
  card: "#F8EDAD",
  text: "#ED7C30",
  accent: "#ED7C30",
  muted: "#B35A22",
};

export default function EditProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    isLoading,
    isSaving,
    isUploadingPhoto,
    name, setName,
    age, setAge,
    gender, setGender,
    heightCm, setHeightCm,
    weightKg, setWeightKg,
    photoUrl,
    pickImage,
    saveProfile,
  } = useEditProfileViewModel();

  const validateAndSave = async () => {
    const error = await saveProfile();
    if (error) {
      Alert.alert("Ошибка", error);
    } else {
      Alert.alert("Профиль сохранён", "Ваши изменения успешно сохранены", [
        { text: "OK", onPress: () => router.back() },
      ]);
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
          <Text style={styles.headerTitle}>РЕДАКТИРОВАТЬ ПРОФИЛЬ</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.formCard}>
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              {photoUrl ? (
                <Text style={styles.photoPlaceholder}>
                  {name.trim().charAt(0).toUpperCase() || "?"}
                </Text>
              ) : (
                <MaterialCommunityIcons name="account-circle" size={80} color={COLORS.accent} />
              )}
              {isUploadingPhoto && (
                <View style={styles.photoOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              )}
            </View>
            <Pressable
              style={styles.photoButton}
              onPress={pickImage}
              disabled={isUploadingPhoto}
            >
              <MaterialCommunityIcons name="camera" size={18} color="#FFF" />
              <Text style={styles.photoButtonText}>
                {isUploadingPhoto ? "Загрузка..." : photoUrl ? "Сменить фото" : "Добавить фото"}
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Имя"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Возраст"
            placeholderTextColor={COLORS.muted}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Пол</Text>
          <View style={styles.genderRow}>
            <Pressable
              style={[styles.genderBtn, gender === "male" && styles.genderActive]}
              onPress={() => setGender("male")}
            >
              <MaterialCommunityIcons name="gender-male" size={22} color={gender === "male" ? "#FFF" : COLORS.text} />
              <Text style={[styles.genderText, gender === "male" && styles.genderTextActive]}>Муж</Text>
            </Pressable>
            <Pressable
              style={[styles.genderBtn, gender === "female" && styles.genderActive]}
              onPress={() => setGender("female")}
            >
              <MaterialCommunityIcons name="gender-female" size={22} color={gender === "female" ? "#FFF" : COLORS.text} />
              <Text style={[styles.genderText, gender === "female" && styles.genderTextActive]}>Жен</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Рост (см)"
            placeholderTextColor={COLORS.muted}
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="decimal-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Вес (кг)"
            placeholderTextColor={COLORS.muted}
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
          />

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.btnPressed,
              isSaving && styles.btnDisabled,
            ]}
            onPress={validateAndSave}
            disabled={isSaving || isUploadingPhoto}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>СОХРАНИТЬ</Text>
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
  headerTitle: { fontSize: 20, color: COLORS.text, fontFamily: "Rimma_sans", flex: 1, textAlign: "center" },
  photoSection: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoPlaceholder: {
    fontSize: 40,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoButton: {
    flexDirection: "row",
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
  },
  photoButtonText: {
    fontSize: 14,
    color: COLORS.bg,
    fontFamily: "Rimma_sans",
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    elevation: 5,
  },
  input: {
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  label: { fontSize: 14, color: COLORS.muted, fontFamily: "Rimma_sans" },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingVertical: 12,
  },
  genderActive: { backgroundColor: COLORS.accent },
  genderText: { fontSize: 16, color: COLORS.text, fontFamily: "Rimma_sans" },
  genderTextActive: { color: COLORS.bg },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontSize: 18, color: COLORS.bg, fontFamily: "Rimma_sans" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
});
