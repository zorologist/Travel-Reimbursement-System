import { NavLink } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";

const reviewRoles = ["manager", "pr", "transportation", "timing"] as const;

export function Sidebar() {
  const { user } = useAuth();
  const { tr } = useLanguage();
  const canReview = reviewRoles.some((role) => user?.roles.includes(role));

  return (
    <aside className="app-sidebar" aria-label={tr("Main navigation", "التنقل الرئيسي")}>
      <nav>
        <NavLink to="/dashboard">{tr("Overview", "نظرة عامة")}</NavLink>
        <NavLink to="/requests/new">{tr("New request", "طلب جديد")}</NavLink>
        <NavLink to="/my-requests">{tr("My requests", "طلباتي")}</NavLink>
        {canReview && <NavLink to="/approvals">{tr("Department queue", "قائمة اعتماد القسم")}</NavLink>}
        {user?.roles.includes("salary") && <NavLink to="/salary">{tr("Salary queue", "قائمة الرواتب")}</NavLink>}
      </nav>
      <p>{tr("Development workspace", "بيئة التطوير")}<br /><small>{tr("Connected to authenticated feature APIs.", "متصل بواجهات النظام الموثقة.")}</small></p>
    </aside>
  );
}
