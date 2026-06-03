import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
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
        <Text style={s.headerTitle}>КОНФИДЕНЦИАЛЬНОСТЬ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.card}>
        <View style={s.sectionBlock}>
          <MaterialCommunityIcons name="shield-check" size={28} color={colors.accent} />
          <Text style={s.sectionTitle}>Ваши данные</Text>
          <Text style={s.sectionText}>
            Приложение синхронизирует ваши данные о физической активности через Google Fit и
            Firebase. Данные используются только для отображения вашего прогресса, участия в
            челленджах и общения с друзьями.
          </Text>
        </View>

        <View style={s.divider} />

        <View style={s.sectionBlock}>
          <MaterialCommunityIcons name="google-fit" size={28} color={colors.accent} />
          <Text style={s.sectionTitle}>Google Fit</Text>
          <Text style={s.sectionText}>
            Для получения данных о шагах, калориях и дистанции используется Google Fit API.
            Вы можете отозвать доступ в любое время через настройки Google Аккаунта.
          </Text>
        </View>

        <View style={s.divider} />

        <View style={s.sectionBlock}>
          <MaterialCommunityIcons name="firebase" size={28} color={colors.accent} />
          <Text style={s.sectionTitle}>Firebase</Text>
          <Text style={s.sectionText}>
            Firebase используется для аутентификации, хранения данных профиля, друзей и
            челленджей. Ваши данные не передаются третьим лицам и не используются для
            рекламы.
          </Text>
        </View>

        <View style={s.divider} />

        <View style={s.sectionBlock}>
          <MaterialCommunityIcons name="delete-outline" size={28} color={colors.error} />
          <Text style={s.sectionTitle}>Удаление данных</Text>
          <Text style={s.sectionText}>
            Вы можете удалить свой аккаунт и все связанные данные, обратившись в поддержку.
            После удаления восстановление невозможно.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cream,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    headerTitle: { fontSize: 28, color: colors.text, fontFamily: "Rimma_sans" },
    card: {
      backgroundColor: colors.card,
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
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    sectionText: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    divider: { height: 1, backgroundColor: colors.divider },
  });
}
