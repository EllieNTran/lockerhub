import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Lock,
  CalendarCheck,
  FileText,
  Settings,
  ClipboardList,
  ChevronLeft,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Manage Lockers", to: "/admin/lockers", icon: Lock },
  { label: "Active Bookings", to: "/admin/bookings", icon: CalendarCheck },
  { label: "Special Requests", to: "/admin/special-requests", icon: FileText },
  { label: "Booking Rules", to: "/admin/rules", icon: Settings },
  { label: "Audit Logs", to: "/admin/audit", icon: ClipboardList },
];

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r bg-card flex flex-col">
          <div className="px-4 py-4 border-b">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-background">
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
                      ? "bg-primary text-primary-foreground"
                      : "text-background hover:bg-muted hover:text-dark-blue"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="px-3 pb-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-xs text-background hover:text-dark-blue transition-colors px-3 py-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to User View
            </button>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="w-full max-w-[3000px] mx-auto px-6 py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
