import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReservationForm from './pages/ReservationForm';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdmin from './pages/SuperAdmin'; 
import TimeSelection from './pages/TimeSelection'; 
import ConfirmReservation from './pages/ConfirmReservation';
import AdminReservations from './pages/AdminReservations';
// 💡 追加：キャンセル専用画面
import CancelReservation from './pages/CancelReservation';

function App() {
  return (
    <Router>
      <div className="mobile-container">
        <Routes>
          {/* 三土手さん専用の管理画面（秘密のパス） */}
          <Route path="/super-admin-snipsnap" element={<SuperAdmin />} />

          {/* ポータル（ホーム）画面 */}
          <Route path="/" element={<Home />} />

          {/* 店舗主用：設定画面 */}
          <Route path="/admin/:shopId" element={<AdminDashboard />} />

          {/* ユーザー用：予約プロセス（3ステップ分割ロジック） */}
          {/* 1. メニュー選択画面 */}
          <Route path="/shop/:shopId/reserve" element={<ReservationForm />} />
          {/* 2. 日時選択画面 */}
          <Route path="/shop/:shopId/reserve/time" element={<TimeSelection />} />
          {/* 3. 最終確認画面 */}
          <Route path="/shop/:shopId/confirm" element={<ConfirmReservation />} />

          {/* 💡 追加：お客様用キャンセル画面 */}
          <Route path="/cancel" element={<CancelReservation />} />

          {/* 店舗主用：予約一覧（台帳）画面 */}
          <Route path="/admin/:shopId/reservations" element={<AdminReservations />} />

          {/* 予備・互換用ルート */}
          <Route path="/shop/:shopId/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;