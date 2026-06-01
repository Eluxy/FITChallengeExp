export type ThemeColors = {
  bg: string;
  cream: string;
  card: string;
  text: string;
  accent: string;
  muted: string;
  green: string;
  divider: string;
  error: string;
  gold: string;
  silver: string;
  bronze: string;
  chartBar: string;
  shadow: string;
  tabBg: string;
  tabActive: string;
  tabInactive: string;
  overlay: string;
};

export type ThemeMode = "light" | "dark";

export const AppTheme: Record<ThemeMode, ThemeColors> = {
  light: {
    bg: "#F8EDAD",
    cream: "#F8EDAD",
    card: "#F8EDAD",
    text: "#ED7C30",
    accent: "#ED7C30",
    muted: "#B35A22",
    green: "#48B75A",
    divider: "#E8D699",
    error: "#A4371D",
    gold: "#F5C518",
    silver: "#A8A9AD",
    bronze: "#CD7F32",
    chartBar: "#ED7C30",
    shadow: "#000",
    tabBg: "#F8EDAD",
    tabActive: "#ED7C30",
    tabInactive: "#B35A22",
    overlay: "rgba(0,0,0,0.05)",
  },
  dark: {
    bg: "#1C1B18",
    cream: "#2D2A24",
    card: "#2D2A24",
    text: "#F8EDAD",
    accent: "#F8EDAD",
    muted: "#BFA57B",
    green: "#5CD06E",
    divider: "#3D3A32",
    error: "#E85530",
    gold: "#F5C518",
    silver: "#A8A9AD",
    bronze: "#CD7F32",
    chartBar: "#F8EDAD",
    shadow: "#000",
    tabBg: "#2D2A24",
    tabActive: "#F8EDAD",
    tabInactive: "#8A7D60",
    overlay: "rgba(255,255,255,0.08)",
  },
};
