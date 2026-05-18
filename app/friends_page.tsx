import { useAuth } from "@/src/context/auth-context";
import { FirebaseFriendRepository, type FriendInfo, type FriendRequest } from "@/src/data/repositories/firebase-friend-repository";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  const [searchResults, setSearchResults] = useState<FriendInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
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

  const handleSendRequest = async (userId: string) => {
    try {
      await repo.current.sendFriendRequest(userId);
      setSearchResults([]);
      setSearchQuery("");
    } catch (err) {
      console.log("Error sending request:", err);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await repo.current.acceptFriendRequest(requestId);
      await loadData();
    } catch (err) {
      console.log("Error accepting request:", err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await repo.current.rejectFriendRequest(requestId);
      await loadData();
    } catch (err) {
      console.log("Error rejecting request:", err);
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
              placeholder="Найти друзей..."
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

          {searchResults.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>РЕЗУЛЬТАТЫ ПОИСКА</Text>
              {searchResults.map((result) => (
                <View key={result.userId} style={styles.friendRow}>
                  <MaterialCommunityIcons name="account-circle" size={40} color={COLORS.accent} />
                  <Text style={styles.friendName}>{result.displayName}</Text>
                  <Pressable
                    style={styles.addBtn}
                    onPress={() => handleSendRequest(result.userId)}
                  >
                    <Text style={styles.addBtnText}>+</Text>
                  </Pressable>
                </View>
              ))}
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
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.userId} style={styles.friendRow}>
                  <MaterialCommunityIcons name="account-circle" size={40} color={COLORS.accent} />
                  <Text style={styles.friendName}>{friend.displayName}</Text>
                  <Pressable style={styles.challengeBtn}>
                    <Text style={styles.challengeBtnText}>ВЫЗОВ</Text>
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
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 20, color: "#FFF", fontWeight: "bold" },
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
});
