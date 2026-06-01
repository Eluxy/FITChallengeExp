import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
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

const THEME_OPTIONS: { key: ThemeOption; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: "system", label: "Системная", icon: "theme-light-dark" },
  { key: "light", label: "Светлая", icon: "white-balance-sunny" },
  { key: "dark", label: "Тёмная", icon: "moon-waning-crescent" },
];

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: colors.cream, borderRadius: 18,
      paddingHorizontal: 14, paddingVertical: 14,
    },
    headerTitle: { fontSize: 28, color: colors.text, fontFamily: "Rimma_sans" },
    infoCard: {
      flexDirection: "row", backgroundColor: colors.cream, borderRadius: 12,
      padding: 12, gap: 8, alignItems: "center",
    },
    infoText: { flex: 1, fontSize: 13, color: colors.muted },
    card: { backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, elevation: 5 },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
    rowText: { flex: 1, fontSize: 18, color: colors.text, fontFamily: "Rimma_sans" },
    divider: { height: 1, backgroundColor: colors.divider },
  });
}

export default function ThemePage() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { selected, handleSelect } = useThemeViewModel();
  const s = createStyles(colors);

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>ТЕМА ОФОРМЛЕНИЯ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.infoCard}>
        <MaterialCommunityIcons name="theme-light-dark" size={20} color={colors.muted} />
        <Text style={s.infoText}>
          Выберите оформление приложения: светлая, тёмная или автоматическая (зависит от
          настроек системы)
        </Text>
      </View>

      <View style={s.card}>
        {THEME_OPTIONS.map((option, index) => (
          <View key={option.key}>
            {index > 0 && <View style={s.divider} />}
            <Pressable style={s.row} onPress={() => handleSelect(option.key)}>
              <MaterialCommunityIcons name={option.icon} size={24} color={colors.accent} />
              <Text style={s.rowText}>{option.label}</Text>
              {selected === option.key && (
                <MaterialCommunityIcons name="check-circle" size={22} color={colors.accent} />
              )}
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
