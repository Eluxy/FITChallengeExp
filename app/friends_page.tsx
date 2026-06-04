import { useAuth } from "@/src/context/auth-context";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import {
  useFriendsViewModel,
  type UserSearchResult,
} from "@/src/presentation/view-models/use-friends-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function FriendsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected } = useAuth();
  const { colors } = useAppTheme();
  const s = createStyles(colors);

  const {
    friends,
    requests,
    searchQuery,
    searchResults,
    isLoading,
    isSearching,
    processingUserId,
    handleSearch,
    handleSendRequest,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend,
  } = useFriendsViewModel(isConnected);

  const handleRemoveFriendWithConfirm = (friendUserId: string, friendName: string) => {
    Alert.alert(
      "Удалить друга",
      `Вы уверены, что хотите удалить ${friendName} из друзей?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => handleRemoveFriend(friendUserId),
        },
      ],
    );
  };

  const renderSearchButton = (result: UserSearchResult) => {
    const isProcessing = processingUserId === result.userId;

    if (isProcessing) {
      return <ActivityIndicator size="small" color={colors.accent} />;
    }

    switch (result.requestStatus) {
      case "friends":
        return (
          <View style={s.statusBadge}>
            <MaterialCommunityIcons
              name="account-check"
              size={16}
              color={colors.green}
            />
            <Text style={s.statusText}>Друг</Text>
          </View>
        );
      case "sent":
        return (
          <View style={s.statusBadge}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.muted}
            />
            <Text style={s.statusText}>Отправлено</Text>
          </View>
        );
      case "received":
        return (
          <Pressable
            style={s.acceptBtnSmall}
            onPress={() => {
              const receivedReq = requests.find(
                (r) => r.fromUserId === result.userId,
              );
              if (receivedReq) {
                handleAcceptRequest(receivedReq.id);
              }
            }}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={16}
              color={colors.green}
            />
            <Text style={s.acceptBtnSmallText}>Принять</Text>
          </Pressable>
        );
      default:
        return (
          <Pressable
            style={s.addBtn}
            onPress={() => handleSendRequest(result.userId)}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={18}
              color={colors.bg}
            />
            <Text style={s.addBtnText}>+</Text>
          </Pressable>
        );
    }
  };

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color={colors.text}
          />
        </Pressable>
        <Text style={s.headerTitle}>ДРУЗЬЯ</Text>
        <Pressable
          hitSlop={12}
          onPress={() => router.push("/friend-requests_page")}
        >
          <MaterialCommunityIcons
            name="account-plus-outline"
            size={28}
            color={colors.text}
          />
        </Pressable>
      </View>

      {!isConnected ? (
        <View style={s.emptyCard}>
          <MaterialCommunityIcons
            name="account-off-outline"
            size={64}
            color={colors.muted}
          />
          <Text style={s.emptyTitle}>Войдите в аккаунт</Text>
          <Text style={s.emptyText}>
            Чтобы видеть друзей и соревноваться с ними
          </Text>
        </View>
      ) : (
        <>
          <View style={s.searchBar}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.muted}
            />
            <TextInput
              style={s.searchInput}
              placeholder="Найти друзей по имени..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <Pressable
                onPress={() => {
                  handleSearch("");
                }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            ) : null}
          </View>

          {isSearching ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : searchResults.length > 0 ? (
            <View style={s.card}>
              <Text style={s.sectionTitle}>РЕЗУЛЬТАТЫ ПОИСКА</Text>
              {searchResults.map((result) => (
                <View key={result.userId} style={s.friendRow}>
                  <MaterialCommunityIcons
                    name="account-circle"
                    size={40}
                    color={colors.accent}
                  />
                  <Text style={s.friendName}>{result.displayName}</Text>
                  {renderSearchButton(result)}
                </View>
              ))}
            </View>
          ) : searchQuery.trim().length >= 2 ? (
            <View style={s.emptyCard}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={48}
                color={colors.muted}
              />
              <Text style={s.emptyTitle}>Никого не найдено</Text>
              <Text style={s.emptyText}>Попробуйте другой запрос</Text>
            </View>
          ) : null}

          {requests.length > 0 ? (
            <View style={s.card}>
              <Text style={s.sectionTitle}>
                ЗАЯВКИ ({requests.length})
              </Text>
              {requests.map((req) => (
                <View key={req.id} style={s.requestRow}>
                  <MaterialCommunityIcons
                    name="account-circle"
                    size={40}
                    color={colors.accent}
                  />
                  <Text style={s.friendName}>{req.fromName}</Text>
                  <View style={s.requestActions}>
                    <Pressable
                      style={s.acceptBtn}
                      onPress={() => handleAcceptRequest(req.id)}
                    >
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={colors.bg}
                      />
                    </Pressable>
                    <Pressable
                      style={s.rejectBtn}
                      onPress={() => handleRejectRequest(req.id)}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color={colors.error}
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={s.card}>
            <Text style={s.sectionTitle}>
              МОИ ДРУЗЬЯ ({friends.length})
            </Text>
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.accent}
                style={{ paddingVertical: 20 }}
              />
            ) : friends.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={40}
                  color={colors.muted}
                />
                <Text style={{ color: colors.muted, marginTop: 8 }}>
                  Пока нет друзей
                </Text>
                <Text
                  style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}
                >
                  Используйте поиск, чтобы найти друзей
                </Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.userId} style={s.friendRow}>
                  <MaterialCommunityIcons
                    name="account-circle"
                    size={40}
                    color={colors.accent}
                  />
                  <Text style={s.friendName}>{friend.displayName}</Text>
                  <Pressable
                    style={s.challengeBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/create-challenge_page",
                        params: {
                          friendId: friend.userId,
                          friendName: friend.displayName,
                        },
                      })
                    }
                  >
                    <Text style={s.challengeBtnText}>ВЫЗОВ</Text>
                  </Pressable>
                  <Pressable
                    style={s.removeBtn}
                    onPress={() =>
                      handleRemoveFriendWithConfirm(friend.userId, friend.displayName)
                    }
                  >
                    <MaterialCommunityIcons
                      name="account-remove"
                      size={16}
                      color={colors.error}
                    />
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
    headerTitle: { fontSize: 28, color: colors.text, fontFamily: "Rimma_sans" },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 40,
      alignItems: "center",
      gap: 12,
      elevation: 5,
    },
    emptyTitle: { fontSize: 24, color: colors.text, fontFamily: "Rimma_sans" },
    emptyText: { fontSize: 14, color: colors.muted, textAlign: "center" },
    searchBar: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 8,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      elevation: 5,
    },
    sectionTitle: {
      fontSize: 14,
      color: colors.muted,
      fontFamily: "Rimma_sans",
      paddingLeft: 4,
      marginBottom: 4,
    },
    friendRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      gap: 12,
    },
    friendName: {
      flex: 1,
      fontSize: 18,
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    challengeBtn: {
      backgroundColor: colors.cream,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    challengeBtnText: {
      fontSize: 13,
      color: colors.accent,
      fontFamily: "Rimma_sans",
    },
    addBtn: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
      paddingHorizontal: 8,
      gap: 2,
    },
    addBtnText: { fontSize: 16, color: colors.bg, fontWeight: "bold" },
    requestRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      gap: 12,
    },
    requestActions: { flexDirection: "row", gap: 6 },
    acceptBtn: {
      backgroundColor: colors.green,
      borderRadius: 14,
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    rejectBtn: {
      backgroundColor: colors.error + "15",
      borderRadius: 14,
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 8,
      gap: 4,
    },
    statusText: { fontSize: 12, color: colors.muted, fontFamily: "Rimma_sans" },
    acceptBtnSmall: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 8,
      gap: 4,
    },
    acceptBtnSmallText: {
      fontSize: 12,
      color: colors.green,
      fontFamily: "Rimma_sans",
    },
    removeBtn: {
      backgroundColor: colors.error + "15",
      borderRadius: 14,
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
