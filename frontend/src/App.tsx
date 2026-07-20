import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { LanguageToggle } from "./components/ui/LanguageToggle";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { LoginPage } from "./pages/LoginPage";
import { MainMenuPage } from "./pages/MainMenuPage";
import MyRequestsPage from "./pages/MyRequestsPage";
import NewRequestPage from "./pages/NewRequestPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { RequestDetailsPage } from "./pages/RequestDetailsPage";
import { SalaryDashboardPage } from "./pages/SalaryDashboardPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RequireRole } from "./routes/RequireRole";
import "./styles/motion.css";

function AnimatedRoutes() {
  const location = useLocation();
  const navigationType = useNavigationType().toLowerCase();

  return (
    <div
      key={location.key}
      className="route-transition"
      data-navigation={navigationType}
    >
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <MainMenuPage />
            </ProtectedRoute>
          }
        />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-requests" element={<MyRequestsPage />} />
          <Route path="/requests" element={<Navigate to="/my-requests" replace />} />
          <Route path="/new-request" element={<Navigate to="/requests/new" replace />} />
          <Route path="/requests/new" element={<NewRequestPage />} />
          <Route
            path="/approvals"
            element={<RequireRole roles={["manager", "pr", "transportation", "timing"]}><ApprovalsPage /></RequireRole>}
          />
        </Route>
        <Route path="/requests/:id" element={<ProtectedRoute><RequestDetailsPage /></ProtectedRoute>} />
        <Route
          path="/salary"
          element={
            <RequireRole role="salary">
              <SalaryDashboardPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <LanguageToggle />
          <AnimatedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
