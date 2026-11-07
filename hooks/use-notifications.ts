"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/services/store";
import { notificationsFor } from "@/lib/services/selectors";
import { useAuth } from "./use-auth";

export function useNotifications() {
  const { user } = useAuth();
  const all = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const remove = useStore((s) => s.deleteNotification);
  const items = useMemo(() => notificationsFor(all, user), [all, user]);
  return {
    items,
    unread: items.filter((n) => !n.read).length,
    markRead,
    remove,
    markAllRead: () => user && markAll(user.id, user.role),
  };
}
