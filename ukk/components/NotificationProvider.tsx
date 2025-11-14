"use client";

import { createContext, useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  initializeFCM,
  onForegroundMessage,
  deleteFCMToken,
  isNotificationSupported,
} from "@/lib/fcm";
import { logger } from "@/lib/logger";

interface Toast {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextType {
  toast: (toast: Toast) => void;
  toasts: (Toast & { id: string })[];
}

export const ToastContext = createContext<ToastContextType | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [toasts, setToasts] = useState<(Toast & { id: string })[]>([]);
  const [fcmInitialized, setFcmInitialized] = useState(false);
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  const toast = useCallback((toast: Toast) => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Initialize FCM when user logs in
  useEffect(() => {
    if (status === "authenticated" && session && !fcmInitialized) {
      // Check if notifications are supported
      if (!isNotificationSupported()) {
        logger.info("Push notifications not supported in this browser");
        return;
      }

      // Clear shown notifications on app load
      shownNotificationsRef.current.clear();

      // Initialize FCM and get token
      initializeFCM()
        .then((token) => {
          if (token) {
            logger.info("FCM initialized successfully");
            setFcmInitialized(true);
          }
        })
        .catch((error) => {
          logger.error("Failed to initialize FCM:", error);
        });

      // Listen for foreground messages (FCM)
      const unsubscribe = onForegroundMessage((payload) => {
        logger.debug("FCM Foreground message:", payload);

        // Generate unique ID from notification data
        const notificationId =
          payload.data?.notificationId ||
          payload.messageId ||
          `${Date.now()}-${Math.random()}`;

        // Skip if already shown
        if (shownNotificationsRef.current.has(notificationId)) {
          logger.debug("Notification already shown, skipping:", notificationId);
          return;
        }

        // Mark as shown
        shownNotificationsRef.current.add(notificationId);

        // Dispatch custom event for UI updates (for NotificationBell)
        window.dispatchEvent(
          new CustomEvent("fcm-notification", {
            detail: payload,
          })
        );

        // FCM already shows browser notification
        // No need to show toast here to avoid duplication
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [status, session, fcmInitialized]);

  // Clean up FCM token on logout
  useEffect(() => {
    if (status === "unauthenticated" && fcmInitialized) {
      deleteFCMToken().then(() => {
        setFcmInitialized(false);
        shownNotificationsRef.current.clear();
      });
    }
  }, [status, fcmInitialized]);

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-lg animate-in slide-in-from-bottom-5 ${
              t.variant === "destructive"
                ? "bg-(--theme-danger) text-white"
                : "bg-card border"
            }`}
          >
            <div className="font-semibold">{t.title}</div>
            {t.description && (
              <div className="text-sm mt-1 opacity-90">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
