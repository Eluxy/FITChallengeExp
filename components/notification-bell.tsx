import { useAuth } from "@/src/context/auth-context";
import { useServices } from "@/src/context/service-provider";
import { useNotificationsViewModel } from "@/src/presentation/view-models/use-notifications-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLORS = {
  text: "#ED7C30",
  accent: "#ED7C30",
  bg: "#F8EDAD",
};

type Props = {
  color?: string;
};

export function NotificationBell({ color = COLORS.text }: Props) {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { notificationRepository } = useServices();
  const { unreadCount } = useNotificationsViewModel(notificationRepository, firebaseUser?.uid);

  return (
    <Pressable
      onPress={() => router.push("/notifications_page")}
      hitSlop={12}
      style={styles.button}
    >
      <MaterialCommunityIcons name="bell-outline" size={26} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#f44336",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "bold",
  },
});
