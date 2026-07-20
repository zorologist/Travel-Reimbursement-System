import { Link, useNavigate } from "react-router-dom";

import logoUrl from "../../../EGAS.png";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";

export function Header() {
  const { user, logout } = useAuth();
  const { tr } = useLanguage();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="app-header">
      <Link to="/home" className="app-brand">
        <img src={logoUrl} alt="EGAS" />
        <span><strong>EGAS</strong><small>{tr("Travel Reimbursement", "تعويضات السفر")}</small></span>
      </Link>
      <div className="app-account">
        <span><strong>{user?.displayName}</strong><small>{user?.employeeNumber} · {user?.department}</small></span>
        <button type="button" onClick={signOut}>{tr("Sign out", "تسجيل الخروج")}</button>
      </div>
    </header>
  );
}
