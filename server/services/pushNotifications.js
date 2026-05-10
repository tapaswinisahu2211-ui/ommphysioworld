const fs = require("fs");
const admin = require("firebase-admin");
const PatientNotification = require("../models/PatientNotification");
const PublicUser = require("../models/PublicUser");

const PUSH_CHANNEL_ID = "opw_patient_updates";
const MAX_MULTICAST_TOKENS = 500;
const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-argument",
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

let firebaseInitAttempted = false;
let firebaseReady = false;
let missingConfigLogged = false;

const parseJsonCredential = (raw) => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.log("Failed to parse Firebase service account JSON:", error.message);
    return null;
  }
};

const readCredentialFromPath = (credentialPath) => {
  const resolvedPath = String(credentialPath || "").trim();

  if (!resolvedPath) {
    return null;
  }

  try {
    return parseJsonCredential(fs.readFileSync(resolvedPath, "utf8"));
  } catch (error) {
    console.log("Failed to read Firebase service account file:", error.message);
    return null;
  }
};

const getServiceAccount = () => {
  const base64Credential = String(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "").trim();
  if (base64Credential) {
    return parseJsonCredential(Buffer.from(base64Credential, "base64").toString("utf8"));
  }

  const inlineCredential = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
  if (inlineCredential) {
    return parseJsonCredential(inlineCredential);
  }

  return readCredentialFromPath(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
};

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) {
    firebaseReady = true;
    return true;
  }

  if (firebaseInitAttempted) {
    return firebaseReady;
  }

  firebaseInitAttempted = true;

  try {
    const serviceAccount = getServiceAccount();

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseReady = true;
      return true;
    }

    if (String(process.env.GOOGLE_APPLICATION_CREDENTIALS || "").trim()) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      firebaseReady = true;
      return true;
    }

    if (!missingConfigLogged) {
      console.log(
        "Firebase push is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT_PATH, or GOOGLE_APPLICATION_CREDENTIALS."
      );
      missingConfigLogged = true;
    }
  } catch (error) {
    console.log("Failed to initialize Firebase Admin:", error.message);
  }

  return false;
};

const chunkArray = (items, size) => {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const stringValue = (value) => (value === undefined || value === null ? "" : String(value));

const getNotificationId = (notification) =>
  notification?._id ? notification._id.toString() : stringValue(notification?.id);

const getPatientId = (patientId) =>
  patientId?._id ? patientId._id.toString() : stringValue(patientId);

const buildPushPayload = (tokens, patientId, notification) => {
  const notificationId = getNotificationId(notification);
  const title = stringValue(notification?.title || "OPW update").slice(0, 120);
  const body = stringValue(
    notification?.body || "You have a new update from Omm Physio World."
  ).slice(0, 4000);
  const category = stringValue(notification?.category || "general");
  const actionUrl = stringValue(notification?.actionUrl || "notifications");

  return {
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      notificationId,
      patientId: getPatientId(patientId),
      title,
      body,
      category,
      actionUrl,
      badge: "1",
    },
    android: {
      priority: "high",
      notification: {
        channelId: PUSH_CHANNEL_ID,
        notificationCount: 1,
      },
    },
  };
};

const removeInvalidTokens = async (tokens) => {
  const invalidTokens = [...new Set(tokens.filter(Boolean))];

  if (!invalidTokens.length) {
    return;
  }

  await PublicUser.updateMany(
    { "fcmTokens.token": { $in: invalidTokens } },
    { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
  );
};

const sendPatientPushNotification = async (patientId, notification) => {
  if (!initializeFirebaseAdmin()) {
    return { sent: 0, failed: 0, skipped: "firebase-not-configured" };
  }

  const user = await PublicUser.findOne({
    patientId,
    "fcmTokens.0": { $exists: true },
  }).select("fcmTokens");
  const tokens = [
    ...new Set(
      (user?.fcmTokens || [])
        .map((entry) => stringValue(entry.token).trim())
        .filter(Boolean)
    ),
  ];

  if (!tokens.length) {
    return { sent: 0, failed: 0, skipped: "no-token" };
  }

  let sent = 0;
  let failed = 0;
  const invalidTokens = [];

  for (const tokenChunk of chunkArray(tokens, MAX_MULTICAST_TOKENS)) {
    try {
      const response = await admin
        .messaging()
        .sendEachForMulticast(buildPushPayload(tokenChunk, patientId, notification));

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((result, index) => {
        if (!result.success && INVALID_TOKEN_CODES.has(result.error?.code)) {
          invalidTokens.push(tokenChunk[index]);
        }
      });
    } catch (error) {
      failed += tokenChunk.length;
      console.log("FCM push send failed:", error.message);
    }
  }

  await removeInvalidTokens(invalidTokens);

  return { sent, failed, skipped: sent || failed ? "" : "not-sent" };
};

const getPushStatus = (result) => {
  if (result.sent > 0) {
    return result.failed > 0 ? "partial" : "sent";
  }

  return result.skipped || (result.failed > 0 ? "failed" : "not-sent");
};

const sendDuePatientPushNotifications = async (limit = 100) => {
  if (!initializeFirebaseAdmin()) {
    return { checked: 0, sent: 0, skipped: "firebase-not-configured" };
  }

  const notifications = await PatientNotification.find({
    scheduledFor: { $lte: new Date() },
    pushedAt: null,
  })
    .sort({ scheduledFor: 1, createdAt: 1 })
    .limit(Number(limit) || 100);

  let sent = 0;

  for (const notification of notifications) {
    const result = await sendPatientPushNotification(notification.patientId, notification);
    sent += result.sent;
    if (["firebase-not-configured", "no-token"].includes(result.skipped)) {
      notification.pushStatus = result.skipped;
      await notification.save();
      continue;
    }

    notification.pushedAt = new Date();
    notification.pushStatus = getPushStatus(result);
    await notification.save();
  }

  return { checked: notifications.length, sent };
};

module.exports = {
  getPushStatus,
  sendDuePatientPushNotifications,
  sendPatientPushNotification,
};
