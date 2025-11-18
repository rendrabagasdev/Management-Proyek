import React, { useMemo } from "react";
import { getDeadlineStatus, formatDeadline } from "@/lib/deadline-utils";
import { FaClock, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

interface DeadlineBadgeProps {
  deadline: Date | string | null | undefined;
  showIcon?: boolean;
  showMessage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  mode?: "gelp" | "default";
}

export function DeadlineBadge({
  deadline,
  showIcon = true,
  showMessage = true,
  size = "md",
  className = "",
  mode = "default",
}: DeadlineBadgeProps) {
  const info = getDeadlineStatus(deadline);

  if (info.status === "none") {
    return null;
  }

  // Mode gelp: tampilkan badge khusus
  if (mode === "gelp") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-pink-600 text-white border border-pink-700 ${
          size === "sm"
            ? "text-xs px-2 py-0.5"
            : size === "lg"
            ? "text-base px-3 py-1.5"
            : "text-sm px-2.5 py-1"
        } ${className}`}
        title={formatDeadline(deadline)}
      >
        {showIcon && (
          <FaExclamationTriangle className="shrink-0 animate-bounce" />
        )}
        {showMessage && <span>GELP MODE: {info.message}</span>}
      </div>
    );
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const IconComponent =
    info.status === "overdue"
      ? FaExclamationTriangle
      : info.status === "critical"
      ? FaClock
      : info.status === "approaching"
      ? FaExclamationTriangle
      : FaCheckCircle;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${info.bgColor} ${info.textColor} ${sizeClasses[size]} ${className}`}
      title={formatDeadline(deadline)}
    >
      {showIcon && <IconComponent className="shrink-0" />}
      {showMessage && <span>{info.message}</span>}
    </div>
  );
}

interface DeadlineProgressProps {
  deadline: Date | string | null | undefined;
  createdAt?: Date | string;
  className?: string;
}

export function DeadlineProgress({
  deadline,
  createdAt,
  className = "",
}: DeadlineProgressProps) {
  const info = getDeadlineStatus(deadline);

  // Hitung persentase progress berdasarkan waktu yang sudah berlalu
  const progressPercentage = React.useMemo(() => {
    if (createdAt && deadline) {
      const start = new Date(createdAt).getTime();
      const end = new Date(deadline).getTime();
      const now = new Date().getTime();
      const total = end - start;
      const elapsed = now - start;
      return Math.min(100, Math.max(0, (elapsed / total) * 100));
    }
    return info.percentage;
  }, [createdAt, deadline, info.percentage]);

  if (info.status === "none") {
    return null;
  }

  const progressColor =
    info.status === "overdue"
      ? "bg-(--theme-danger) dark:bg-(--theme-danger)/20"
      : info.status === "critical"
      ? "bg-(--theme-danger) opacity-90"
      : info.status === "approaching"
      ? "bg-(--theme-warning)"
      : "bg-(--theme-success)";

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1 text-xs">
        <span className={info.textColor}>
          {info.icon} {info.message}
        </span>
        <span className="text-muted-foreground">
          {formatDeadline(deadline)}
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${progressColor} transition-all duration-300 ${
            info.status === "overdue" || info.status === "critical"
              ? "animate-pulse"
              : ""
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}

interface DeadlineAlertProps {
  deadline: Date | string | null | undefined;
  title?: string;
  className?: string;
}

export function DeadlineAlert({
  deadline,
  title = "Deadline",
  className = "",
}: DeadlineAlertProps) {
  const info = getDeadlineStatus(deadline);

  // Hanya tampilkan alert untuk status approaching, critical, atau overdue
  if (info.status === "none" || info.status === "safe") {
    return null;
  }

  const borderColor =
    info.status === "overdue"
      ? "border-(--theme-danger)/80"
      : info.status === "critical"
      ? "border-(--theme-danger)/80"
      : "border-(--theme-warning)";

  return (
    <div
      className={`border-l-4 ${borderColor} ${info.bgColor} p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{info.icon}</span>
        <div className="flex-1">
          <h3 className={`font-semibold ${info.textColor} mb-1`}>
            {info.status === "overdue"
              ? "⚠️ Deadline Passed!"
              : info.status === "critical"
              ? "🚨 Urgent: Deadline Approaching!"
              : "⏰ Deadline Approaching"}
          </h3>
          <p className={`text-sm ${info.textColor}`}>
            {title}: {formatDeadline(deadline)}
          </p>
          <p className={`text-sm ${info.textColor} mt-1`}>{info.message}</p>
        </div>
      </div>
    </div>
  );
}
