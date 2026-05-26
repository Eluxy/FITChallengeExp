import { useAuth } from "@/src/context/auth-context";
import { useServices } from "@/src/context/service-provider";
import { useNotificationsViewModel } from "@/src/presentation/view-models/use-notifications-view-model";
import type { AppNotification } from "@/src/domain/entities/notification";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NOTIF_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  challenge_invite: "flag-outline",
  challenge_win: "trophy",
  challenge_lose: "emoticon-sad-outline",
  challenge_end: "flag-checkered",
  challenge_join: "account-plus-outline",
  achievement: "star",
  friend_request: "account-plus",
  friend_accepted: "account-check",
  reminder: "bell-ring",
};

const NOTIF_COLORS: Record<string, string> = {
  challenge_invite: "#ED7C30",
  challenge_win: "#F5C518",
  challenge_lose: "#B35A22",
  challenge_end: "#B35A22",
  challenge_join: "#48B75A",
  achievement: "#F5C518",
  friend_request: "#48B75A",
  friend_accepted: "#48B75A",
  reminder: "#ED7C30",
};

const COLORS = {
  bg: "#F8EDAD",
  cream: "#F8EDAD",
  card: "#F8EDAD",
  text: "#ED7C30",
  accent: "#ED7C30",
  muted: "#B35A22",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins}м назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}д назад`;
  return new Date(dateStr).toLocaleDateString("ru-RU");
}

export default function NotificationsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { notificationRepository } = useServices();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationsViewModel(notificationRepository, firebaseUser?.uid);

  const handlePress = (notif: AppNotification) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }

    const data = notif.data;
    if (!data) return;

    if (data.challengeId) {
      router.push(`/challenge-detail_page?id=${data.challengeId}`);
    } else if (data.type === "achievement" || data.achievementId) {
      router.push("/achievements_page");
    } else if (data.type === "friend_request" || data.type === "friend_accepted") {
      router.push("/friends_page");
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>УВЕДОМЛЕНИЯ</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllAsRead} hitSlop={12}>
            <MaterialCommunityIcons name="check-all" size={26} color={COLORS.accent} />
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>Нет уведомлений</Text>
            <Text style={styles.emptyText}>Здесь будут появляться уведомления о челленджах, достижениях и друзьях</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {notifications.map((notif) => {
              const iconName = NOTIF_ICONS[notif.type] ?? "bell";
              const iconColor = NOTIF_COLORS[notif.type] ?? COLORS.text;

              return (
                <Pressable
                  key={notif.id}
                  style={[styles.notifRow, !notif.isRead && styles.notifUnread]}
                  onPress={() => handlePress(notif)}
                  onLongPress={() => deleteNotification(notif.id)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: iconColor + "20" }]}>
                    <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
                  </View>
                  <View style={styles.notifContent}>
                    <View style={styles.notifTop}>
                      <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleUnread]}>
                        {notif.title}
                      </Text>
                      {!notif.isRead && <View style={styles.dot} />}
                    </View>
                    <Text style={styles.notifBody} numberOfLines={2}>
                      {notif.body}
                    </Text>
                    <Text style={styles.notifTime}>{timeAgo(notif.createdAt)}</Text>
                  </View>
                </Pressable>
              );
            })}

            {unreadCount > 0 && (
              <Pressable style={styles.markAllBtn} onPress={markAllAsRead}>
                <MaterialCommunityIcons name="check-all" size={18} color={COLORS.accent} />
                <Text style={styles.markAllText}>Отметить все как прочитанные</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
    marginHorizontal: 18,
    marginBottom: 8,
  },
  headerTitle: { fontSize: 28, color: COLORS.text, fontFamily: "Rimma_sans" },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    gap: 12,
    elevation: 5,
  },
  emptyTitle: { fontSize: 24, color: COLORS.text, fontFamily: "Rimma_sans" },
  emptyText: { fontSize: 14, color: COLORS.muted, textAlign: "center" },
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 12,
    elevation: 5,
    gap: 4,
  },
  notifRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  notifUnread: {
    backgroundColor: COLORS.cream,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: { flex: 1 },
  notifTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notifTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
    flex: 1,
  },
  notifTitleUnread: {
    color: COLORS.text,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  notifBody: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  notifTime: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  markAllText: {
    fontSize: 14,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
});
