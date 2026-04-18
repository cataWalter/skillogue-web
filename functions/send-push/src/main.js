import { Client, Databases, ID, Query } from 'node-appwrite';
import webpush from 'web-push';

const DEFAULT_PUSH_SUBSCRIPTIONS_COLLECTION_ID = 'push_subscriptions';
const DEFAULT_NOTIFICATIONS_COLLECTION_ID = 'notifications';
const SUBSCRIPTION_PAGE_SIZE = 100;

const getString = (value) => (typeof value === 'string' ? value.trim() : '');

const resolveNotificationType = (value) => {
  const normalized = getString(value);

  switch (normalized) {
    case 'new_message':
    case 'message':
      return 'new_message';
    case 'favorite':
    case 'new_favorite':
      return 'new_favorite';
    case 'match':
    case 'new_match':
      return 'new_match';
    default:
      return normalized || 'new_message';
  }
};

const resolveNotificationUrl = (payload) => {
  const explicitUrl = getString(payload.url);

  if (explicitUrl) {
    return explicitUrl;
  }

  const notificationType = getString(payload.notification_type);
  const relatedId = getString(payload.related_id) || getString(payload.actor_id);

  switch (notificationType) {
    case 'message':
    case 'new_message':
      return relatedId ? `/messages?conversation=${encodeURIComponent(relatedId)}` : '/messages';
    case 'favorite':
    case 'new_favorite':
      return '/favorites';
    case 'match':
    case 'new_match':
      return '/dashboard';
    case 'profile_visit':
      return relatedId ? `/profile/${encodeURIComponent(relatedId)}` : '/dashboard';
    default:
      return '/';
  }
};

const normalizePayload = (payload) => {
  const receiverId = getString(payload.receiver_id) || getString(payload.recipient_id);
  const actorId = getString(payload.actor_id) || getString(payload.sender_id) || null;
  const title = getString(payload.title) || 'New message';
  const body = typeof payload.body === 'string' ? payload.body : typeof payload.message === 'string' ? payload.message : '';
  const notificationType = getString(payload.notification_type) || 'message';
  const relatedId = getString(payload.related_id) || actorId;
  const url = resolveNotificationUrl({
    ...payload,
    actor_id: actorId,
    notification_type: notificationType,
    related_id: relatedId,
  });

  return {
    receiverId,
    actorId,
    title,
    body,
    notificationType,
    relatedId,
    url,
  };
};

const parseRequestBody = (req) => {
  if (req.bodyJson && typeof req.bodyJson === 'object' && !Array.isArray(req.bodyJson)) {
    return req.bodyJson;
  }

  const bodyText = typeof req.bodyText === 'string' ? req.bodyText.trim() : '';

  if (!bodyText) {
    return {};
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    return {};
  }
};

const createDatabasesClient = (req) => {
  const endpoint =
    getString(process.env.APPWRITE_FUNCTION_API_ENDPOINT) ||
    getString(process.env.APPWRITE_ENDPOINT) ||
    getString(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  const projectId = getString(process.env.APPWRITE_FUNCTION_PROJECT_ID);
  const apiKey = getString(req.headers['x-appwrite-key']);

  if (!endpoint || !projectId || !apiKey) {
    throw new Error('Missing Appwrite function runtime credentials.');
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return new Databases(client);
};

const listAllSubscriptions = async (databases, databaseId, collectionId, userId) => {
  const documents = [];
  let offset = 0;

  while (true) {
    const page = await databases.listDocuments(databaseId, collectionId, [
      Query.equal('user_id', userId),
      Query.limit(SUBSCRIPTION_PAGE_SIZE),
      Query.offset(offset),
    ]);

    documents.push(...page.documents);

    if (page.documents.length < SUBSCRIPTION_PAGE_SIZE) {
      break;
    }

    offset += page.documents.length;
  }

  return documents;
};

const buildPushSubscription = (document) => {
  const endpoint = getString(document.endpoint);
  const p256dh = getString(document.p256dh);
  const auth = getString(document.auth);

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    keys: {
      p256dh,
      auth,
    },
  };
};

const isInvalidSubscriptionError = (error) => {
  const statusCode = Number(error?.statusCode ?? error?.status ?? 0);

  return statusCode === 404 || statusCode === 410;
};

export default async ({ req, res, log, error }) => {
  if (req.method === 'OPTIONS') {
    return res.empty();
  }

  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed.' }, 405);
  }

  const payload = normalizePayload(parseRequestBody(req));

  if (!payload.receiverId || !payload.title || !payload.body) {
    return res.json({ success: false, error: 'Missing required notification fields.' }, 400);
  }

  const databaseId = getString(process.env.APPWRITE_DATABASE_ID);
  const vapidPublicKey = getString(process.env.VAPID_PUBLIC_KEY);
  const vapidPrivateKey = getString(process.env.VAPID_PRIVATE_KEY);
  const vapidSubject = getString(process.env.VAPID_SUBJECT);

  if (!databaseId) {
    return res.json({ success: false, error: 'APPWRITE_DATABASE_ID is not configured.' }, 500);
  }

  const pushSubscriptionsCollectionId =
    getString(process.env.APPWRITE_COLLECTION_PUSH_SUBSCRIPTIONS_ID) ||
    DEFAULT_PUSH_SUBSCRIPTIONS_COLLECTION_ID;
  const notificationsCollectionId =
    getString(process.env.APPWRITE_COLLECTION_NOTIFICATIONS_ID) ||
    DEFAULT_NOTIFICATIONS_COLLECTION_ID;

  const databases = createDatabasesClient(req);

  const notificationId = ID.unique();

  const notificationRecord = {
    id: notificationId,
    receiver_id: payload.receiverId,
    actor_id: payload.actorId,
    type: resolveNotificationType(payload.notificationType),
    read: false,
    title: payload.title,
    body: payload.body,
    url: payload.url,
    created_at: new Date().toISOString(),
  };

  await databases.createDocument(databaseId, notificationsCollectionId, notificationId, notificationRecord);

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    log(`Push skipped because VAPID variables are incomplete for ${payload.receiverId}.`);
    return res.json({
      success: true,
      notificationCreated: true,
      pushAttempted: 0,
      pushSent: 0,
      pushSkipped: true,
    });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const subscriptions = await listAllSubscriptions(
    databases,
    databaseId,
    pushSubscriptionsCollectionId,
    payload.receiverId
  );

  if (subscriptions.length === 0) {
    log(`No push subscriptions found for ${payload.receiverId}.`);
    return res.json({
      success: true,
      notificationCreated: true,
      pushAttempted: 0,
      pushSent: 0,
    });
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
  });

  const invalidSubscriptionIds = [];
  let pushSent = 0;

  await Promise.all(
    subscriptions.map(async (document) => {
      const subscription = buildPushSubscription(document);

      if (!subscription) {
        return;
      }

      try {
        await webpush.sendNotification(subscription, pushPayload);
        pushSent += 1;
      } catch (sendError) {
        if (isInvalidSubscriptionError(sendError)) {
          invalidSubscriptionIds.push(document.$id);
          return;
        }

        error(`Push delivery failed for ${document.$id}: ${sendError instanceof Error ? sendError.message : String(sendError)}`);
      }
    })
  );

  if (invalidSubscriptionIds.length > 0) {
    await Promise.all(
      invalidSubscriptionIds.map((documentId) =>
        databases.deleteDocument(databaseId, pushSubscriptionsCollectionId, documentId)
      )
    );
  }

  return res.json({
    success: true,
    notificationCreated: true,
    pushAttempted: subscriptions.length,
    pushSent,
    invalidSubscriptionsRemoved: invalidSubscriptionIds.length,
  });
};