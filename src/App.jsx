import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReservationForm from './pages/ReservationForm';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdmin from './pages/SuperAdmin'; // ← ここで SuperAdmin を読み込みます

function App() {
  return (
    <Router>
      <div className="mobile-container">
        <Routes>
          {/* 三土手さん専用の管理画面（一番上に追加しておきます） */}
          <Route path="/super-admin-snipsnap" element={<SuperAdmin />} />

          {/* ポータル（ホーム）画面 */}
          <Route path="/" element={<Home />} />

          {/* 店舗詳細（将来用） */}
          <Route path="/shop/:shopId/admin" element={<AdminDashboard />} />

          {/* ユーザー用：予約フォーム */}
          <Route path="/shop/:shopId/reserve" element={<ReservationForm />} />

          {/* 店舗主用：設定画面（パスを admin/:shopId に統一しています） */}
          <Route path="/admin/:shopId" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;