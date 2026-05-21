import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
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
import type { UserProfile } from "@/src/domain/entities/user-settings";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
};

export default function EditProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string>("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
        const data = docSnap.data() as UserProfile;
        setName(data.name || user.displayName || "");
        setAge(data.age ? String(data.age) : "");
        setGender(data.gender || "");
        setHeightCm(data.heightCm ? String(data.heightCm) : "");
        setWeightKg(data.weightKg ? String(data.weightKg) : "");
        setPhotoUrl(data.photoUrl || user.photoURL || "");
      } else {
        setName(user.displayName || "");
        setPhotoUrl(user.photoURL || "");
      }
    } catch (err) {
      console.log("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ошибка", "Нужен доступ к фото для загрузки аватара");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploadingPhoto(true);
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        if (!user) return;

        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();

        const storage = getStorage();
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        setPhotoUrl(downloadURL);
        await updateProfile(user, { photoURL: downloadURL });
      } catch (err) {
        console.log("Error uploading photo:", err);
        Alert.alert("Ошибка", "Не удалось загрузить фото");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const validateAndSave = () => {
    if (!name.trim()) {
      Alert.alert("Ошибка", "Введите имя");
      return;
    }
    if (age) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
        Alert.alert("Ошибка", "Введите корректный возраст (1-150)");
        return;
      }
    }
    if (heightCm) {
      const heightNum = parseFloat(heightCm);
      if (isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
        Alert.alert("Ошибка", "Введите корректный рост (50-250 см)");
        return;
      }
    }
    if (weightKg) {
      const weightNum = parseFloat(weightKg);
      if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
        Alert.alert("Ошибка", "Введите корректный вес (20-500 кг)");
        return;
      }
    }

    Alert.alert(
      "Сохранить изменения?",
      "Вы уверены, что хотите сохранить изменения в профиле?",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Сохранить", onPress: handleSave },
      ],
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirebaseDb();
      const profileData: UserProfile = {
        name: name.trim() || user.displayName || "",
        email: user.email || "",
        age: parseInt(age) || 0,
        gender: gender as UserProfile["gender"],
        heightCm: parseInt(heightCm) || 0,
        weightKg: parseInt(weightKg) || 0,
        goals: {
          dailySteps: 10000,
          dailyCalories: 2000,
          dailyDistanceKm: 5,
        },
        photoUrl: photoUrl || undefined,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), profileData, { merge: true });

      if (name.trim() && name.trim() !== user.displayName) {
        await updateProfile(user, { displayName: name.trim() });
      }

      Alert.alert("Профиль сохранён", "Ваши изменения успешно сохранены", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.log("Error saving profile:", err);
      Alert.alert("Ошибка", err.message || "Не удалось сохранить профиль");
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
    color: "#FFF",
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
  genderTextActive: { color: "#FFF" },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontSize: 18, color: "#FFF", fontFamily: "Rimma_sans" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
});
