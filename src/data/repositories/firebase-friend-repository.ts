import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
} from "firebase/firestore";

export type FriendRequest = {
  id: string;
  fromUserId: string;
  fromName: string;
  fromPhoto?: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type FriendInfo = {
  userId: string;
  displayName: string;
  photoUrl?: string;
  lastActive?: string;
};

export class FirebaseFriendRepository {
  private get friendRequestsCol() {
    return collection(getFirebaseDb(), "friend_requests");
  }

  private get usersCol() {
    return collection(getFirebaseDb(), "users");
  }

  async searchUsers(searchQuery: string): Promise<FriendInfo[]> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
      this.usersCol,
      orderBy("name"),
      limit(20),
    );
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((d) => ({
        userId: d.id,
        displayName: d.data().name ?? "",
        photoUrl: d.data().photoUrl,
      }))
      .filter(
        (u) =>
          u.userId !== user.uid &&
          u.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }

  async sendFriendRequest(toUserId: string): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

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
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const requestRef = doc(this.friendRequestsCol, requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) throw new Error("Request not found");

    const request = requestSnap.data() as FriendRequest;

    const myFriendsRef = doc(collection(getFirebaseDb(), "friends"), user.uid);
    const theirFriendsRef = doc(collection(getFirebaseDb(), "friends"), request.fromUserId);

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
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    const requestRef = doc(this.friendRequestsCol, requestId);
    await updateDoc(requestRef, { status: "rejected" });
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

    const friendsRef = doc(collection(getFirebaseDb(), "friends"), user.uid);
    const friendsSnap = await getDoc(friendsRef);

    if (!friendsSnap.exists()) return [];
    const data = friendsSnap.data();
    return (data.friends ?? []) as FriendInfo[];
  }

  async removeFriend(friendUserId: string): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const myFriendsRef = doc(collection(getFirebaseDb(), "friends"), user.uid);
    const theirFriendsRef = doc(collection(getFirebaseDb(), "friends"), friendUserId);

    const mySnap = await getDoc(myFriendsRef);
    const theirSnap = await getDoc(theirFriendsRef);

    const myFriends = mySnap.exists() ? (mySnap.data().friends ?? []) : [];
    const theirFriends = theirSnap.exists() ? (theirSnap.data().friends ?? []) : [];

    const friendToRemove = myFriends.find((f: any) => f.userId === friendUserId);
    const meToRemove = theirFriends.find((f: any) => f.userId === user.uid);

    await Promise.all([
      setDoc(myFriendsRef, { friends: arrayRemove(friendToRemove) }, { merge: true }),
      setDoc(theirFriendsRef, { friends: arrayRemove(meToRemove) }, { merge: true }),
    ]);
  }
}
