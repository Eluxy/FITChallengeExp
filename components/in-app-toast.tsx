import type { AppNotification } from "@/src/domain/entities/notification";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
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

const COLORS = {
  text: "#ED7C30",
  muted: "#B35A22",
  bg: "#F8EDAD",
  cream: "#FFF8DC",
};

type Props = {
  notification: AppNotification | null;
  onDismiss: () => void;
  onPress: (notif: AppNotification) => void;
};

export function InAppToast({ notification, onDismiss, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!notification) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 200,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const iconName = NOTIF_ICONS[notification.type] ?? "bell";

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        style={styles.toast}
        onPress={() => {
          onPress(notification);
          onDismiss();
        }}
      >
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={iconName} size={24} color={COLORS.text} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={10}>
          <MaterialCommunityIcons name="close" size={18} color={COLORS.muted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
  },
  toast: {
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1 },
  title: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  body: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
});
