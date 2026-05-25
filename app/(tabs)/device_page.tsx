import { useAuth } from "@/src/context/auth-context";
import { useSwipeableTab } from "@/src/utils/use-swipeable-tab";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#F8EDAD",
  cream: "#F8EDAD", // Changed to match bg
  card: "#F8EDAD", // Changed to match bg
  text: "#ED7C30",
  accent: "#ED7C30", // Changed to match text
  muted: "#B35A22", // Darker shade for muted text
  green: "#48B75A",
} as const;

export default function DevicePage() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useAuth();
  const swipeHandlers = useSwipeableTab("device_page");

  const DEVICES = isConnected
    ? [
        { id: "1", name: "Google Fit", status: "Подключено", battery: "✓" },
        { id: "2", name: "Xiaomi Mi Band", status: "Доступно", battery: "—" },
      ]
    : [];

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      {...swipeHandlers}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>УСТРОЙСТВА</Text>
        <MaterialCommunityIcons
          name="plus-circle-outline"
          size={24}
          color={COLORS.muted}
          onPress={() => {}}
        />
      </View>

      <View style={styles.card}>
        {!isConnected ? (
          <View style={styles.notConnectedCard}>
            <MaterialCommunityIcons
              name="watch-variant"
              size={48}
              color={COLORS.muted}
            />
            <Text style={styles.notConnectedText}>
              Войдите в аккаунт, чтобы подключить устройства
            </Text>
          </View>
        ) : DEVICES.length === 0 ? (
          <View style={styles.notConnectedCard}>
            <MaterialCommunityIcons
              name="watch-variant"
              size={48}
              color={COLORS.muted}
            />
            <Text style={styles.notConnectedText}>
              Нет подключенных устройств
            </Text>
          </View>
        ) : (
          DEVICES.map((device) => (
            <Pressable
              key={device.id}
              style={styles.row}
              onPress={() => {
                if (device.name === "Xiaomi Mi Band") {
                  // TODO: Bluetooth LE scanning
                }
              }}
            >
              <View style={styles.left}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceStatus}>{device.status}</Text>
              </View>
              <Text style={styles.battery}>{device.battery}</Text>
            </Pressable>
          ))
        )}
      </View>

      {isConnected && (
        <View style={styles.syncCard}>
          <Text style={styles.syncTitle}>СИНХРОНИЗАЦИЯ</Text>
          <Text style={styles.syncText}>
            Данные обновляются автоматически каждые 2 минуты
          </Text>
          <Pressable
            style={styles.syncButton}
            onPress={() => {
              // Симуляция синхронизации
            }}
          >
            <Text style={styles.syncButtonText}>GOOGLE FIT ПОДКЛЮЧЕН</Text>
          </Pressable>
        </View>
      )}
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  notConnectedCard: {
    alignItems: "center",
    paddingVertical: 24,
  },
  notConnectedText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EBDCC2",
  },
  left: {
    flex: 1,
    marginRight: 10,
  },
  deviceName: {
    fontSize: 28,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  deviceStatus: {
    marginTop: -2,
    fontSize: 17,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  battery: {
    fontSize: 24,
    color: COLORS.green,
    fontFamily: "Rimma_sans",
  },
  syncCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  syncTitle: {
    fontSize: 24,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  syncText: {
    marginTop: 6,
    fontSize: 16,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  syncButton: {
    marginTop: 12,
    backgroundColor: COLORS.cream,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 10,
  },
  syncButtonText: {
    fontSize: 20,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
});
