import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { DashboardPage } from "./pages/DashboardPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { LoginPage } from "./pages/LoginPage";
import { MainMenuPage } from "./pages/MainMenuPage";
import MyRequestsPage from "./pages/MyRequestsPage";
import NewRequestPage from "./pages/NewRequestPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SalaryDashboardPage } from "./pages/SalaryDashboardPage";
import { RequestDetailsPage } from "./pages/RequestDetailsPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RequireRole } from "./routes/RequireRole";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
            <Route path="/approvals" element={<RequireRole roles={["manager", "pr", "transportation", "timing"]}><ApprovalsPage /></RequireRole>} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
