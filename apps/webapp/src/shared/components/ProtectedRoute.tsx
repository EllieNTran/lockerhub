import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole: "admin" | "user";
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("userRole"));
    }
  }, []);

  useEffect(() => {
    if (userRole === null) return;
    
    if (!userRole) {
      navigate("/", { replace: true });
      return;
    }
    if (requiredRole === "admin" && userRole !== "admin") {
      navigate("/user", { replace: true });
    }
  }, [userRole, requiredRole, navigate]);

  if (!userRole) {
    return null;
  }

  if (requiredRole === "admin" && userRole !== "admin") {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
