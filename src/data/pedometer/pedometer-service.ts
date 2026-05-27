import { Pedometer } from "expo-sensors";
import { PermissionsAndroid, Platform } from "react-native";

function getDayRange() {
  const now = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

export async function getTodaySteps(): Promise<number> {
  if (Platform.OS === "android") {
    console.log("📱 Pedometer: getStepCountAsync not supported on Android");
    return 0;
  }
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    console.log("📱 Pedometer available:", isAvailable);
    if (!isAvailable) return 0;
    const { start, end } = getDayRange();
    const result = await Pedometer.getStepCountAsync(start, end);
    console.log("📱 Pedometer steps (iOS):", result.steps);
    return result.steps;
  } catch (err) {
    console.log("📱 Pedometer error:", err);
    return 0;
  }
}

export type PedometerSubscription = {
  remove: () => void;
};

export function subscribeToStepDeltas(
  onDelta: (steps: number) => void,
): PedometerSubscription {
  const subscription = Pedometer.watchStepCount((result) => {
    onDelta(result.steps);
  });

  return {
    remove: () => subscription.remove(),
  };
}

export async function requestPedometerPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
      {
        title: "Разрешение на отслеживание активности",
        message: "Приложению нужен доступ к датчикам шагов для подсчёта пройденных шагов",
        buttonPositive: "Разрешить",
        buttonNegative: "Запретить",
      },
    );
    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    console.log("📱 Activity Recognition permission:", granted ? "granted" : "denied");
    return granted;
  } catch (err) {
    console.log("📱 Permission request error:", err);
    return false;
  }
}

export async function isPedometerAvailable(): Promise<boolean> {
  try {
    return Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}
