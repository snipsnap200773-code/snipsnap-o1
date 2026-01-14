import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReservationForm from './pages/ReservationForm';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdmin from './pages/SuperAdmin'; 
import TimeSelection from './pages/TimeSelection'; 
import ConfirmReservation from './pages/ConfirmReservation';
import AdminReservations from './pages/AdminReservations';
import TrialRegistration from './pages/TrialRegistration';
import CancelReservation from './pages/CancelReservation';

function App() {
  return (
    <Router>
      <Routes>
        {/* 🚀 【PCフル画面・管理エリア】案B：URLを推測困難なものに変更 */}
        {/* 三土手さん、このパス（/super-admin-...）をブラウザのお気に入りに保存してください */}
        <Route path="/super-admin-216-midote-snipsnap-dmaaaahkmm" element={<SuperAdmin />} />
        
        <Route path="/admin/:shopId" element={<AdminDashboard />} />
        <Route path="/admin/:shopId/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/:shopId/reservations" element={<AdminReservations />} />

        {/* 📱 【スマホ480px制限・ユーザーエリア】 */}
        <Route path="*" element={
          <div className="mobile-container" style={{ margin: '0 auto', maxWidth: '480px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/trial-registration" element={<TrialRegistration />} />
              <Route path="/shop/:shopId/reserve" element={<ReservationForm />} />
              <Route path="/shop/:shopId/reserve/time" element={<TimeSelection />} />
              <Route path="/shop/:shopId/confirm" element={<ConfirmReservation />} />
              <Route path="/cancel" element={<CancelReservation />} />
              <Route path="/shop/:shopId/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;