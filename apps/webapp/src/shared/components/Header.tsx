import { Lock, ShieldCheck, User } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { Switch } from "@/components/ui/switch";
import { useViewMode } from "../context/ViewModeContext";

type HeaderProps = {
  showNav?: boolean;
};

const Header = ({ showNav = true }: HeaderProps) => {
  const { viewMode, setViewMode, isAdmin } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const [userRole, setUserRole] = useState<string | null>(null);
  const canAccessAdmin = userRole === "admin";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("userRole"));
    }
  }, []);

  useEffect(() => {
    if (isAdminRoute && viewMode !== "admin") {
      setViewMode("admin");
    } else if (!isAdminRoute && viewMode !== "user") {
      setViewMode("user");
    }
  }, [isAdminRoute, viewMode, setViewMode]);

  const handleToggle = (checked: boolean) => {
    if (!canAccessAdmin && checked) {
      return;
    }
    
    setViewMode(checked ? "admin" : "user");
    if (checked) {
      navigate("/admin");
    } else {
      navigate("/user");
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-sm font-medium transition-colors hover:text-primary-foreground",
      isActive ? "text-primary-foreground" : "text-primary-foreground/60"
    );

  return (
    <header className="border-b bg-primary">
      <div className="flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-white">
                LockerHub
              </h1>
              <p className="text-xs text-primary-foreground/60">
                All-in-one locker platform
              </p>
            </div>
          </div>
          {showNav && !isAdminRoute && (
            <nav className="flex items-center gap-5 ml-4">
              <NavLink to="/user" end className={linkClass}>Home</NavLink>
              <NavLink to="/user/book" className={linkClass}>Book a Locker</NavLink>
              <NavLink to="/user/my-bookings" className={linkClass}>My Bookings</NavLink>
              <NavLink to="/user/special-request" className={linkClass}>Special Request</NavLink>
              <NavLink to="/user/return-key" className={linkClass}>Return Key Instructions</NavLink>
            </nav>
          )}
        </div>

        {showNav && (
          <div className="flex items-center gap-3">
            {canAccessAdmin && (
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
                <User className={cn("h-3.5 w-3.5 transition-colors", !isAdmin ? "text-white" : "text-primary-foreground/80")} />
                <span className={cn("text-xs transition-colors", !isAdmin ? "text-white font-medium" : "text-primary-foreground/80")}>
                  User
                </span>
                <Switch
                  checked={isAdmin}
                  onCheckedChange={handleToggle}
                  className="data-[state=checked]:bg-secondary data-[state=unchecked]:bg-white/20"
                />
                <ShieldCheck className={cn("h-3.5 w-3.5 transition-colors", isAdmin ? "text-white" : "text-primary-foreground/80")} />
                <span className={cn("text-xs transition-colors", isAdmin ? "text-white font-medium" : "text-primary-foreground/80")}>
                  Admin
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
