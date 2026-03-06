import { useNavigate } from "react-router";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  FileText,
  KeyRound,
  MapPin,
  Plus,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserLayout from "../layout/UserLayout";
import { mockBookings, mockNotifications, mockLockers, mockFloors } from "@/shared/data/mockData";

const statusColors: Record<string, string> = {
  active: "bg-success-foreground text-success border-success-outline",
  upcoming: "bg-secondary-muted text-secondary border-secondary-outline",
  expired: "bg-muted text-muted-foreground border-border",
};

const notificationIcons: Record<string, typeof Bell> = {
  key_return: KeyRound,
  special_request: FileText,
  booking: CalendarDays, 
  info: Bell,
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning!";
  if (hour < 18) return "Good Afternoon!";
  return "Good Evening!";
};

const Home = () => {
  const navigate = useNavigate();
  const bookings = mockBookings.filter(
    (b) => b.user_id === 'u1' && (b.status === 'upcoming' || b.status === 'active')
  );
  const notifications = mockNotifications.filter((n) => n.user_id === 'u1');

  return (
    <UserLayout>
      <div className="w-full">
        {/* Hero Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-secondary/20" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{getGreeting()}</h2>
              <p className="mt-2 text-white/80 text-sm">
                Easily book, view, and manage all your locker bookings
              </p>
              <div className="mt-4 flex items-center gap-2 text-white/70 text-sm">
                <Building2 className="h-4 w-4" />
                <span>Canary Wharf, London Office</span>
              </div>
            </div>
            <div className="flex h-24 w-28 flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <span className="text-3xl font-bold">{bookings.length}</span>
              <span className="text-sm text-white/90">Bookings</span>
            </div>
          </div>
        </div>

        {/* Quick Links — Book, Special Request, Return Key */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => navigate("/book")}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary hover:shadow-md text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-foreground transition-colors group-hover:bg-primary-foreground">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Book a Locker</p>
              <p className="text-xs text-muted-foreground">Up to 3 days</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/special-request")}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary hover:shadow-md text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-foreground transition-colors group-hover:bg-primary-foreground">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Special Request</p>
              <p className="text-xs text-muted-foreground">Extended / permanent booking</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/return-key")}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary hover:shadow-md text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-foreground transition-colors group-hover:bg-primary-foreground">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Return Key</p>
              <p className="text-xs text-muted-foreground">View return instructions</p>
            </div>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Notifications */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
              {notifications.filter((n) => !n.read).length > 0 && (
                <Badge className="bg-destructive text-destructive-foreground text-xs">
                  {notifications.filter((n) => !n.read).length} new
                </Badge>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type] || Bell;
                  return (
                    <div
                      key={notification.notification_id}
                      className={`flex gap-3 rounded-lg border p-3.5 transition-colors ${
                        notification.read
                          ? "bg-background border-border"
                          : "bg-primary-foreground border-primary-outline"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          notification.read ? "bg-muted" : "bg-primary-foreground"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            notification.read ? "text-muted-foreground" : "text-primary"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {notification.caption}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Bookings */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Upcoming Bookings</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/my-bookings")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  View All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/book")}
                  className="text-xs text-secondary hover:bg-secondary hover:text-white"
                >
                  New Booking
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming bookings</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Book a locker to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  // Get locker details from mockLockers
                  const locker = mockLockers.find((l) => l.locker_id === booking.locker_id);
                  const floor = mockFloors.find((f) => f.floor_id === locker?.floor_id);
                  
                  return (
                    <div
                      key={booking.booking_id}
                      className="flex items-center justify-between rounded-lg border border-border bg-white p-3.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground text-primary font-bold text-sm shrink-0">
                          {locker?.locker_number.split('-')[2] || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Floor {floor?.number || '?'}</span>
                            <Badge
                              variant="outline"
                              className={statusColors[booking.status]}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(booking.booking_start), "MMM d")} —{" "}
                              {format(new Date(booking.booking_end), "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {locker?.locker_number || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Home;
