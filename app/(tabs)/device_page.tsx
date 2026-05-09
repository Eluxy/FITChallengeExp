import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
  green: "#48B75A",
} as const;

const DEVICES = [
  { id: "1", name: "Mi Band 8", status: "Подключено", battery: "82%" },
  { id: "2", name: "Apple Watch", status: "Неактивно", battery: "—" },
  { id: "3", name: "Samsung Health", status: "Синхр. 2 мин назад", battery: "app" },
];

export default function DevicePage() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="watch-variant" size={26} color={COLORS.text} />
        <Text style={styles.headerTitle}>УСТРОЙСТВА</Text>
        <MaterialCommunityIcons name="plus-circle-outline" size={24} color={COLORS.text} />
      </View>

      <View style={styles.card}>
        {DEVICES.map((device) => (
          <View key={device.id} style={styles.row}>
            <View style={styles.left}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceStatus}>{device.status}</Text>
            </View>
            <Text style={styles.battery}>{device.battery}</Text>
          </View>
        ))}
      </View>

      <View style={styles.syncCard}>
        <Text style={styles.syncTitle}>СИНХРОНИЗАЦИЯ</Text>
        <Text style={styles.syncText}>Последняя синхронизация: сегодня, 21:35</Text>
        <View style={styles.syncButton}>
          <Text style={styles.syncButtonText}>СИНХРОНИЗИРОВАТЬ</Text>
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
