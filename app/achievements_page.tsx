import { useAuth } from "@/src/context/auth-context";
import { useGoogleFitData } from "@/src/presentation/view-models/use-google-fit-data";
import { useAchievementsViewModel } from "@/src/presentation/view-models/use-achievements-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#F8EDAD",
  cream: "#F8EDAD",
  card: "#F8EDAD",
  text: "#ED7C30",
  accent: "#ED7C30",
  muted: "#B35A22",
  green: "#48B75A",
  gold: "#F5C518",
};

export default function AchievementsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected } = useAuth();
  const { steps, calories, distance } = useGoogleFitData();

  const {
    checkStats,
    dailyXp,
    levelInfo,
    levelProgress,
    achievements,
    unlockedCount,
    totalCount,
  } = useAchievementsViewModel(steps, calories, distance);

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
        <Text style={styles.headerTitle}>ДОСТИЖЕНИЯ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelLeft}>
          <MaterialCommunityIcons name="star-circle" size={48} color={COLORS.gold} />
          <View>
            <Text style={styles.levelTitle}>УРОВЕНЬ {levelInfo.level}</Text>
            <Text style={styles.levelSubtitle}>{levelInfo.title}</Text>
          </View>
        </View>
        <View style={styles.levelRight}>
          <Text style={styles.xpText}>{dailyXp} XP</Text>
          <View style={styles.levelProgressTrack}>
            <View
              style={[styles.levelProgressFill, { width: `${levelProgress.progress}%` }]}
            />
          </View>
          <Text style={styles.xpDetail}>
            {levelProgress.currentXp}/{levelProgress.nextLevelXp} XP
          </Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <MaterialCommunityIcons name="medal" size={48} color={COLORS.gold} />
        <Text style={styles.progressCount}>{unlockedCount} / {totalCount}</Text>
        <Text style={styles.progressLabel}>достижений разблокировано</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(unlockedCount / totalCount) * 100}%` },
            ]}
          />
        </View>
      </View>

      {!isConnected ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="account-off-outline" size={64} color={COLORS.muted} />
          <Text style={styles.emptyText}>Войдите в аккаунт для отслеживания достижений</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {achievements.map((achievement) => {
            const progress = achievement.progress(checkStats);
            const isUnlocked = achievement.condition(checkStats);
            const progressPercent = Math.min(Math.round((progress.current / progress.total) * 100), 100);

            return (
              <View
                key={achievement.id}
                style={[styles.achievementCard, !isUnlocked && styles.lockedCard]}
              >
                <MaterialCommunityIcons
                  name={achievement.icon as any}
                  size={36}
                  color={isUnlocked ? COLORS.gold : COLORS.muted}
                />
                <Text style={[styles.achievementTitle, !isUnlocked && styles.lockedText]}>
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
                <View style={styles.miniTrack}>
                  <View
                    style={[
                      styles.miniFill,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor: isUnlocked ? COLORS.gold : COLORS.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressNum}>
                  {progress.current}/{progress.total}
                </Text>
                {isUnlocked && (
                  <View style={styles.unlockedBadge}>
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
  levelCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 5,
  },
  levelLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelTitle: { fontSize: 22, color: COLORS.text, fontFamily: "Rimma_sans" },
  levelSubtitle: { fontSize: 13, color: COLORS.muted },
  levelRight: { alignItems: "flex-end", justifyContent: "center" },
  xpText: { fontSize: 18, color: COLORS.accent, fontFamily: "Rimma_sans" },
  levelProgressTrack: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EBDCC2",
    overflow: "hidden",
    marginTop: 4,
  },
  levelProgressFill: { height: "100%", borderRadius: 3, backgroundColor: COLORS.gold },
  xpDetail: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  progressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 4,
    elevation: 5,
  },
  progressCount: { fontSize: 36, color: COLORS.text, fontFamily: "Rimma_sans" },
  progressLabel: { fontSize: 14, color: COLORS.muted },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EBDCC2",
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.gold },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    gap: 12,
    elevation: 5,
  },
  emptyText: { fontSize: 16, color: COLORS.muted, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  achievementCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    width: "47%",
    alignItems: "center",
    gap: 4,
    elevation: 4,
    position: "relative",
  },
  lockedCard: { opacity: 0.5 },
  achievementTitle: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
    textAlign: "center",
  },
  lockedText: { color: COLORS.muted },
  achievementDesc: { fontSize: 11, color: COLORS.muted, textAlign: "center" },
  miniTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EBDCC2",
    overflow: "hidden",
    marginTop: 4,
  },
  miniFill: { height: "100%", borderRadius: 2 },
  progressNum: { fontSize: 11, color: COLORS.muted },
  unlockedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
});
