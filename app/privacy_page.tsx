import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
  red: "#D94A2B",
};

export default function PrivacyPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
        <Text style={styles.headerTitle}>КОНФИДЕНЦИАЛЬНОСТЬ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionBlock}>
          <MaterialCommunityIcons name="shield-check" size={28} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>Ваши данные</Text>
          <Text style={styles.sectionText}>
            Приложение синхронизирует ваши данные о физической активности через Google Fit и
            Firebase. Данные используются только для отображения вашего прогресса, участия в
            челленджах и общения с друзьями.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionBlock}>
          <MaterialCommunityIcons name="google-fit" size={28} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>Google Fit</Text>
          <Text style={styles.sectionText}>
            Для получения данных о шагах, калориях и дистанции используется Google Fit API.
            Вы можете отозвать доступ в любое время через настройки Google Аккаунта.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionBlock}>
          <MaterialCommunityIcons name="firebase" size={28} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>Firebase</Text>
          <Text style={styles.sectionText}>
            Firebase используется для аутентификации, хранения данных профиля, друзей и
            челленджей. Ваши данные не передаются третьим лицам и не используются для
            рекламы.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionBlock}>
          <MaterialCommunityIcons name="delete-outline" size={28} color={COLORS.red} />
          <Text style={styles.sectionTitle}>Удаление данных</Text>
          <Text style={styles.sectionText}>
            Вы можете удалить свой аккаунт и все связанные данные, обратившись в поддержку.
            После удаления восстановление невозможно.
          </Text>
        </View>
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    elevation: 5,
    gap: 0,
  },
  sectionBlock: {
    paddingVertical: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  divider: { height: 1, backgroundColor: "#EBDCC2" },
});
