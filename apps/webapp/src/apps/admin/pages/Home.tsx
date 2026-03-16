import {
  CalendarDays,
  FileText,
  Lock,
} from "lucide-react";
import AdminLayout from "../layout/AdminLayout";
import HeroBanner from "@/components/HeroBanner";
import StatCard from "../components/StatCard";
import LockerUtilisation from "../components/LockerUtilisation";
import RecentActivity, { type ActivityItem } from "../components/RecentActivity";
import { useDashboardStats, useFloorsUtilization, useRecentActivity } from "@/services/admin/hooks";

const AdminHome = () => {
  const { data: dashboardStats } = useDashboardStats();
  const { data: floorsUtilization } = useFloorsUtilization();
  const { data: recentActivityData } = useRecentActivity();

  const floorStats = floorsUtilization?.floors?.map((floor) => ({
    name: `Floor ${floor.floor_number}`,
    total: floor.total_lockers,
    occupied: floor.occupied,
    pct: Math.round(floor.utilization_rate * 100),
  })) || [];

  const activities: ActivityItem[] = recentActivityData?.activities?.map((activity, index) => ({
    id: index + 1,
    type: mapEntityTypeToActivityType(activity.entity_type),
    action: activity.action,
    user: activity.user_name,
    time: new Date(activity.timestamp),
  })) || [];

  function mapEntityTypeToActivityType(entityType: string): ActivityItem['type'] {
    const mapping: Record<string, ActivityItem['type']> = {
      'booking': 'booking',
      'key': 'return',
      'locker': 'admin',
      'request': 'request',
    };
    return mapping[entityType] || 'admin';
  }

  const utilisationPct = dashboardStats?.total_lockers
    ? Math.round((dashboardStats.occupied_lockers / dashboardStats.total_lockers) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="w-full">
        <HeroBanner
          subtitle="Easily manage all locker administration tasks"
          statLabel="Utilisation"
          statValue={`${utilisationPct}%`}
        />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          <StatCard 
            label="Available Lockers" 
            value={dashboardStats?.available_lockers || 0} 
            sub="Across all floors" 
            icon={Lock} 
            color="green" 
          />
          <StatCard 
            label="Pending Special Requests" 
            value={dashboardStats?.pending_requests || 0} 
            sub="Awaiting review" 
            icon={FileText} 
            color="pink" 
          />
          <StatCard 
            label="Active Bookings" 
            value={dashboardStats?.active_bookings || 0} 
            sub="Currently active" 
            icon={CalendarDays} 
            color="blue" 
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LockerUtilisation 
            floorStats={floorStats} 
            totalLockers={dashboardStats?.total_lockers || 0} 
          />
          <RecentActivity activities={activities} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHome;
