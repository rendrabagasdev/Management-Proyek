// Firebase Event Triggers (Server-side)
// Replaces Pusher event triggers with Firebase Realtime Database

import { getFirebaseAdminDatabase } from "./firebase-admin";

/**
 * Trigger a Firebase event
 * Replaces triggerPusherEvent
 *
 * @param path - Firebase path (e.g., "projects/123/events" or "cards/456/events")
 * @param event - Event type (e.g., "card:created")
 * @param data - Event data
 */
export const triggerFirebaseEvent = async (
  path: string,
  event: string,
  data: Record<string, unknown>
) => {
  try {
    const db = getFirebaseAdminDatabase();
    const eventRef = db.ref(`${path}/${event}`);

    // Add timestamp AND random nonce to ensure uniqueness
    const eventData = {
      ...data,
      timestamp: new Date().toISOString(),
      _nonce: Math.random().toString(36).substring(7), // Random string to ensure data changes
    };

    // Set the event data (overwrites previous event of same type)
    await eventRef.set(eventData);

    console.log(`✅ Firebase event triggered: ${event} on ${path}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to trigger Firebase event:", error);
    return false;
  }
};

/**
 * Trigger a Firebase event with unique ID (won't overwrite)
 * Useful for events that need history like comments, notifications
 *
 * @param path - Firebase path
 * @param event - Event type
 * @param data - Event data
 */
export const pushFirebaseEvent = async (
  path: string,
  event: string,
  data: Record<string, unknown>
) => {
  try {
    const db = getFirebaseAdminDatabase();
    const eventsRef = db.ref(`${path}/${event}`);

    const eventData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    // Push creates a new child with unique ID
    await eventsRef.push(eventData);

    console.log(`✅ Firebase event pushed: ${event} on ${path}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to push Firebase event:", error);
    return false;
  }
};

/**
 * Trigger project-level event
 * Replaces triggerProjectEvent from Pusher
 *
 * @param projectId - Project ID (can be number or string)
 * @param event - Event type
 * @param data - Event data
 */
export const triggerProjectEvent = async (
  projectId: number | string,
  event: string,
  data: Record<string, unknown>
) => {
  return triggerFirebaseEvent(`projects/${projectId}/events`, event, data);
};

/**
 * Trigger card-level event
 * Replaces triggerCardEvent from Pusher
 *
 * @param cardId - Card ID (can be number or string)
 * @param event - Event type
 * @param data - Event data
 */
export const triggerCardEvent = async (
  cardId: number | string,
  event: string,
  data: Record<string, unknown>
) => {
  return triggerFirebaseEvent(`cards/${cardId}/events`, event, data);
};

/**
 * Trigger user notification event
 * For user-specific notifications
 *
 * @param userId - User ID
 * @param event - Event type
 * @param data - Event data
 */
export const triggerUserEvent = async (
  userId: number,
  event: string,
  data: Record<string, unknown>
) => {
  // Use push for notifications to keep history
  return pushFirebaseEvent(`users/${userId}/events`, event, data);
};

/**
 * Batch trigger multiple events
 * Useful for triggering events on both project and card channels
 *
 * @param events - Array of {path, event, data}
 */
export const triggerMultipleEvents = async (
  events: Array<{ path: string; event: string; data: Record<string, unknown> }>
) => {
  try {
    const results = await Promise.all(
      events.map(({ path, event, data }) =>
        triggerFirebaseEvent(path, event, data)
      )
    );
    return results.every((r) => r === true);
  } catch (error) {
    console.error("❌ Failed to trigger multiple Firebase events:", error);
    return false;
  }
};

// Event type definitions (for type safety)
export type FirebaseEventType =
  | "card:created"
  | "card:updated"
  | "card:deleted"
  | "card:assigned"
  | "comment:created"
  | "comment:updated"
  | "comment:deleted"
  | "subtask:created"
  | "subtask:updated"
  | "subtask:deleted"
  | "timelog:started"
  | "timelog:stopped"
  | "notification:new"
  | "notification:read"
  | "notification:read-all";

// Helper to format event data consistently
export const formatEventData = (
  type: FirebaseEventType,
  userId: number,
  payload: Record<string, unknown>
) => {
  return {
    type,
    userId,
    ...payload,
  };
};
