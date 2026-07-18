// Global routes, providers, and page layout are composed in this root component.
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MainMenuPage } from "./pages/MainMenuPage";
import { NewRequestPage } from "./pages/NewRequestPage";
import { RequestDetailsPage } from "./pages/RequestDetailsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<MainMenuPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/requests/new" element={<NewRequestPage />} />
        <Route path="/requests/:id" element={<RequestDetailsPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
