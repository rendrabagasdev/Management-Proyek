import { useContext } from "react";
import { ToastContext } from "@/components/NotificationProvider";

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within NotificationProvider");
  }
  return context;
};
