import { Lock, ShieldCheck, User, LogOut } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { Switch } from '@/components/ui/switch';
import { useViewMode } from '../context/ViewModeContext';
import { Button } from './ui/button';
import { toast } from '@/components/ui/sonner';
import { useLogout } from '@/services/auth/hooks';

type HeaderProps = {
  showNav?: boolean;
};

const Header = ({ showNav = true }: HeaderProps) => {
  const { viewMode, setViewMode, isAdmin } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const [userRole, setUserRole] = useState<string | null>(null);
  const canAccessAdmin = userRole === 'admin';

  const logoutMutation = useLogout();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  useEffect(() => {
    if (isAdminRoute && viewMode !== 'admin') {
      setViewMode('admin');
    } else if (!isAdminRoute && viewMode !== 'user') {
      setViewMode('user');
    }
  }, [isAdminRoute, viewMode, setViewMode]);

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      logoutMutation.mutate(refreshToken, {
        onSuccess: () => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userRole');
          navigate('/login');
          toast.success('Logged out successfully');
        },
        onError: (error) => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userRole');
          navigate('/login');
          console.error('Logout error:', error);
        },
      });
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      navigate('/login');
    }
  };

  const handleToggle = (checked: boolean) => {
    if (!canAccessAdmin && checked) {
      return;
    }

    setViewMode(checked ? 'admin' : 'user');
    if (checked) {
      navigate('/admin');
    } else {
      navigate('/user');
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors hover:text-primary-foreground',
      isActive ? 'text-primary-foreground' : 'text-primary-foreground/60'
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

        <div className="flex items-center gap-1">
          {showNav && (
            <div className="flex items-center gap-3">
              {canAccessAdmin && (
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
                  <User className={cn('h-3.5 w-3.5 transition-colors', !isAdmin ? 'text-white' : 'text-primary-foreground/80')} />
                  <span className={cn('text-xs transition-colors', !isAdmin ? 'text-white font-medium' : 'text-primary-foreground/80')}>
                    User
                  </span>
                  <Switch
                    checked={isAdmin}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-secondary data-[state=unchecked]:bg-white/20"
                  />
                  <ShieldCheck className={cn('h-3.5 w-3.5 transition-colors', isAdmin ? 'text-white' : 'text-primary-foreground/80')} />
                  <span className={cn('text-xs transition-colors', isAdmin ? 'text-white font-medium' : 'text-primary-foreground/80')}>
                    Admin
                  </span>
                </div>
              )}
            </div>
          )}

          {userRole && (
            <Button
              variant="icon"
              className="text-white hover:text-primary-foreground [&_svg]:!size-5 pr-0"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut />
            </Button>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
