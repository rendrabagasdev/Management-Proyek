"use client";

import { createContext, useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  initializeFCM,
  onForegroundMessage,
  deleteFCMToken,
  isNotificationSupported,
} from "@/lib/fcm";

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

  const toast = useCallback((toast: Toast) => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Initialize FCM when user logs in
  useEffect(() => {
    if (status === "authenticated" && session && !fcmInitialized) {
      // Check if notifications are supported
      if (!isNotificationSupported()) {
        console.log("Push notifications not supported in this browser");
        return;
      }

      // Initialize FCM and get token
      initializeFCM()
        .then((token) => {
          if (token) {
            console.log("FCM initialized successfully");
            setFcmInitialized(true);
          }
        })
        .catch((error) => {
          console.error("Failed to initialize FCM:", error);
        });

      // Listen for foreground messages
      const unsubscribe = onForegroundMessage((payload) => {
        console.log("Foreground message:", payload);

        // Show toast notification
        toast({
          title: payload.notification?.title || "New Notification",
          description: payload.notification?.body || "",
        });

        // Optionally play a sound or show browser notification
        if (payload.notification) {
          // You can add sound here
          // new Audio('/notification-sound.mp3').play();
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [status, session, fcmInitialized, toast]);

  // Clean up FCM token on logout
  useEffect(() => {
    if (status === "unauthenticated" && fcmInitialized) {
      deleteFCMToken().then(() => {
        setFcmInitialized(false);
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
