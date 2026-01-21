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
import ShopList from './pages/ShopList'; // 👈 新しく追加
import OnePlayPortal from './pages/OnePlayPortal'; // 👈 テスト用に追加
import ShopDetail from './pages/ShopDetail'; // 🆕 【新設】店舗詳細ページを追加

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
              
              {/* 🆕 開発・テスト用のポータルページ（現在のHomeからリンクで遷移） */}
              <Route path="/oneplay-portal" element={<OnePlayPortal />} />

              {/* 👈 【新設】カテゴリ別店舗一覧ページ */}
              <Route path="/category/:categoryId" element={<ShopList />} />
              
              <Route path="/trial-registration" element={<TrialRegistration />} />

              {/* 🆕 【新設】店舗詳細（クッションページ） 予約フォームより前にこちらを通る導線にします */}
              <Route path="/shop/:shopId/detail" element={<ShopDetail />} />

              {/* 各店舗の個別ページへは /shop/:shopId でアクセス */}
              <Route path="/shop/:shopId" element={<ReservationForm />} /> 
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