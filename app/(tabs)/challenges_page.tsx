import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
  green: "#48B75A",
  red: "#D94A2B",
} as const;

const ACTIVE_CHALLENGES = [
  {
    id: "1",
    title: "10 000 ШАГОВ",
    subtitle: "Сегодня",
    progress: 68,
    reward: "+120 XP",
  },
  {
    id: "2",
    title: "2 500 ККАЛ",
    subtitle: "Неделя",
    progress: 74,
    reward: "+200 XP",
  },
];

const COMPLETED_CHALLENGES = [
  { id: "1", title: "7 ДНЕЙ ПОДРЯД", reward: "+300 XP" },
  { id: "2", title: "15 000 ШАГОВ", reward: "+180 XP" },
];

export default function ChallengesPage() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="flag-checkered" size={26} color={COLORS.text} />
        <Text style={styles.headerTitle}>ЧЕЛЛЕНДЖИ</Text>
        <MaterialCommunityIcons name="trophy-outline" size={24} color={COLORS.text} />
      </View>

      <View style={styles.switchCard}>
        <Text style={styles.switchActive}>АКТИВНЫЕ</Text>
        <Text style={styles.switchItem}>СЕЗОН</Text>
        <Text style={styles.switchItem}>АРХИВ</Text>
      </View>

      <View style={styles.statsCard}>
        {ACTIVE_CHALLENGES.map((challenge) => (
          <Pressable key={challenge.id} style={styles.challengeCard}>
            <View style={styles.challengeTopRow}>
              <View>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeSubtitle}>{challenge.subtitle}</Text>
              </View>
              <Text style={styles.challengeReward}>{challenge.reward}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${challenge.progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{challenge.progress}% выполнено</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.bestDayCard}>
        <Text style={styles.bestDayTop}>ЗАВЕРШЕННЫЕ</Text>
        {COMPLETED_CHALLENGES.map((challenge) => (
          <View key={challenge.id} style={styles.completedRow}>
            <MaterialCommunityIcons
              name="check-circle"
              size={18}
              color={COLORS.green}
              style={styles.completedIcon}
            />
            <Text style={styles.completedTitle}>{challenge.title}</Text>
            <Text style={styles.completedReward}>{challenge.reward}</Text>
          </View>
        ))}
        <View style={styles.newChallengeButton}>
          <MaterialCommunityIcons name="plus" size={18} color={COLORS.red} />
          <Text style={styles.newChallengeText}>СОЗДАТЬ ЧЕЛЛЕНДЖ</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 14,
  },
  header: {
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 34,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  switchCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  switchActive: {
    fontSize: 24,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  switchItem: {
    fontSize: 20,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  challengeCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  challengeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  challengeTitle: {
    fontSize: 28,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  challengeSubtitle: {
    marginTop: -4,
    fontSize: 18,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  challengeReward: {
    fontSize: 18,
    color: COLORS.green,
    fontFamily: "Rimma_sans",
  },
  progressTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#E8D7B8",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  progressText: {
    marginTop: 4,
    fontSize: 16,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  bestDayCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  bestDayTop: {
    fontSize: 20,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
    marginBottom: 4,
  },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
  },
  completedIcon: {
    marginRight: 8,
  },
  completedTitle: {
    flex: 1,
    fontSize: 22,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  completedReward: {
    fontSize: 16,
    color: COLORS.green,
    fontFamily: "Rimma_sans",
  },
  newChallengeButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
  },
  newChallengeText: {
    marginLeft: 4,
    fontSize: 18,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
});
