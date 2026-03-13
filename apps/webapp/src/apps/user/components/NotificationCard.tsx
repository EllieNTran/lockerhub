import { formatDistanceToNow } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  FileText,
  KeyRound,
  MapPin,
  Building2,
  ClipboardList,
} from "lucide-react";
import type { Notification, EntityType } from "@/shared/types/notification";

interface NotificationCardProps {
  notification: Notification;
  onClick?: () => void;
}

const entityIcons: Record<NonNullable<EntityType>, typeof Bell> = {
  booking: CalendarDays,
  locker: Building2,
  key: KeyRound,
  request: FileText,
  floor: MapPin,
  booking_rule: ClipboardList,
};

const createColorScheme = (color: string) => ({
  bg: `bg-${color}-foreground/20`,
  border: `border-${color}-outline/30`,
  iconBg: `bg-${color}-foreground`,
  iconColor: `text-${color}`,
  dot: "bg-secondary",
});

const unreadColors = {
  booking: createColorScheme("purple"),
  locker: createColorScheme("primary"),
  key: createColorScheme("secondary"),
  request: createColorScheme("pink"),
  floor: createColorScheme("error"),
  booking_rule: createColorScheme("error"),
  default: {
    bg: "bg-primary-foreground",
    border: "border-primary-outline",
    iconBg: "bg-white",
    iconColor: "text-primary",
    dot: "bg-secondary",
  },
};

const readColors = {
  bg: "bg-background",
  border: "border-grey-outline",
  iconBg: "bg-grey-foreground",
  iconColor: "text-grey",
  dot: "bg-grey",
};

const NotificationCard = ({ notification, onClick }: NotificationCardProps) => {
  const Icon = notification.entity_type
    ? entityIcons[notification.entity_type]
    : Bell;

  const colorScheme = notification.read
    ? readColors
    : unreadColors[notification.entity_type || "default"] || unreadColors.default;

  return (
    <div
      onClick={onClick}
      className={`flex gap-3 rounded-lg border p-3.5 transition-colors ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      } ${colorScheme.bg} ${colorScheme.border}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorScheme.iconBg}`}
      >
        <Icon className={`h-4 w-4 ${colorScheme.iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-dark-blue truncate">
            {notification.title}
          </p>
          {!notification.read && (
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${colorScheme.dot}`}
            />
          )}
        </div>
        {notification.caption && (
          <p className="mt-0.5 text-xs text-grey line-clamp-2">
            {notification.caption}
          </p>
        )}
        <p className="mt-1 text-xs text-mid-grey">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
};

export default NotificationCard;
