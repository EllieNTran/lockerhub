import type { ReactNode } from "react";
import Header from "@/components/Header";
import ProtectedRoute from "@/shared/components/ProtectedRoute";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ProtectedRoute requiredRole="user">
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="w-full flex justify-center px-6">
          <div className="w-full max-w-[1200px] py-10">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
