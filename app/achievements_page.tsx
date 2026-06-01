import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { useAuth } from "@/src/context/auth-context";
import { useGoogleFitData } from "@/src/presentation/view-models/use-google-fit-data";
import { useAchievementsViewModel } from "@/src/presentation/view-models/use-achievements-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    levelCard: {
      backgroundColor: colors.card, borderRadius: 24, padding: 16,
      flexDirection: "row", justifyContent: "space-between",
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    levelLeft: { flexDirection: "row", gap: 10, alignItems: "center" },
    levelTitle: { fontSize: 22, color: colors.text, fontFamily: "Rimma_sans" },
    levelSubtitle: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans" },
    levelRight: { alignItems: "flex-end", justifyContent: "center" },
    xpText: { fontSize: 18, color: colors.accent, fontFamily: "Rimma_sans" },
    levelProgressTrack: {
      width: 100, height: 8, backgroundColor: colors.overlay,
      borderRadius: 4, marginTop: 4, overflow: "hidden",
    },
    levelProgressFill: { height: "100%", backgroundColor: colors.green, borderRadius: 4 },
    xpDetail: { fontSize: 10, color: colors.muted, marginTop: 2, fontFamily: "Rimma_sans" },
    progressCard: {
      backgroundColor: colors.card, borderRadius: 24, padding: 16, alignItems: "center",
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    progressCount: { marginTop: 6, fontSize: 36, color: colors.text, fontFamily: "Rimma_sans" },
    progressLabel: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans", marginTop: -2, marginBottom: 8 },
    progressTrack: { width: "80%", height: 10, backgroundColor: colors.overlay, borderRadius: 5, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: colors.green, borderRadius: 5 },
    emptyCard: {
      backgroundColor: colors.card, borderRadius: 24, padding: 32,
      alignItems: "center", justifyContent: "center",
    },
    emptyText: { marginTop: 12, fontSize: 14, color: colors.muted, textAlign: "center", fontFamily: "Rimma_sans" },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
    achievementCard: {
      width: "48%", backgroundColor: colors.card, borderRadius: 20, padding: 14, alignItems: "center",
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 5,
    },
    lockedCard: { opacity: 0.5 },
    achievementTitle: { marginTop: 6, fontSize: 14, color: colors.text, textAlign: "center", fontFamily: "Rimma_sans" },
    lockedText: { color: colors.muted },
    achievementDesc: { fontSize: 10, color: colors.muted, textAlign: "center", fontFamily: "Rimma_sans", marginTop: 2 },
    miniTrack: { marginTop: 8, width: "100%", height: 6, backgroundColor: colors.overlay, borderRadius: 3, overflow: "hidden" },
    miniFill: { height: "100%", borderRadius: 3 },
    progressNum: { marginTop: 2, fontSize: 10, color: colors.muted, fontFamily: "Rimma_sans" },
    unlockedBadge: {
      position: "absolute", top: 6, right: 6, backgroundColor: colors.green,
      borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center",
    },
  });
}

export default function AchievementsPage() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { isConnected } = useAuth();
  const { steps, calories, distance } = useGoogleFitData();
  const s = createStyles(colors);

  const {
    checkStats,
    dailyXp,
    levelInfo,
    levelProgress,
    achievements,
    unlockedSet,
    unlockedCount,
    totalCount,
  } = useAchievementsViewModel(steps, calories, isConnected, distance);

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
        <Text style={s.headerTitle}>ДОСТИЖЕНИЯ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.levelCard}>
        <View style={s.levelLeft}>
          <MaterialCommunityIcons name="star-circle" size={48} color={colors.gold} />
          <View>
            <Text style={s.levelTitle}>УРОВЕНЬ {levelInfo.level}</Text>
            <Text style={s.levelSubtitle}>{levelInfo.title}</Text>
          </View>
        </View>
        <View style={s.levelRight}>
          <Text style={s.xpText}>{dailyXp} XP</Text>
          <View style={s.levelProgressTrack}>
            <View style={[s.levelProgressFill, { width: `${levelProgress.progress}%` }]} />
          </View>
          <Text style={s.xpDetail}>
            {levelProgress.currentXp}/{levelProgress.nextLevelXp} XP
          </Text>
        </View>
      </View>

      <View style={s.progressCard}>
        <MaterialCommunityIcons name="medal" size={48} color={colors.gold} />
        <Text style={s.progressCount}>{unlockedCount} / {totalCount}</Text>
        <Text style={s.progressLabel}>достижений разблокировано</Text>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${(unlockedCount / totalCount) * 100}%` }]} />
        </View>
      </View>

      {!isConnected ? (
        <View style={s.emptyCard}>
          <MaterialCommunityIcons name="account-off-outline" size={64} color={colors.muted} />
          <Text style={s.emptyText}>Войдите в аккаунт для отслеживания достижений</Text>
        </View>
      ) : (
        <View style={s.grid}>
          {achievements.map((achievement) => {
            const progress = achievement.progress(checkStats);
            const isUnlocked = unlockedSet.has(achievement.id);
            const progressPercent = Math.min(Math.round((progress.current / progress.total) * 100), 100);

            return (
              <View key={achievement.id} style={[s.achievementCard, !isUnlocked && s.lockedCard]}>
                <MaterialCommunityIcons
                  name={achievement.icon as any} size={36}
                  color={isUnlocked ? colors.gold : colors.muted}
                />
                <Text style={[s.achievementTitle, !isUnlocked && s.lockedText]}>
                  {achievement.title}
                </Text>
                <Text style={s.achievementDesc}>{achievement.description}</Text>
                <View style={s.miniTrack}>
                  <View style={[s.miniFill, { width: `${progressPercent}%`, backgroundColor: isUnlocked ? colors.gold : colors.accent }]} />
                </View>
                <Text style={s.progressNum}>{progress.current}/{progress.total}</Text>
                {isUnlocked && (
                  <View style={s.unlockedBadge}>
                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
