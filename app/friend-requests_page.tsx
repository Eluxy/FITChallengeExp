import { useAuth } from "@/src/context/auth-context";
import { useServices } from "@/src/context/service-provider";
import { useFriendRequestsViewModel } from "@/src/presentation/view-models/use-friend-requests-view-model";
import { sendPushToUser } from "@/src/services/notifications/notification-service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#F8EDAD",
  cream: "#F8EDAD",
  card: "#F8EDAD",
  text: "#ED7C30",
  accent: "#ED7C30",
  muted: "#B35A22",
  green: "#48B75A",
};

export default function FriendRequestsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected, userInfo } = useAuth();
  const { friendRepository } = useServices();

  const { requests, isLoading, handleAccept, handleReject } = useFriendRequestsViewModel(
    friendRepository,
    isConnected,
    (userId, title, body) => {
      sendPushToUser(userId, title, `${userInfo?.name || "Пользователь"} ${body}`, { type: "friend_accept" });
    },
  );

  const handleAcceptWithCheck = (id: string, req?: any) => {
    handleAccept(id, req);
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>ЗАЯВКИ В ДРУЗЬЯ</Text>
        <View style={{ width: 28 }} />
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="account-plus-outline" size={64} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>Нет новых заявок</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {requests.map((req) => (
            <View key={req.id} style={styles.requestRow}>
              <MaterialCommunityIcons name="account-circle" size={48} color={COLORS.accent} />
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{req.fromName}</Text>
                <Text style={styles.requestDate}>
                  {new Date(req.createdAt).toLocaleDateString("ru-RU")}
                </Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.acceptBtn}
                   onPress={() => handleAccept(req.id, req)}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                </Pressable>
                <Pressable
                  style={styles.rejectBtn}
                  onPress={() => handleReject(req.id)}
                >
                  <MaterialCommunityIcons name="close" size={20} color={COLORS.muted} />
                </Pressable>
              </View>
            </View>
          ))}
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
  headerTitle: { fontSize: 22, color: COLORS.text, fontFamily: "Rimma_sans" },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    elevation: 5,
  },
  emptyTitle: { fontSize: 20, color: COLORS.muted, fontFamily: "Rimma_sans", marginTop: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    elevation: 5,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EBDCC2",
  },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 18, color: COLORS.text, fontFamily: "Rimma_sans" },
  requestDate: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
