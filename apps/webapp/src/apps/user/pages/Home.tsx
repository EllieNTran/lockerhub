import { useNavigate } from 'react-router';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  FileText,
  KeyRound,
  CalendarPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserLayout from '../layout/UserLayout';
import QuickActionCard from '@/apps/user/components/QuickActionCard';
import NotificationCard from '@/apps/user/components/NotificationCard';
import BookingCard from '@/apps/user/components/BookingCard';
import HeroBanner from '@/components/HeroBanner';
import { useUserNotifications, useMarkNotificationAsRead } from '@/services/notifications';
import { getUserIdFromToken } from '@/services/auth';
import { useUserBookings } from '@/services/bookings';
import type { Notification } from '@/types/notification';

const Home = () => {
  const navigate = useNavigate();
  const userId = getUserIdFromToken() || '';
  
  const { data: notificationsData, isLoading: isLoadingNotifications } = useUserNotifications(userId, true);
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unread || 0;
  
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  
  const { data: bookingsData, isLoading: isLoadingBookings } = useUserBookings();

  const upcomingBookings = bookingsData?.filter((b) => {
    const isActiveOrUpcoming = b.status === 'active' || b.status === 'upcoming';
    const monthFromNow = new Date();
    monthFromNow.setDate(monthFromNow.getDate() + 30);
    const isWithinMonth = new Date(b.start_date) <= monthFromNow;
    return isActiveOrUpcoming && isWithinMonth;
  }) || [];

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead({ userId, notificationId: notification.notification_id });
    }
  };

  return (
    <UserLayout>
      <div className="w-full">
        <div className="mt-3">
          <HeroBanner
            subtitle="Easily book, view, and manage all your locker bookings"
            statLabel="Bookings"
            statValue={upcomingBookings.length}
          />
        </div>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickActionCard
            icon={CalendarPlus}
            title="Book a Locker"
            subtitle="Up to 3 days"
            color="purple"
            onClick={() => navigate('/user/book')}
          />
          <QuickActionCard
            icon={FileText}
            title="Special Request"
            subtitle="Extended / permanent booking"
            color="pink"
            onClick={() => navigate('/user/special-request')}
          />
          <QuickActionCard
            icon={KeyRound}
            title="Return Key"
            subtitle="View return instructions"
            color="secondary"
            onClick={() => navigate('/user/return-key')}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-grey-outline bg-white p-6 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-blue">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-red text-white text-xs hover:bg-red">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {isLoadingNotifications ? (
              <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                <p className="text-sm text-grey">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                <Bell className="h-10 w-10 text-grey/40 mb-3" />
                <p className="text-sm text-grey">No notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: Notification) => (
                  <NotificationCard
                    key={notification.notification_id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-grey-outline bg-white p-6 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-blue">Upcoming Bookings</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/user/my-bookings')}
                  className="text-xs text-grey hover:text-dark-blue"
                >
                  View All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/user/book')}
                  className="text-xs text-secondary hover:bg-secondary hover:text-white"
                >
                  New Booking
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
            {isLoadingBookings ? (
              <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                <p className="text-sm text-grey">Loading bookings...</p>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                <CalendarDays className="h-10 w-10 text-grey/40 mb-3" />
                <p className="text-sm text-grey">No upcoming bookings</p>
                <p className="text-xs text-grey/60 mt-1">
                  Book a locker to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.booking_id} booking={booking} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Home;
