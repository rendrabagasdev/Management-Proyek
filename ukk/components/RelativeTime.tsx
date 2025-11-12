"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/utils";

interface RelativeTimeProps {
  date: Date | string | null | undefined;
  className?: string;
}

/**
 * Client-only component to display relative time
 * Uses suppressHydrationWarning to prevent mismatch
 */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [timeString, setTimeString] = useState(() => formatRelativeTime(date));

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setTimeString(formatRelativeTime(date));
    }, 60000);

    return () => clearInterval(interval);
  }, [date]);

  return (
    <span className={className} suppressHydrationWarning>
      {timeString}
    </span>
  );
}
