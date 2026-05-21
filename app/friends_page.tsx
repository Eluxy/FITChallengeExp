import { useAuth } from "@/src/context/auth-context";
import { FirebaseFriendRepository, type FriendInfo, type FriendRequest, type UserSearchResult } from "@/src/data/repositories/firebase-friend-repository";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
  green: "#48B75A",
  red: "#D94A2B",
};

export default function FriendsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected } = useAuth();
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const repo = useRef(new FirebaseFriendRepository());

  const loadData = useCallback(async () => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        repo.current.getFriends(),
        repo.current.getPendingRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (err) {
      console.log("Error loading friends:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await repo.current.searchUsers(query.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSendRequest = async (userId: string, displayName: string) => {
    setProcessingUserId(userId);
    try {
      const result = await repo.current.sendFriendRequest(userId);
      if (result.success) {
        Alert.alert("Заявка отправлена", `Вы отправили заявку пользователю ${displayName}`);
        const updatedResults = searchResults.map((r) =>
          r.userId === userId ? { ...r, requestStatus: "sent" as const } : r,
        );
        setSearchResults(updatedResults);
      } else {
        Alert.alert("Внимание", result.message);
      }
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось отправить заявку");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const result = await repo.current.acceptFriendRequest(requestId);
      if (result.success) {
        await loadData();
      } else {
        Alert.alert("Внимание", result.message);
      }
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось принять заявку");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await repo.current.rejectFriendRequest(requestId);
      await loadData();
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось отклонить заявку");
    }
  };

  const handleRemoveFriend = async (friendUserId: string, friendName: string) => {
    Alert.alert(
      "Удалить друга",
      `Вы уверены, что хотите удалить ${friendName} из друзей?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await repo.current.removeFriend(friendUserId);
              if (result.success) {
                await loadData();
              } else {
                Alert.alert("Внимание", result.message);
              }
            } catch (err: any) {
              Alert.alert("Ошибка", err.message || "Не удалось удалить друга");
            }
          },
        },
      ],
    );
  };

  const renderSearchButton = (result: UserSearchResult) => {
    const isProcessing = processingUserId === result.userId;

    if (isProcessing) {
      return <ActivityIndicator size="small" color={COLORS.accent} />;
    }

    switch (result.requestStatus) {
      case "friends":
        return (
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="account-check" size={16} color={COLORS.green} />
            <Text style={styles.statusText}>Друг</Text>
          </View>
        );
      case "sent":
        return (
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.muted} />
            <Text style={styles.statusText}>Отправлено</Text>
          </View>
        );
      case "received":
        return (
          <Pressable
            style={styles.acceptBtnSmall}
            onPress={() => {
              const receivedReq = requests.find((r) => r.fromUserId === result.userId);
              if (receivedReq) {
                handleAcceptRequest(receivedReq.id);
              }
            }}
          >
            <MaterialCommunityIcons name="account-plus" size={16} color={COLORS.green} />
            <Text style={styles.acceptBtnSmallText}>Принять</Text>
          </Pressable>
        );
      default:
        return (
          <Pressable
            style={styles.addBtn}
            onPress={() => handleSendRequest(result.userId, result.displayName)}
          >
            <MaterialCommunityIcons name="account-plus" size={18} color="#FFF" />
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        );
    }
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>ДРУЗЬЯ</Text>
        <Pressable hitSlop={12} onPress={() => router.push("/friend-requests_page")}>
          <MaterialCommunityIcons name="account-plus-outline" size={28} color={COLORS.text} />
        </Pressable>
      </View>

      {!isConnected ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="account-off-outline" size={64} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>Войдите в аккаунт</Text>
          <Text style={styles.emptyText}>Чтобы видеть друзей и соревноваться с ними</Text>
        </View>
      ) : (
        <>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Найти друзей по имени..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <Pressable onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                <MaterialCommunityIcons name="close" size={18} color={COLORS.muted} />
              </Pressable>
            ) : null}
          </View>

          {isSearching ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>РЕЗУЛЬТАТЫ ПОИСКА</Text>
              {searchResults.map((result) => (
                <View key={result.userId} style={styles.friendRow}>
                  <MaterialCommunityIcons name="account-circle" size={40} color={COLORS.accent} />
                  <Text style={styles.friendName}>{result.displayName}</Text>
                  {renderSearchButton(result)}
                </View>
              ))}
            </View>
          ) : searchQuery.trim().length >= 2 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>Никого не найдено</Text>
              <Text style={styles.emptyText}>Попробуйте другой запрос</Text>
            </View>
          ) : null}

          {requests.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                ЗАЯВКИ ({requests.length})
              </Text>
              {requests.map((req) => (
                <View key={req.id} style={styles.requestRow}>
                  <MaterialCommunityIcons name="account-circle" size={40} color={COLORS.accent} />
                  <Text style={styles.friendName}>{req.fromName}</Text>
                  <View style={styles.requestActions}>
                    <Pressable
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptRequest(req.id)}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                    </Pressable>
                    <Pressable
                      style={styles.rejectBtn}
                      onPress={() => handleRejectRequest(req.id)}
                    >
                      <MaterialCommunityIcons name="close" size={18} color={COLORS.red} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              МОИ ДРУЗЬЯ ({friends.length})
            </Text>
            {isLoading ? (
              <ActivityIndicator size="large" color={COLORS.accent} style={{ paddingVertical: 20 }} />
            ) : friends.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <MaterialCommunityIcons name="account-group-outline" size={40} color={COLORS.muted} />
                <Text style={{ color: COLORS.muted, marginTop: 8 }}>Пока нет друзей</Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>Используйте поиск, чтобы найти друзей</Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.userId} style={styles.friendRow}>
                  <MaterialCommunityIcons name="account-circle" size={40} color={COLORS.accent} />
                  <Text style={styles.friendName}>{friend.displayName}</Text>
                  <Pressable
                    style={styles.challengeBtn}
                    onPress={() => router.push({
                      pathname: "/create-challenge_page",
                      params: { friendId: friend.userId, friendName: friend.displayName }
                    })}
                  >
                    <Text style={styles.challengeBtnText}>ВЫЗОВ</Text>
                  </Pressable>
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => handleRemoveFriend(friend.userId, friend.displayName)}
                  >
                    <MaterialCommunityIcons name="account-remove" size={16} color={COLORS.red} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </>
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
  headerTitle: { fontSize: 28, color: COLORS.text, fontFamily: "Rimma_sans" },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    gap: 12,
    elevation: 5,
  },
  emptyTitle: { fontSize: 24, color: COLORS.text, fontFamily: "Rimma_sans" },
  emptyText: { fontSize: 14, color: COLORS.muted, textAlign: "center" },
  searchBar: {
    backgroundColor: COLORS.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text, paddingVertical: 8 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    elevation: 5,
  },
  sectionTitle: { fontSize: 14, color: COLORS.muted, fontFamily: "Rimma_sans", paddingLeft: 4, marginBottom: 4 },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  friendName: { flex: 1, fontSize: 18, color: COLORS.text, fontFamily: "Rimma_sans" },
  challengeBtn: {
    backgroundColor: COLORS.cream,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  challengeBtnText: { fontSize: 13, color: COLORS.accent, fontFamily: "Rimma_sans" },
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 2,
  },
  addBtnText: { fontSize: 16, color: "#FFF", fontWeight: "bold" },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  requestActions: { flexDirection: "row", gap: 6 },
  acceptBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    backgroundColor: "#FDE8E0",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  statusText: { fontSize: 12, color: COLORS.muted, fontFamily: "Rimma_sans" },
  acceptBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  acceptBtnSmallText: { fontSize: 12, color: COLORS.green, fontFamily: "Rimma_sans" },
  removeBtn: {
    backgroundColor: "#FDE8E0",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
