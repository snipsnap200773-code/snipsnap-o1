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
        {/* ============================================================
            🚀 PCフルスクリーン・エリア
            （mobile-containerの外にあるため、画面幅100%で表示されます）
           ============================================================ */}
        
        {/* 三土手さん専用の管理画面（秘密のパス） */}
        <Route path="/super-admin-snipsnap" element={<SuperAdmin />} />

        {/* 店舗主用：設定画面（Dashboard直打ちにも対応） */}
        <Route path="/admin/:shopId" element={<AdminDashboard />} />
        <Route path="/admin/:shopId/dashboard" element={<AdminDashboard />} />

        {/* 店舗主用：予約一覧（台帳・Googleカレンダー風）画面 */}
        <Route path="/admin/:shopId/reservations" element={<AdminReservations />} />


        {/* ============================================================
            📱 スマホ制限エリア（max-width: 480px）
            （ここから下のルートはすべて mobile-container の中で表示されます）
           ============================================================ */}
        <Route path="*" element={
          <div className="mobile-container">
            <Routes>
              {/* ポータル（ホーム）画面 */}
              <Route path="/" element={<Home />} />

              {/* トライアル申し込み画面 */}
              <Route path="/trial-registration" element={<TrialRegistration />} />

              {/* ユーザー用：予約プロセス（3ステップ分割ロジック） */}
              <Route path="/shop/:shopId/reserve" element={<ReservationForm />} />
              <Route path="/shop/:shopId/reserve/time" element={<TimeSelection />} />
              <Route path="/shop/:shopId/confirm" element={<ConfirmReservation />} />

              {/* キャンセル画面 */}
              <Route path="/cancel" element={<CancelReservation />} />

              {/* 予備・互換用ルート */}
              <Route path="/shop/:shopId/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;