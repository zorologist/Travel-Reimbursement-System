import { Link, useLocation, useNavigate } from "react-router-dom";

import logoUrl from "../../../EGAS.png";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { BackButton } from "../ui/BackButton";

export function Header() {
  const { user, logout } = useAuth();
  const { tr } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  function signOut() {
    void logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="app-header">
      <div className="app-header-start">
        {location.pathname !== "/home" && <BackButton />}
        <Link to="/home" className="app-brand">
          <img src={logoUrl} alt="EGAS" />
          <span><strong>EGAS</strong><small>{tr("Travel Reimbursement", "تعويضات السفر")}</small></span>
        </Link>
      </div>
      <div className="app-account">
        <span><strong>{user?.displayName}</strong><small>{user?.employeeNumber} · {user?.department}</small></span>
        <button type="button" onClick={signOut}>{tr("Sign out", "تسجيل الخروج")}</button>
      </div>
    </header>
  );
}
