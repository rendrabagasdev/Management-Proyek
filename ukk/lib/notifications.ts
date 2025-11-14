import prisma from "@/lib/prisma";
import {
  triggerFirebaseEvent,
  triggerUserEvent,
} from "@/lib/firebase-triggers";
import { sendPushNotificationToUser } from "@/lib/fcm-admin";

export type NotificationType =
  | "CARD_ASSIGNED"
  | "CARD_UPDATED"
  | "CARD_COMPLETED"
  | "COMMENT_ADDED"
  | "COMMENT_MENTION"
  | "SUBTASK_COMPLETED"
  | "PROJECT_INVITE"
  | "TIME_LOG_REMINDER"
  | "DEADLINE_APPROACHING"
  | "DEADLINE_OVERDUE"
  | "OVERTIME_REQUEST"
  | "OVERTIME_APPROVED"
  | "OVERTIME_REJECTED";

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a notification and trigger real-time event + push notification
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });

    // Trigger Firebase event for real-time notification
    await triggerUserEvent(userId, "notification:new", {
      notification: {
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    // Send push notification to user's device
    await sendPushNotificationToUser(userId, {
      title,
      body: message,
      link: link || "/notifications",
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
      data: {
        notificationId: notification.id.toString(),
        type,
      },
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  notifications: CreateNotificationParams[]
) {
  try {
    const created = await prisma.notification.createMany({
      data: notifications,
    });

    // Trigger Firebase events and push notifications for all users
    await Promise.all(
      notifications.map(async (notif) => {
        // Firebase real-time event
        await triggerFirebaseEvent(`user-${notif.userId}`, "notification:new", {
          notification: notif,
          timestamp: new Date().toISOString(),
        });

        // Push notification
        await sendPushNotificationToUser(notif.userId, {
          title: notif.title,
          body: notif.message,
          link: notif.link || "/notifications",
          icon: "/icon-192x192.png",
          badge: "/icon-72x72.png",
          data: {
            type: notif.type,
          },
        });
      })
    );

    return created;
  } catch (error) {
    console.error("Failed to create bulk notifications:", error);
    throw error;
  }
}

/**
 * Notification helpers for specific events
 */

export async function notifyCardAssigned(
  assigneeId: number,
  cardId: number,
  cardTitle: string,
  assignedByName: string
) {
  return createNotification({
    userId: assigneeId,
    type: "CARD_ASSIGNED",
    title: "New Card Assigned",
    message: `${assignedByName} assigned you to "${cardTitle}"`,
    link: `/cards/${cardId}`,
  });
}

export async function notifyCardUpdated(
  userId: number,
  cardId: number,
  cardTitle: string,
  updatedByName: string,
  changes: string
) {
  return createNotification({
    userId,
    type: "CARD_UPDATED",
    title: "Card Updated",
    message: `${updatedByName} updated "${cardTitle}": ${changes}`,
    link: `/cards/${cardId}`,
  });
}

export async function notifyCardCompleted(
  userIds: number[],
  cardId: number,
  cardTitle: string,
  completedByName: string
) {
  const notifications = userIds.map((userId) => ({
    userId,
    type: "CARD_COMPLETED" as NotificationType,
    title: "Card Completed",
    message: `${completedByName} completed "${cardTitle}"`,
    link: `/cards/${cardId}`,
  }));

  return createBulkNotifications(notifications);
}

export async function notifyCommentAdded(
  userId: number,
  cardId: number,
  cardTitle: string,
  commentedByName: string
) {
  return createNotification({
    userId,
    type: "COMMENT_ADDED",
    title: "New Comment",
    message: `${commentedByName} commented on "${cardTitle}"`,
    link: `/cards/${cardId}`,
  });
}

export async function notifyMentionInComment(
  mentionedUserId: number,
  cardId: number,
  cardTitle: string,
  mentionedByName: string
) {
  return createNotification({
    userId: mentionedUserId,
    type: "COMMENT_MENTION",
    title: "You were mentioned",
    message: `${mentionedByName} mentioned you in "${cardTitle}"`,
    link: `/cards/${cardId}`,
  });
}

export async function notifySubtaskCompleted(
  userId: number,
  cardId: number,
  cardTitle: string,
  subtaskTitle: string,
  completedByName: string
) {
  return createNotification({
    userId,
    type: "SUBTASK_COMPLETED",
    title: "Subtask Completed",
    message: `${completedByName} completed subtask "${subtaskTitle}" in "${cardTitle}"`,
    link: `/cards/${cardId}`,
  });
}

export async function notifyProjectInvite(
  userId: number,
  projectId: number,
  projectName: string,
  invitedByName: string
) {
  return createNotification({
    userId,
    type: "PROJECT_INVITE",
    title: "Project Invitation",
    message: `${invitedByName} added you to project "${projectName}"`,
    link: `/projects/${projectId}`,
  });
}
