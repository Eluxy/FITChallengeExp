import { useAuth } from "@/src/context/auth-context";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { useFriendRequestsViewModel } from "@/src/presentation/view-models/use-friend-requests-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FriendRequestsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected } = useAuth();
  const { colors } = useAppTheme();
  const s = createStyles(colors);

  const { requests, isLoading, handleAccept, handleReject } = useFriendRequestsViewModel(
    isConnected,
  );

  const handleAcceptWithCheck = (id: string, req?: any) => {
    handleAccept(id, req);
  };

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>ЗАЯВКИ В ДРУЗЬЯ</Text>
        <View style={{ width: 28 }} />
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : requests.length === 0 ? (
        <View style={s.emptyCard}>
          <MaterialCommunityIcons name="account-plus-outline" size={64} color={colors.muted} />
          <Text style={s.emptyTitle}>Нет новых заявок</Text>
        </View>
      ) : (
        <View style={s.card}>
          {requests.map((req) => (
            <View key={req.id} style={s.requestRow}>
              <MaterialCommunityIcons name="account-circle" size={48} color={colors.accent} />
              <View style={s.requestInfo}>
                <Text style={s.requestName}>{req.fromName}</Text>
                <Text style={s.requestDate}>
                  {new Date(req.createdAt).toLocaleDateString("ru-RU")}
                </Text>
              </View>
              <View style={s.actions}>
                <Pressable
                  style={s.acceptBtn}
                   onPress={() => handleAccept(req.id, req)}
                >
                  <MaterialCommunityIcons name="check" size={20} color={colors.bg} />
                </Pressable>
                <Pressable
                  style={s.rejectBtn}
                  onPress={() => handleReject(req.id)}
                >
                  <MaterialCommunityIcons name="close" size={20} color={colors.muted} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
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
    headerTitle: { fontSize: 22, color: colors.text, fontFamily: "Rimma_sans" },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 40,
      alignItems: "center",
      elevation: 5,
    },
    emptyTitle: { fontSize: 20, color: colors.muted, fontFamily: "Rimma_sans", marginTop: 12 },
    card: {
      backgroundColor: colors.card,
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
      borderBottomColor: colors.divider,
    },
    requestInfo: { flex: 1 },
    requestName: { fontSize: 18, color: colors.text, fontFamily: "Rimma_sans" },
    requestDate: { fontSize: 12, color: colors.muted, marginTop: 2 },
    actions: { flexDirection: "row", gap: 8 },
    acceptBtn: {
      backgroundColor: colors.green,
      borderRadius: 16,
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    rejectBtn: {
      backgroundColor: colors.cream,
      borderRadius: 16,
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
