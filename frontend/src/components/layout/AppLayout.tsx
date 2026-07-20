import { Outlet } from "react-router-dom";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import "../../styles/layout.css";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <div className="app-shell-body">
        <Sidebar />
        <div className="app-shell-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
