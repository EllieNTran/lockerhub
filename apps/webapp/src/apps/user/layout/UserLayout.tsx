import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import Tutorial from '@/components/tutorial/Tutorial';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hasSeenTutorial') === 'true';
    }
    return false;
  });
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('userRole') === 'admin';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = () => {
        const updatedStatus = localStorage.getItem('hasSeenTutorial');
        setHasSeenTutorial(updatedStatus === 'true');
      };

      // Use a custom event since storage event doesn't fire in same tab
      window.addEventListener('tutorialCompleted', handleStorageChange);

      return () => {
        window.removeEventListener('tutorialCompleted', handleStorageChange);
      };
    }
  }, []);

  return (
    <ProtectedRoute requiredRole="user">
      <div className="min-h-screen bg-background">
        <Header />

        <main className="w-full flex justify-center px-6">
          <div className="w-full max-w-[1200px] py-10 -mt-4">
            {children}
          </div>
        </main>

        <Tutorial mode="user" hasSeenTutorial={hasSeenTutorial} isAdmin={isAdmin} />
      </div>
    </ProtectedRoute>
  );
}
