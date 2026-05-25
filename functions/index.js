const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Отправка push-уведомления через Expo Push API
 */
async function sendPush(token, title, body, data = {}) {
  if (!token) return;

  const message = {
    to: token,
    sound: "default",
    title,
    body,
    data,
    priority: "high",
  };

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error("Error sending push:", err);
  }
}

/**
 * Получение push-токена пользователя
 */
async function getUserPushToken(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    return userDoc.exists ? userDoc.data().pushToken : null;
  } catch {
    return null;
  }
}

/**
 * Триггер: когда создаётся новый челлендж
 */
exports.onChallengeCreate = functions.firestore
  .document("challenges/{challengeId}")
  .onCreate(async (snap, context) => {
    const challenge = snap.data();
    const creatorId = challenge.creatorId;

    // Получаем информацию о создателе
    const creatorDoc = await db.collection("users").doc(creatorId).get();
    const creatorName = creatorDoc.exists
      ? creatorDoc.data().name || "Пользователь"
      : "Пользователь";

    // Отправляем уведомления всем участникам, кроме создателя
    const participants = challenge.participants || [];
    const promises = participants
      .filter((p) => p.userId !== creatorId)
      .map(async (participant) => {
        const token = await getUserPushToken(participant.userId);
        if (token) {
          await sendPush(
            token,
            "Новый челлендж!",
            `${creatorName} приглашает вас в "${challenge.title}"`,
            { type: "challenge_invite", challengeId: context.params.challengeId },
          );
        }
      });

    await Promise.all(promises);
  });

/**
 * Триггер: когда завершается челлендж — определяем победителя
 */
exports.onChallengeEnd = functions.firestore
  .document("challenges/{challengeId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Реагируем только когда статус меняется на "active" -> истекло время
    if (before.status === "active" && after.status === "active") {
      const endDate = new Date(after.endDate);
      if (endDate > new Date()) return; // ещё не истекло

      const participants = after.participants || [];

      const hasProgress = participants.some((p) => p.currentValue > 0);

      if (!hasProgress) {
        await change.after.ref.update({
          status: "completed",
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Уведомляем всех
        const promises = participants.map(async (p) => {
          const token = await getUserPushToken(p.userId);
          if (token) {
            await sendPush(
              token,
              "Челлендж завершён",
              `Челлендж "${after.title}" завершён. Никто не выполнил цель.`,
              { type: "challenge_end", challengeId: context.params.challengeId },
            );
          }
        });

        await Promise.all(promises);
        return;
      }

      // Сортируем по currentValue и определяем победителя
      const sorted = [...participants].sort((a, b) => b.currentValue - a.currentValue);
      const winnerId = sorted[0].userId;

      // Обновляем статус челленджа
      await change.after.ref.update({
        status: "completed",
        winnerId,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Уведомляем победителя
      const winnerToken = await getUserPushToken(winnerId);
      if (winnerToken) {
        await sendPush(
          winnerToken,
          "Победа!",
          `Вы выиграли челлендж "${after.title}"!`,
          { type: "challenge_win", challengeId: context.params.challengeId },
        );
      }

      // Уведомляем остальных
      const promises = participants
        .filter((p) => p.userId !== winnerId)
        .map(async (p) => {
          const token = await getUserPushToken(p.userId);
          if (token) {
            await sendPush(
              token,
              "Челлендж завершён",
              `Челлендж "${after.title}" завершён. Победитель: ${sorted[0].displayName}`,
              { type: "challenge_end", challengeId: context.params.challengeId },
            );
          }
        });

      await Promise.all(promises);
    }
  });

/**
 * Триггер: когда пользователь получает новое достижение
 */
exports.onAchievementUnlock = functions.firestore
  .document("users/{userId}/achievements/{achievementId}")
  .onCreate(async (snap, context) => {
    const achievement = snap.data();
    const token = await getUserPushToken(context.params.userId);

    if (token) {
      await sendPush(
        token,
        "Новое достижение!",
        `Вы открыли достижение "${achievement.title}"`,
        { type: "achievement", achievementId: context.params.achievementId },
      );
    }
  });

/**
 * Триггер: новый друг принят
 */
exports.onFriendAccepted = functions.firestore
  .document("friend_requests/{requestId}")
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    if (after.status !== "accepted") return;

    const token = await getUserPushToken(after.fromUserId);
    if (token) {
      await sendPush(
        token,
        "Заявка принята",
        `${after.fromName} принял(а) вашу заявку в друзья`,
        { type: "friend_accept" },
      );
    }
  });

/**
 * Scheduled функция: напоминания каждый день в 20:00
 */
exports.dailyReminder = functions.pubsub
  .schedule("0 20 * * *")
  .timeZone("Europe/Moscow")
  .onRun(async () => {
    const today = new Date().toISOString().slice(0, 10);

    // Находим активные челленджи
    const challengesSnap = await db
      .collection("challenges")
      .where("status", "==", "active")
      .get();

    const userTokens = {};

    for (const doc of challengesSnap.docs) {
      const challenge = doc.data();
      for (const participant of challenge.participants || []) {
        if (!userTokens[participant.userId]) {
          userTokens[participant.userId] = await getUserPushToken(participant.userId);
        }

        if (userTokens[participant.userId]) {
          await sendPush(
            userTokens[participant.userId],
            "Напоминание",
            `Не забывайте про челлендж "${challenge.title}"! Осталось двигаться к цели.`,
            { type: "reminder", challengeId: doc.id },
          );
        }
      }
    }
  });
