import type { SystemRole } from "@travel-reimbursement/shared";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { LoadingState } from "../components/ui/LoadingState";
import { useLanguage } from "../hooks/useLanguage";

interface RequireRoleProps {
  role?: SystemRole;
  roles?: readonly SystemRole[];
  children: ReactNode;
}

export function RequireRole({ role, roles, children }: RequireRoleProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { tr } = useLanguage();

  if (loading) return <LoadingState message={tr("Checking your access...", "جارٍ التحقق من الصلاحيات...")} />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const acceptedRoles = roles ?? (role ? [role] : []);
  if (!acceptedRoles.some((acceptedRole) => user.roles.includes(acceptedRole))) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
