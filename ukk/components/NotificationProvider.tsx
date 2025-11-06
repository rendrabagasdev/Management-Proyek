"use client";

import { createContext, useState, useCallback } from "react";

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
  const [toasts, setToasts] = useState<(Toast & { id: string })[]>([]);

  const toast = useCallback((toast: Toast) => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

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
                ? "bg-red-600 text-white"
                : "bg-white border"
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
