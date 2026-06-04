import { useAuth } from "@/src/context/auth-context";
import {
  useNotificationsViewModel,
  type AppNotification,
} from "@/src/presentation/view-models/use-notifications-view-model";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
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
  const { colors } = useAppTheme();
  const s = createStyles(colors);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationsViewModel(firebaseUser?.uid);

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
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>УВЕДОМЛЕНИЯ</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllAsRead} hitSlop={12}>
            <MaterialCommunityIcons name="check-all" size={26} color={colors.accent} />
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={s.emptyCard}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color={colors.muted} />
            <Text style={s.emptyTitle}>Нет уведомлений</Text>
            <Text style={s.emptyText}>Здесь будут появляться уведомления о челленджах, достижениях и друзьях</Text>
          </View>
        ) : (
          <View style={s.listCard}>
            {notifications.map((notif) => {
              const iconName = NOTIF_ICONS[notif.type] ?? "bell";
              const iconColor = NOTIF_COLORS[notif.type] ?? colors.text;

              return (
                <Pressable
                  key={notif.id}
                  style={[s.notifRow, !notif.isRead && s.notifUnread]}
                  onPress={() => handlePress(notif)}
                  onLongPress={() => deleteNotification(notif.id)}
                >
                  <View style={[s.iconCircle, { backgroundColor: iconColor + "20" }]}>
                    <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
                  </View>
                  <View style={s.notifContent}>
                    <View style={s.notifTop}>
                      <Text style={[s.notifTitle, !notif.isRead && s.notifTitleUnread]}>
                        {notif.title}
                      </Text>
                      {!notif.isRead && <View style={s.dot} />}
                    </View>
                    <Text style={s.notifBody} numberOfLines={2}>
                      {notif.body}
                    </Text>
                    <Text style={s.notifTime}>{timeAgo(notif.createdAt)}</Text>
                  </View>
                </Pressable>
              );
            })}

            {unreadCount > 0 && (
              <Pressable style={s.markAllBtn} onPress={markAllAsRead}>
                <MaterialCommunityIcons name="check-all" size={18} color={colors.accent} />
                <Text style={s.markAllText}>Отметить все как прочитанные</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
      marginHorizontal: 18,
      marginBottom: 8,
    },
    headerTitle: { fontSize: 28, color: colors.text, fontFamily: "Rimma_sans" },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 40,
      alignItems: "center",
      gap: 12,
      elevation: 5,
    },
    emptyTitle: { fontSize: 24, color: colors.text, fontFamily: "Rimma_sans" },
    emptyText: { fontSize: 14, color: colors.muted, textAlign: "center" },
    listCard: {
      backgroundColor: colors.card,
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
      backgroundColor: colors.cream,
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
      color: colors.text,
      fontFamily: "Rimma_sans",
      flex: 1,
    },
    notifTitleUnread: {
      color: colors.text,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    notifBody: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
    },
    notifTime: {
      fontSize: 11,
      color: colors.muted,
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
      color: colors.accent,
      fontFamily: "Rimma_sans",
    },
  });
}
