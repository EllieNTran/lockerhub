import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CalendarDays,
  FileText,
  KeyRound,
  MapPin,
  Building2,
  ClipboardList,
  Clock,
} from 'lucide-react';
import type { Notification, EntityType } from '@/types/notification';

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
  waiting_list: Clock,
};

type ColorScheme = {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  dot: string;
};

const unreadColors: Record<NonNullable<EntityType> | 'default', ColorScheme> = {
  booking: {
    bg: 'bg-purple-foreground/20',
    border: 'border-purple-outline/30',
    iconBg: 'bg-purple-foreground',
    iconColor: 'text-purple',
    dot: 'bg-secondary',
  },
  locker: {
    bg: 'bg-primary-foreground/20',
    border: 'border-primary-outline/30',
    iconBg: 'bg-primary-foreground',
    iconColor: 'text-primary',
    dot: 'bg-secondary',
  },
  key: {
    bg: 'bg-secondary-foreground/20',
    border: 'border-secondary-outline/30',
    iconBg: 'bg-secondary-foreground',
    iconColor: 'text-secondary',
    dot: 'bg-secondary',
  },
  request: {
    bg: 'bg-pink-foreground/20',
    border: 'border-pink-outline/30',
    iconBg: 'bg-pink-foreground',
    iconColor: 'text-pink',
    dot: 'bg-secondary',
  },
  floor: {
    bg: 'bg-red-foreground/20',
    border: 'border-red-outline/30',
    iconBg: 'bg-red-foreground',
    iconColor: 'text-red',
    dot: 'bg-secondary',
  },
  booking_rule: {
    bg: 'bg-red-foreground/20',
    border: 'border-red-outline/30',
    iconBg: 'bg-red-foreground',
    iconColor: 'text-red',
    dot: 'bg-secondary',
  },
  waiting_list: {
    bg: 'bg-baby-blue-foreground/20',
    border: 'border-baby-blue-outline/30',
    iconBg: 'bg-baby-blue-foreground',
    iconColor: 'text-baby-blue',
    dot: 'bg-secondary',
  },
  default: {
    bg: 'bg-primary-foreground/20',
    border: 'border-primary-outline/30',
    iconBg: 'bg-white',
    iconColor: 'text-primary',
    dot: 'bg-secondary',
  },
};

const readColors: ColorScheme = {
  bg: 'bg-background',
  border: 'border-grey-outline',
  iconBg: 'bg-grey-foreground',
  iconColor: 'text-grey',
  dot: 'bg-grey',
};

const NotificationCard = ({ notification, onClick }: NotificationCardProps) => {
  const Icon = notification.entity_type
    ? entityIcons[notification.entity_type]
    : Bell;

  const colorScheme = notification.read
    ? readColors
    : unreadColors[notification.entity_type || 'default'] || unreadColors.default;

  return (
    <div
      onClick={onClick}
      className={`flex gap-3 rounded-lg border p-3.5 transition-colors ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
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
