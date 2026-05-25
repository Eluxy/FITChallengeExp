import { useThemeViewModel, type ThemeOption } from "@/src/presentation/view-models/use-theme-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

const THEME_OPTIONS: { key: ThemeOption; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: "system", label: "Системная", icon: "theme-light-dark" },
  { key: "light", label: "Светлая", icon: "white-balance-sunny" },
  { key: "dark", label: "Тёмная", icon: "moon-waning-crescent" },
];

export default function ThemePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selected, handleSelect } = useThemeViewModel();

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>ТЕМА ОФОРМЛЕНИЯ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="theme-light-dark" size={20} color={COLORS.muted} />
        <Text style={styles.infoText}>
          Выберите оформление приложения: светлая, тёмная или автоматическая (зависит от
          настроек системы)
        </Text>
      </View>

      <View style={styles.card}>
        {THEME_OPTIONS.map((option, index) => (
          <View key={option.key}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              style={styles.row}
              onPress={() => handleSelect(option.key)}
            >
              <MaterialCommunityIcons name={option.icon} size={24} color={COLORS.accent} />
              <Text style={styles.rowText}>{option.label}</Text>
              {selected === option.key && (
                <MaterialCommunityIcons name="check-circle" size={22} color={COLORS.accent} />
              )}
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
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
  headerTitle: { fontSize: 28, color: COLORS.text, fontFamily: "Rimma_sans" },
  infoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    alignItems: "center",
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.muted },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    elevation: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  rowText: { flex: 1, fontSize: 18, color: COLORS.text, fontFamily: "Rimma_sans" },
  divider: { height: 1, backgroundColor: "#EBDCC2" },
});
