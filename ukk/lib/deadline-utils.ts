/**
 * Utility functions untuk menangani deadline
 */

export type DeadlineStatus =
  | "safe"
  | "approaching"
  | "critical"
  | "overdue"
  | "none";

export interface DeadlineInfo {
  status: DeadlineStatus;
  daysRemaining: number;
  hoursRemaining: number;
  percentage: number; // 0-100, untuk progress bar
  message: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

/**
 * Menghitung status deadline berdasarkan tanggal deadline
 */
export function getDeadlineStatus(
  deadline: Date | string | null | undefined
): DeadlineInfo {
  if (!deadline) {
    return {
      status: "none",
      daysRemaining: 0,
      hoursRemaining: 0,
      percentage: 0,
      message: "No deadline set",
      color: "gray",
      bgColor: "bg-muted dark:bg-muted/50",
      textColor: "text-muted-foreground",
      icon: "📅",
    };
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();

  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  // Overdue (melewati deadline)
  if (diff < 0) {
    const daysOverdue = Math.abs(daysRemaining);
    return {
      status: "overdue",
      daysRemaining,
      hoursRemaining,
      percentage: 100,
      message: `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`,
      color: "red",
      bgColor:
        "bg-(--theme-danger)/10 dark:bg-(--theme-danger) dark:bg-opacity-20",
      textColor: "text-(--theme-danger)",
      icon: "🚨",
    };
  }

  // Critical (< 24 jam)
  if (hoursRemaining < 24) {
    return {
      status: "critical",
      daysRemaining,
      hoursRemaining,
      percentage: 90,
      message: `${hoursRemaining} hour${
        hoursRemaining !== 1 ? "s" : ""
      } remaining`,
      color: "red",
      bgColor:
        "bg-(--theme-danger)/5 dark:bg-(--theme-danger) dark:bg-opacity-15",
      textColor: "text-(--theme-danger)",
      icon: "⏰",
    };
  }

  // Approaching (< 3 hari)
  if (daysRemaining < 3) {
    return {
      status: "approaching",
      daysRemaining,
      hoursRemaining,
      percentage: 70,
      message: `${daysRemaining} day${
        daysRemaining !== 1 ? "s" : ""
      } remaining`,
      color: "orange",
      bgColor:
        "bg-(--theme-warning)/10 dark:bg-(--theme-warning) dark:bg-opacity-15",
      textColor: "text-(--theme-warning)",
      icon: "⚠️",
    };
  }

  // Safe (>= 3 hari)
  return {
    status: "safe",
    daysRemaining,
    hoursRemaining,
    percentage: 30,
    message: `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`,
    color: "green",
    bgColor:
      "bg-(--theme-success)/10 dark:bg-(--theme-success) dark:bg-opacity-15",
    textColor: "text-(--theme-success)",
    icon: "✅",
  };
}

/**
 * Format deadline untuk display
 */
export function formatDeadline(
  deadline: Date | string | null | undefined
): string {
  if (!deadline) return "No deadline";

  const date = new Date(deadline);
  const now = new Date();

  // Format: "Dec 25, 2025 at 5:00 PM"
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateStr} at ${timeStr}`;
}

/**
 * Mendapatkan warna badge untuk priority dan deadline
 */
export function getUrgencyColor(
  priority: "LOW" | "MEDIUM" | "HIGH",
  deadlineStatus: DeadlineStatus
): string {
  // Jika overdue atau critical, override dengan warna merah
  if (deadlineStatus === "overdue" || deadlineStatus === "critical") {
    return "red";
  }

  // Jika approaching, mix dengan priority
  if (deadlineStatus === "approaching") {
    return priority === "HIGH" ? "red" : "orange";
  }

  // Default berdasarkan priority
  switch (priority) {
    case "HIGH":
      return "red";
    case "MEDIUM":
      return "yellow";
    case "LOW":
      return "blue";
    default:
      return "gray";
  }
}

/**
 * Cek apakah perlu mengirim notifikasi deadline
 */
export function shouldNotifyDeadline(
  deadline: Date | string | null | undefined
): {
  shouldNotify: boolean;
  type: "approaching" | "critical" | "overdue" | null;
} {
  if (!deadline) {
    return { shouldNotify: false, type: null };
  }

  const { status } = getDeadlineStatus(deadline);

  if (status === "overdue") {
    return { shouldNotify: true, type: "overdue" };
  }

  if (status === "critical") {
    return { shouldNotify: true, type: "critical" };
  }

  if (status === "approaching") {
    return { shouldNotify: true, type: "approaching" };
  }

  return { shouldNotify: false, type: null };
}
