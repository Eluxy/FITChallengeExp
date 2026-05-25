import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import type { UserProfile } from "@/src/domain/entities/user-settings";

export function useEditProfileViewModel() {
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
      if (!user) { setIsLoading(false); return; }

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

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

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
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  }, []);

  const validate = useCallback((): string | null => {
    if (!name.trim()) return "Введите имя";
    if (age) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) return "Введите корректный возраст (1-150)";
    }
    if (heightCm) {
      const heightNum = parseFloat(heightCm);
      if (isNaN(heightNum) || heightNum < 50 || heightNum > 250) return "Введите корректный рост (50-250 см)";
    }
    if (weightKg) {
      const weightNum = parseFloat(weightKg);
      if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) return "Введите корректный вес (20-500 кг)";
    }
    return null;
  }, [name, age, heightCm, weightKg]);

  const saveProfile = useCallback(async (): Promise<string | null> => {
    const validationError = validate();
    if (validationError) return validationError;

    setIsSaving(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return "Пользователь не найден";

      const db = getFirebaseDb();
      const profileData: UserProfile = {
        name: name.trim() || user.displayName || "",
        email: user.email || "",
        age: parseInt(age) || 0,
        gender: gender as UserProfile["gender"],
        heightCm: parseInt(heightCm) || 0,
        weightKg: parseInt(weightKg) || 0,
        goals: { dailySteps: 10000, dailyCalories: 2000, dailyDistanceKm: 5 },
        photoUrl: photoUrl || null,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
      if (name.trim() && name.trim() !== user.displayName) {
        await updateProfile(user, { displayName: name.trim() });
      }
      return null;
    } catch (err: any) {
      return err.message || "Не удалось сохранить профиль";
    } finally {
      setIsSaving(false);
    }
  }, [name, age, gender, heightCm, weightKg, photoUrl, validate]);

  return {
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
  };
}
