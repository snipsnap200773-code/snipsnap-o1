import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReservationForm from './pages/ReservationForm';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="mobile-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:shopId" element={<div style={{textAlign: "center"}}>店舗詳細（準備中）</div>} />
          <Route path="/shop/:shopId/reserve" element={<ReservationForm />} />
          <Route path="/admin/:shopId" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;