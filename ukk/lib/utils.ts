import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format duration in seconds to human readable string
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes < 60) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
}

// Format relative time (e.g., "2 hours ago", "3 days ago")
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// Get color for role badge
export function getRoleColor(role: string): string {
  switch (role) {
    case "ADMIN":
      return "bg-red-500";
    case "LEADER":
      return "bg-blue-500";
    case "DEVELOPER":
      return "bg-green-500";
    case "DESIGNER":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
}

// Get priority color
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "border-red-500";
    case "MEDIUM":
      return "border-yellow-500";
    case "LOW":
      return "border-blue-500";
    default:
      return "border-gray-500";
  }
}

// Get status badge color
export function getStatusColor(status: string): string {
  switch (status) {
    case "TODO":
      return "bg-gray-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "REVIEW":
      return "bg-yellow-500";
    case "DONE":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}
