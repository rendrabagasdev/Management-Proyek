"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FaCheck,
  FaTrash,
  FaCheckDouble,
  FaBroom,
  FaFilter,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationListProps {
  initialNotifications: Notification[];
}

export function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.isRead : true
  );

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const deleteAllRead = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?deleteAll=true", {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
      }
    } catch (error) {
      console.error("Failed to delete all read:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CARD_ASSIGNED":
        return "📋";
      case "CARD_UPDATED":
        return "✏️";
      case "CARD_COMPLETED":
        return "✅";
      case "COMMENT_ADDED":
        return "💬";
      case "COMMENT_MENTION":
        return "🔔";
      case "SUBTASK_COMPLETED":
        return "☑️";
      case "PROJECT_INVITE":
        return "📁";
      default:
        return "🔔";
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Actions Bar */}
      <Card>
        <CardContent className="py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className="text-xs sm:text-sm"
              >
                <FaFilter className="mr-1 sm:mr-2 h-3 w-3" />
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unread")}
                className="text-xs sm:text-sm"
              >
                <FaFilter className="mr-1 sm:mr-2 h-3 w-3" />
                Unread ({unreadCount})
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <FaCheckDouble className="mr-1 sm:mr-2 h-3 w-3" />
                  <span className="hidden sm:inline">Mark All Read</span>
                  <span className="sm:hidden">All Read</span>
                </Button>
              )}
              {notifications.some((n) => n.isRead) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteAllRead}
                  disabled={loading}
                  className="flex-1 sm:flex-none text-(--theme-danger) hover:text-(--theme-danger-dark) text-xs sm:text-sm"
                >
                  <FaBroom className="mr-1 sm:mr-2 h-3 w-3" />
                  <span className="hidden sm:inline">Clear Read</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-2 sm:space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
              <p className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
                All caught up!
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You have no unread notifications"
                  : "You have no notifications"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.isRead
                  ? "bg-(--theme-primary-light)/10 border-l-4 border-l-(--theme-primary)"
                  : ""
              }`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-4">
                  {/* Icon */}
                  <div className="text-2xl sm:text-3xl shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-1">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge
                            variant="default"
                            className="text-[10px] sm:text-xs shrink-0"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {notification.createdAt &&
                        !isNaN(new Date(notification.createdAt).getTime())
                          ? formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                              }
                            )
                          : "Just now"}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-foreground mb-2 line-clamp-2">
                      {notification.message}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      {notification.link && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification.id);
                            }
                          }}
                          className="text-xs h-7 sm:h-8"
                        >
                          <Link href={notification.link}>View</Link>
                        </Button>
                      )}
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs h-7 sm:h-8"
                        >
                          <FaCheck className="mr-1 sm:mr-2 h-3 w-3" />
                          <span className="hidden sm:inline">Mark Read</span>
                          <span className="sm:hidden">Read</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-(--theme-danger) hover:text-(--theme-danger-dark) text-xs h-7 sm:h-8"
                      >
                        <FaTrash className="mr-1 sm:mr-2 h-3 w-3" />
                        <span className="hidden sm:inline">Delete</span>
                        <span className="sm:hidden">Del</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
