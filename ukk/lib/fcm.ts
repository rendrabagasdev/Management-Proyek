/**
 * Firebase Cloud Messaging (FCM) utilities for web push notifications
 */

import {
  getMessaging,
  getToken,
  onMessage,
  MessagePayload,
} from "firebase/messaging";
import { getFirebaseApp } from "./firebase";

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

let messaging: ReturnType<typeof getMessaging> | null = null;

if (isBrowser) {
  try {
    const app = getFirebaseApp();
    if (app) {
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.error("Error initializing messaging:", error);
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowser) return "denied";

  if (!("Notification" in window)) {
    console.log("This browser does not support notifications.");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Get FCM token for this device/browser
 */
export async function getFCMToken(): Promise<string | null> {
  if (!isBrowser || !messaging) {
    console.log("Messaging not available");
    return null;
  }

  try {
    // Check permission first
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted:", permission);
      return null;
    }

    // Get registration token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("VAPID key not configured");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
    });

    if (token) {
      console.log("FCM Token:", token);
      return token;
    } else {
      console.log("No registration token available.");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

/**
 * Save FCM token to backend
 */
export async function saveFCMToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/fcm/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Failed to save FCM token");
    }

    console.log("FCM token saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return false;
  }
}

/**
 * Delete FCM token from backend (for logout)
 */
export async function deleteFCMToken(): Promise<boolean> {
  try {
    const response = await fetch("/api/fcm/token", {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete FCM token");
    }

    console.log("FCM token deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting FCM token:", error);
    return false;
  }
}

/**
 * Initialize FCM and get token
 */
export async function initializeFCM(): Promise<string | null> {
  if (!isBrowser) return null;

  try {
    const token = await getFCMToken();
    if (token) {
      await saveFCMToken(token);
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error initializing FCM:", error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
) {
  if (!isBrowser || !messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
}

/**
 * Show browser notification
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if (!isBrowser || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, options);
  }
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return isBrowser && "Notification" in window && "serviceWorker" in navigator;
}

/**
 * Check if notification permission is granted
 */
export function isNotificationGranted(): boolean {
  return isBrowser && Notification.permission === "granted";
}
