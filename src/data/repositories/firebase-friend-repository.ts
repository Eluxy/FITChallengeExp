import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import type { FriendInfo, FriendRequest, UserSearchResult } from "@/src/domain/entities/friend";
import type { FriendRepository } from "@/src/domain/repositories/friend-repository";
import { createNotification } from "@/src/services/notifications/create-notification";
import { getCache, saveCache, FRIENDS_CACHE_KEY } from "@/src/services/storage/cache-service";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
  startAt,
  endAt,
} from "firebase/firestore";

export class FirebaseFriendRepository implements FriendRepository {
  private get friendRequestsCol() {
    return collection(getFirebaseDb(), "friend_requests");
  }

  private get usersCol() {
    return collection(getFirebaseDb(), "users");
  }

  private getFriendsDoc() {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return null;
    return doc(getFirebaseDb(), "friends", user.uid);
  }

  async searchUsers(searchQuery: string): Promise<UserSearchResult[]> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return [];

    const normalizedQuery = searchQuery.toLowerCase().trim();
    if (normalizedQuery.length < 2) return [];

    const q = query(
      this.usersCol,
      orderBy("name"),
      startAt(normalizedQuery),
      endAt(normalizedQuery + "\uf8ff"),
      limit(30),
    );
    const snapshot = await getDocs(q);

    const myFriends = await this.getFriends();
    const friendIds = new Set(myFriends.map((f) => f.userId));

    const sentRequests = await this.getSentRequests();
    const sentUserIds = new Set(sentRequests.map((r) => r.toUserId));

    const receivedRequests = await this.getPendingRequests();
    const receivedUserIds = new Set(receivedRequests.map((r) => r.fromUserId));

    const results = snapshot.docs
      .map((d) => {
        const data = d.data();
        const userId = d.id;
        let requestStatus: UserSearchResult["requestStatus"] = "none";

        if (friendIds.has(userId)) {
          requestStatus = "friends";
        } else if (sentUserIds.has(userId)) {
          requestStatus = "sent";
        } else if (receivedUserIds.has(userId)) {
          requestStatus = "received";
        }

        return {
          userId,
          displayName: data.name ?? "",
          photoUrl: data.photoUrl || undefined,
          requestStatus,
        };
      })
      .filter(
        (u) =>
          u.userId !== user.uid &&
          u.displayName.toLowerCase().includes(normalizedQuery),
      );

    results.sort((a, b) => a.displayName.localeCompare(b.displayName, "ru"));

    return results;
  }

  async getSentRequests(): Promise<FriendRequest[]> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
      this.friendRequestsCol,
      where("fromUserId", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
  }

  async sendFriendRequest(toUserId: string): Promise<{ success: boolean; message: string }> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    if (toUserId === user.uid) {
      return { success: false, message: "Нельзя добавить себя в друзья" };
    }

    const friends = await this.getFriends();
    if (friends.some((f) => f.userId === toUserId)) {
      return { success: false, message: "Уже в друзьях" };
    }

    const sentRequests = await this.getSentRequests();
    if (sentRequests.some((r) => r.toUserId === toUserId)) {
      return { success: false, message: "Заявка уже отправлена" };
    }

    const receivedRequests = await this.getPendingRequests();
    if (receivedRequests.some((r) => r.fromUserId === toUserId)) {
      return { success: false, message: "У вас есть заявка от этого пользователя" };
    }

    const requestData = {
      fromUserId: user.uid,
      fromName: user.displayName || user.email || "Пользователь",
      fromPhoto: user.photoURL || null,
      toUserId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const docRef = doc(this.friendRequestsCol);
    await setDoc(docRef, requestData);

    await createNotification(
      toUserId,
      "friend_request",
      "Заявка в друзья",
      `${requestData.fromName} хочет добавить вас в друзья`,
      {},
    );

    return { success: true, message: "Заявка отправлена" };
  }

  async acceptFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const requestRef = doc(this.friendRequestsCol, requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) {
      return { success: false, message: "Заявка не найдена" };
    }

    const request = requestSnap.data() as FriendRequest;
    if (request.toUserId !== user.uid) {
      return { success: false, message: "Это не ваша заявка" };
    }

    const friends = await this.getFriends();
    if (friends.some((f) => f.userId === request.fromUserId)) {
      await updateDoc(requestRef, { status: "accepted" });
      return { success: false, message: "Уже в друзьях" };
    }

    const myFriendsRef = doc(getFirebaseDb(), "friends", user.uid);
    const theirFriendsRef = doc(getFirebaseDb(), "friends", request.fromUserId);

    await Promise.all([
      setDoc(myFriendsRef, {
        friends: arrayUnion({
          userId: request.fromUserId,
          displayName: request.fromName,
          photoUrl: request.fromPhoto,
          addedAt: new Date().toISOString(),
        }),
      }, { merge: true }),
      setDoc(theirFriendsRef, {
        friends: arrayUnion({
          userId: user.uid,
          displayName: user.displayName || user.email || "Пользователь",
          photoUrl: user.photoURL || null,
          addedAt: new Date().toISOString(),
        }),
      }, { merge: true }),
      updateDoc(requestRef, { status: "accepted" }),
    ]);

    await createNotification(
      request.fromUserId,
      "friend_accepted",
      "Заявка принята",
      `${user.displayName || user.email || "Пользователь"} принял(а) вашу заявку в друзья`,
      {},
    );

    return { success: true, message: "Заявка принята" };
  }

  async rejectFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    const requestRef = doc(this.friendRequestsCol, requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) {
      return { success: false, message: "Заявка не найдена" };
    }
    await updateDoc(requestRef, { status: "rejected" });
    return { success: true, message: "Заявка отклонена" };
  }

  async getPendingRequests(): Promise<FriendRequest[]> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
      this.friendRequestsCol,
      where("toUserId", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
  }

  async getFriends(): Promise<FriendInfo[]> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const friendsRef = doc(collection(getFirebaseDb(), "friends"), user.uid);
      const friendsSnap = await getDoc(friendsRef);

      if (!friendsSnap.exists()) return [];
      const data = friendsSnap.data();
      const friends = (data.friends ?? []) as FriendInfo[];

      saveCache(FRIENDS_CACHE_KEY, friends).catch(() => {});

      return friends;
    } catch {
      const cached = await getCache<FriendInfo[]>(FRIENDS_CACHE_KEY);
      return cached ?? [];
    }
  }

  async removeFriend(friendUserId: string): Promise<{ success: boolean; message: string }> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const myFriendsRef = doc(getFirebaseDb(), "friends", user.uid);
    const theirFriendsRef = doc(getFirebaseDb(), "friends", friendUserId);

    const mySnap = await getDoc(myFriendsRef);
    const theirSnap = await getDoc(theirFriendsRef);

    const myFriends = mySnap.exists() ? (mySnap.data().friends ?? []) : [];
    const theirFriends = theirSnap.exists() ? (theirSnap.data().friends ?? []) : [];

    const friendToRemove = myFriends.find((f: any) => f.userId === friendUserId);
    const meToRemove = theirFriends.find((f: any) => f.userId === user.uid);

    if (!friendToRemove) {
      return { success: false, message: "Пользователь не в друзьях" };
    }

    await Promise.all([
      setDoc(myFriendsRef, { friends: arrayRemove(friendToRemove) }, { merge: true }),
      setDoc(theirFriendsRef, { friends: arrayRemove(meToRemove) }, { merge: true }),
    ]);

    return { success: true, message: "Удалён из друзей" };
  }
}
