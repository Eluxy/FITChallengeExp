import { useAuth } from "@/src/context/auth-context";
import { useServices } from "@/src/context/service-provider";
import { useNotificationsViewModel } from "@/src/presentation/view-models/use-notifications-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";

type Props = {
  color?: string;
};

export function NotificationBell({ color: _color }: Props) {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { notificationRepository } = useServices();
  const { colors } = useAppTheme();
  const color = _color ?? colors.text;
  const s = createStyles(colors);
  const { unreadCount } = useNotificationsViewModel(notificationRepository, firebaseUser?.uid);

  return (
    <Pressable
      onPress={() => router.push("/notifications_page")}
      hitSlop={12}
      style={s.button}
    >
      <MaterialCommunityIcons name="bell-outline" size={26} color={color} />
      {unreadCount > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      backgroundColor: colors.error,
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
}
