// Firebase Real-time Hooks (Client-side)
// Replaces Pusher hooks with Firebase Realtime Database

"use client";

import { useEffect, useState, useRef } from "react";
import { getFirebaseDatabase } from "./firebase";
import { ref, onValue, off, DataSnapshot } from "firebase/database";

/**
 * Hook to subscribe to Firebase Realtime Database path
 * Replaces usePusherChannel
 *
 * @param path - Firebase database path (e.g., "projects/123" or "cards/456")
 * @returns boolean indicating if connected
 */
export const useFirebasePath = (path: string) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!path) return;

    let mounted = true;

    const checkConnection = () => {
      try {
        const db = getFirebaseDatabase();
        if (db && mounted) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Firebase connection error:", error);
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    checkConnection();

    return () => {
      mounted = false;
      setIsConnected(false);
    };
  }, [path]);

  return isConnected;
};

/**
 * Hook to listen to specific Firebase events
 * Replaces usePusherEvent
 *
 * @param path - Firebase database path (e.g., "projects/123/events")
 * @param eventType - Event type to listen for (e.g., "card:created")
 * @param callback - Function to call when event occurs
 *
 * @example
 * useFirebaseEvent("cards/123/events", "comment:created", (data) => {
 *   console.log("New comment:", data);
 * });
 */
export const useFirebaseEvent = (
  path: string,
  eventType: string,
  callback: (data: unknown) => void
) => {
  // Use ref to store latest callback without triggering re-subscription
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!path || !eventType) return;

    try {
      const db = getFirebaseDatabase();
      if (!db) {
        console.warn("Firebase database not initialized");
        return;
      }

      // Create reference to specific event type in the path
      const eventRef = ref(db, `${path}/${eventType}`);

      console.log(`🔌 Setting up listener: ${path}/${eventType}`);

      // Listen for value changes
      const unsubscribe = onValue(
        eventRef,
        (snapshot: DataSnapshot) => {
          const data = snapshot.val();
          if (data) {
            console.log(
              `🔥 Firebase event received: ${eventType} on ${path}`,
              data
            );
            // Call latest callback via ref
            callbackRef.current(data);
          } else {
            console.log(`⚠️ No data for ${path}/${eventType}`);
          }
        },
        (error) => {
          console.error(
            `❌ Firebase listener error for ${path}/${eventType}:`,
            error
          );
        }
      );

      // Cleanup listener on unmount
      return () => {
        console.log(`🔌 Cleaning up listener: ${path}/${eventType}`);
        unsubscribe();
      };
    } catch (error) {
      console.error(
        `❌ Firebase listener setup error for ${path}/${eventType}:`,
        error
      );
    }
  }, [path, eventType]); // Only re-subscribe when path or eventType changes
};

/**
 * Hook to listen to all events on a path
 * Useful for getting all updates on a specific resource
 *
 * @param path - Firebase database path
 * @param callback - Function to call when any event occurs
 */
export const useFirebaseAllEvents = (
  path: string,
  callback: (eventType: string, data: unknown) => void
) => {
  useEffect(() => {
    if (!path) return;

    try {
      const db = getFirebaseDatabase();
      if (!db) return;

      const eventsRef = ref(db, path);

      onValue(eventsRef, (snapshot: DataSnapshot) => {
        snapshot.forEach((childSnapshot) => {
          const eventType = childSnapshot.key;
          const data = childSnapshot.val();
          if (eventType && data) {
            callback(eventType, data);
          }
        });
      });

      return () => {
        off(eventsRef);
      };
    } catch (error) {
      console.error(`Firebase all events listener error for ${path}:`, error);
    }
  }, [path, callback]);
};

/**
 * Hook to subscribe to a list of items (e.g., notifications)
 * Returns the current list and updates when changes occur
 *
 * @param path - Firebase database path
 * @returns Array of items
 */
export const useFirebaseList = <T = Record<string, unknown>>(
  path: string
): T[] => {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    if (!path) return;

    try {
      const db = getFirebaseDatabase();
      if (!db) return;

      const listRef = ref(db, path);

      onValue(listRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert object to array
          const itemsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setItems(itemsArray);
        } else {
          setItems([]);
        }
      });

      return () => {
        off(listRef);
      };
    } catch (error) {
      console.error(`Firebase list listener error for ${path}:`, error);
      return;
    }
  }, [path]);

  return items;
};

// Types for Firebase events (same as Pusher for compatibility)
export type FirebaseEvent =
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

export interface FirebaseEventData {
  type: FirebaseEvent;
  data: Record<string, unknown>;
  userId: number;
  timestamp: string;
}
