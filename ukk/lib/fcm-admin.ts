/**
 * Server-side utility to send FCM push notifications
 * Uses Firebase Admin SDK to send messages to user devices
 */

import admin from "firebase-admin";
import { prisma } from "./prisma";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

interface PushNotificationPayload {
  title: string;
  body: string;
  link?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotificationToUser(
  userId: number,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    // Get user's FCM token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return false;
    }

    return await sendPushNotificationToToken(user.fcmToken, payload);
  } catch (error) {
    console.error("Error sending push notification to user:", error);
    return false;
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: number[],
  payload: PushNotificationPayload
): Promise<number> {
  try {
    // Get FCM tokens for all users
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        fcmToken: { not: null },
      },
      select: { fcmToken: true },
    });

    const tokens = users
      .map((u) => u.fcmToken)
      .filter((t): t is string => t !== null);

    if (tokens.length === 0) {
      console.log("No FCM tokens found for users:", userIds);
      return 0;
    }

    return await sendPushNotificationToTokens(tokens, payload);
  } catch (error) {
    console.error("Error sending push notifications to users:", error);
    return 0;
  }
}

/**
 * Send push notification to a specific FCM token
 */
export async function sendPushNotificationToToken(
  token: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        link: payload.link || "/notifications",
        ...(payload.data || {}),
      },
      token: token,
      webpush: {
        notification: {
          icon: payload.icon || "/icon-192x192.png",
          badge: payload.badge || "/icon-72x72.png",
          requireInteraction: false,
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: payload.link || "/notifications",
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("Push notification sent successfully:", response);
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);

    // If token is invalid, remove it from database
    if (
      error instanceof Error &&
      (error.message.includes("registration-token-not-registered") ||
        error.message.includes("invalid-registration-token"))
    ) {
      console.log("Invalid token, removing from database");
      await prisma.user.updateMany({
        where: { fcmToken: token },
        data: { fcmToken: null },
      });
    }

    return false;
  }
}

/**
 * Send push notification to multiple FCM tokens (batch)
 */
export async function sendPushNotificationToTokens(
  tokens: string[],
  payload: PushNotificationPayload
): Promise<number> {
  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        link: payload.link || "/notifications",
        ...(payload.data || {}),
      },
      webpush: {
        notification: {
          icon: payload.icon || "/icon-192x192.png",
          badge: payload.badge || "/icon-72x72.png",
          requireInteraction: false,
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: payload.link || "/notifications",
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: message.notification,
      data: message.data,
      webpush: message.webpush,
    });

    console.log(
      `Push notifications sent: ${response.successCount}/${tokens.length}`
    );

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          resp.error &&
          (resp.error.code === "messaging/registration-token-not-registered" ||
            resp.error.code === "messaging/invalid-registration-token")
        ) {
          invalidTokens.push(tokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await prisma.user.updateMany({
          where: { fcmToken: { in: invalidTokens } },
          data: { fcmToken: null },
        });
        console.log(`Removed ${invalidTokens.length} invalid tokens`);
      }
    }

    return response.successCount;
  } catch (error) {
    console.error("Error sending batch push notifications:", error);
    return 0;
  }
}

/**
 * Send notification to all project members
 */
export async function sendPushNotificationToProjectMembers(
  projectId: number,
  payload: PushNotificationPayload,
  excludeUserId?: number
): Promise<number> {
  try {
    // Get all project members
    const members = await prisma.projectMember.findMany({
      where: {
        projectId: projectId,
        ...(excludeUserId && { userId: { not: excludeUserId } }),
      },
      select: { userId: true },
    });

    const userIds = members.map((m) => m.userId);
    return await sendPushNotificationToUsers(userIds, payload);
  } catch (error) {
    console.error(
      "Error sending push notifications to project members:",
      error
    );
    return 0;
  }
}
