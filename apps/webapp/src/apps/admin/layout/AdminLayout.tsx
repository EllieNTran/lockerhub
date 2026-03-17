import type { ReactNode } from "react";
import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Lock,
  CalendarCheck,
  FileText,
  Settings,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  MapPinPen,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import Header from "@/components/Header";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Bookings", to: "/admin/bookings", icon: CalendarCheck },
  { label: "Lockers", to: "/admin/lockers", icon: Lock },
  { label: "Special Requests", to: "/admin/special-requests", icon: FileText },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Audit Logs", to: "/admin/audit", icon: ClipboardList },
  { label: "Booking Rules", to: "/admin/rules", icon: Settings },
  { label: "Locker Configuration", to: "/admin/locker-configuration", icon: MapPinPen },
];

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">

        <aside className="w-60 shrink-0 border-r border-grey/30 bg-card flex flex-col">
          <div className="px-4 py-4 border-b border-grey/30">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-grey">
                Admin Panel
              </span>
            </div>
          </div>
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-grey hover:bg-muted hover:text-dark-blue"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="w-full max-w-[1200px] mx-auto px-14 py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
