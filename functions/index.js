/**
 * Уведомления перенесены на клиент (Firestore Spark plan).
 *
 * Все триггеры работают внутри клиентских репозиториев:
 *   - firebase-challenge-repository.ts
 *   - firebase-friend-repository.ts
 *   - firebase-achievement-repository.ts
 *
 * Уведомления пишутся в коллекцию users/{uid}/notifications
 * и отправляются через Expo Push API из клиента.
 *
 * Cloud Functions не используются.
 */
