import { ForbiddenPage } from "./pages/ForbiddenPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NewRequestPage from './pages/NewRequestPage';
import MyRequestsPage from './pages/MyRequestsPage';
// لو عندك صفحات تانية زي الـ Login أو الـ Dashboard فكي الكومنت عنهم هنا:
// import LoginPage from './pages/LoginPage';
// import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* مسار صفحة عدم السماح بالوصول */}
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* مسار أي رابط غير موجود (404) */}
        <Route path="*" element={<NotFoundPage />} />

        {/* الصفحة الرئيسية هتحول الموظف تلقائياً لصفحة طلباته */}
        <Route path="/" element={<Navigate to="/my-requests" replace />} />
        
        {/* مسار صفحة عرض الطلبات الحالية */}
        <Route path="/my-requests" element={<MyRequestsPage />} />
        
        {/* مسار صفحة تقديم طلب جديد */}
        <Route path="/new-request" element={<NewRequestPage />} />
        
        {/* لو حبّيتي تضيفي باقي الصفحات بعدين هتكون هنا بنفس الطريقة */}
      </Routes>
    </Router>
  );
}
