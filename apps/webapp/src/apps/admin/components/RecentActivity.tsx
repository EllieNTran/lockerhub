import { BookOpen, CalendarDays, FileText, KeyRound, Layers, Lock, ShieldCheck, Users, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type ActivityType = 'booking' | 'return' | 'admin' | 'cancel' | 'request';

export interface ActivityItem {
  id: number;
  type: ActivityType;
  action: string;
  user: string;
  time: Date;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const createColorScheme = (color: string) => ({
  bg: `bg-${color}-foreground/20`,
  border: `border-${color}-outline/30`,
  iconBg: `bg-${color}-foreground`,
  iconColor: `text-${color}`,
  dot: "bg-secondary",
});

const activityIcon: Record<ActivityType, typeof Lock> = {
  booking: CalendarDays,
  return: KeyRound,
  admin: ShieldCheck,
  cancel: XCircle,
  request: FileText,
};

const activityColors: Record<ActivityType, ReturnType<typeof createColorScheme>> = {
  booking: createColorScheme("purple"),
  return: createColorScheme("secondary"),
  admin: createColorScheme("primary"),
  cancel: createColorScheme("error"),
  request: createColorScheme("pink"),
};

const RecentActivity = ({ activities }: RecentActivityProps) => {
  return (
    <div className={`rounded-xl border border-grey-outline bg-card p-6 shadow-sm ${activities.length === 0 ? 'flex flex-col min-h-[380px]' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-dark-blue flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Recent Activity
        </h3>
      </div>
      <div className={activities.length === 0 ? "flex-1 flex items-center justify-center mb-10" : "space-y-4"}>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center">
            <Layers className="h-8 w-8 text-grey/40 mb-2" />
            <p className="text-sm text-grey">No recent activity</p>
          </div>
        ) : (
          activities.map((item) => {
            const Icon = activityIcon[item.type] || BookOpen;
            const colors = activityColors[item.type] || createColorScheme("primary");
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconColor}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-dark-blue leading-snug">{item.action}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Users className="h-3 w-3 text-grey" />
                    <span className="text-xs text-grey">{item.user}</span>
                    <span className="text-xs text-grey">·</span>
                    <span className="text-xs text-grey">
                      {formatDistanceToNow(item.time, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
