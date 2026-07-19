import type { SystemRole } from "@travel-reimbursement/shared";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

interface RequireRoleProps {
  role: SystemRole;
  children: ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user.roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
