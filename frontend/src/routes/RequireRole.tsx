import type { SystemRole } from "@travel-reimbursement/shared";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { LoadingState } from "../components/ui/LoadingState";

interface RequireRoleProps {
  role?: SystemRole;
  roles?: readonly SystemRole[];
  children: ReactNode;
}

export function RequireRole({ role, roles, children }: RequireRoleProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState message="Checking your access..." />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const acceptedRoles = roles ?? (role ? [role] : []);
  if (!acceptedRoles.some((acceptedRole) => user.roles.includes(acceptedRole))) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
