import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
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
} from 'lucide-react';
import { cn } from '@/utils/cn';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import Tutorial from '@/components/tutorial/Tutorial';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true, dataTour: 'admin-nav-home' },
  { label: 'Bookings', to: '/admin/bookings', icon: CalendarCheck, dataTour: 'admin-nav-bookings' },
  { label: 'Lockers', to: '/admin/lockers', icon: Lock, dataTour: 'admin-nav-lockers' },
  { label: 'Special Requests', to: '/admin/special-requests', icon: FileText, dataTour: 'admin-nav-special-requests' },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3, dataTour: 'admin-nav-analytics' },
  { label: 'Booking Rules', to: '/admin/rules', icon: Settings, dataTour: 'admin-nav-booking-rules' },
  { label: 'Locker Configuration', to: '/admin/locker-configuration', icon: MapPinPen, dataTour: 'admin-nav-locker-configuration' },
  { label: 'Audit Logs', to: '/admin/audit', icon: ClipboardList, dataTour: 'admin-nav-audit' },
];

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tutorialStatus = localStorage.getItem('hasSeenTutorial');
      setHasSeenTutorial(tutorialStatus === 'true');

      const handleStorageChange = () => {
        const updatedStatus = localStorage.getItem('hasSeenTutorial');
        setHasSeenTutorial(updatedStatus === 'true');
      };

      window.addEventListener('tutorialCompleted', handleStorageChange);

      return () => {
        window.removeEventListener('tutorialCompleted', handleStorageChange);
      };
    }
  }, []);

  return (
    <ProtectedRoute requiredRole="admin">
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
                data-tour={item.dataTour}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-grey hover:bg-muted hover:text-dark-blue'
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
          <div className="w-full max-w-[1200px] mx-auto p-12">
            {children}
          </div>
        </main>
      </div>

      <Tutorial mode="admin" hasSeenTutorial={hasSeenTutorial} isAdmin={true} />
    </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;
