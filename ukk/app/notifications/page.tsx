import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { NotificationList } from "@/components/notifications/NotificationList";
import { FaBell } from "react-icons/fa";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id);

  // Fetch all user notifications
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FaBell className="w-6 h-6 text-(--theme-primary)" />
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>
        <p className="text-muted-foreground">
          {unreadCount > 0
            ? `You have ${unreadCount} unread notification${
                unreadCount > 1 ? "s" : ""
              }`
            : "You're all caught up!"}
        </p>
      </div>

      <NotificationList initialNotifications={notifications} />
    </div>
  );
}
