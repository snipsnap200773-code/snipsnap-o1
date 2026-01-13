import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminReservations() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  // --- 既存の状態管理 ---
  const [shop, setShop] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }); 
  
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [targetTime, setTargetTime] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);

  // --- 🆕 新規追加：PC版用の状態管理 ---
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date()); // 左側ミニカレンダー用

  // 画面幅監視
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPC = windowWidth > 1024;

  useEffect(() => {
    fetchData();
  }, [shopId, startDate]);

  const fetchData = async () => {
    setLoading(true);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (profile) setShop(profile);

    const { data: resData } = await supabase.from('reservations').select('*').eq('shop_id', shopId);
    setReservations(resData || []);
    setLoading(false);
  };

  const openDetail = (res) => {
    setSelectedRes(res);
    const history = reservations
      .filter(r => 
        r.res_type === 'normal' && 
        (r.customer_email === res.customer_email || r.customer_phone === res.customer_phone) &&
        new Date(r.start_time) < new Date(res.start_time)
      )
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 5);
    
    setCustomerHistory(history);
    setShowDetailModal(true);
  };

  // 1週間分の日付配列
  const weekDays = useMemo(() => {
    const days = [];
    const base = new Date(startDate);
    const dayOfWeek = base.getDay(); 
    // 月曜日始まりに調整（Googleカレンダー風）
    base.setDate(base.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [startDate]);

  // タイムスロット生成（維持）
  const timeSlots = useMemo(() => {
    if (!shop || !shop.business_hours) return [];
    let minOpen = "09:00"; let maxClose = "20:00";
    Object.values(shop.business_hours).forEach(h => {
      if (h.is_closed) return;
      if (h.open < minOpen) minOpen = h.open;
      if (h.close > maxClose) maxClose = h.close;
    });
    const slots = [];
    const interval = shop.slot_interval_min || 15;
    let current = new Date();
    const [h, m] = minOpen.split(':').map(Number);
    current.setHours(h, m, 0, 0);
    const dayEnd = new Date();
    const [eh, em] = maxClose.split(':').map(Number);
    dayEnd.setHours(eh, em, 0, 0);
    while (current < dayEnd) {
      slots.push(current.toTimeString().slice(0, 5));
      current.setMinutes(current.getMinutes() + interval);
    }
    return slots;
  }, [shop]);

  const getJapanDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getStatusAt = (dateStr, timeStr) => {
    const currentSlotStart = new Date(`${dateStr}T${timeStr}:00`).getTime();
    return reservations.find(r => {
      const start = new Date(r.start_time).getTime();
      const end = new Date(r.end_time).getTime();
      // 検索ワードがある場合はフィルタリング
      if (searchTerm && r.customer_name && !r.customer_name.includes(searchTerm)) return false;
      return currentSlotStart >= start && currentSlotStart < end;
    });
  };
  
  const handleBlockTime = async () => {
    const startTime = new Date(`${selectedDate}T${targetTime}`);
    const endTime = new Date(startTime.getTime() + (shop.slot_interval_min || 15) * 60000);
    const { error } = await supabase.from('reservations').insert([{
      shop_id: shopId, customer_name: '予約不可設定', res_type: 'blocked',
      start_time: startTime.toISOString(), end_time: endTime.toISOString()
    }]);
    if (!error) { setShowMenuModal(false); fetchData(); }
  };

  const deleteRes = async (id) => {
    if (window.confirm('この予約を削除しますか？')) {
      await supabase.from('reservations').delete().eq('id', id);
      setShowDetailModal(false);
      fetchData();
    }
  };

  // --- 🆕 ミニカレンダー生成ロジック ---
  const miniCalendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewMonth]);

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>読み込み中...</div>;

  // --- メインレンダリング ---
  return (
    <div style={{ display: isPC ? 'flex' : 'block', height: '100vh', background: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* 🆕 左カラム：ミニカレンダー & 検索 (PC版のみ) */}
      {isPC && (
        <div style={{ width: '280px', borderRight: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '25px', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: '#2563eb', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>SnipSnap Admin</h1>
          </div>

          {/* ミニカレンダー */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <b style={{ fontSize: '0.9rem' }}>{viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月</b>
              <div>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() - 1)))} style={miniBtnStyle}>＜</button>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() + 1)))} style={miniBtnStyle}>＞</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '0.7rem' }}>
              {['日','月','火','水','木','金','土'].map(d => <div key={d} style={{ color: '#64748b', fontWeight: 'bold', padding: '5px 0' }}>{d}</div>)}
              {miniCalendarDays.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />;
                const dateStr = getJapanDateStr(date);
                const isSelected = selectedDate === dateStr;
                return (
                  <div key={dateStr} onClick={() => { setSelectedDate(dateStr); setStartDate(date); }} 
                    style={{ padding: '8px 0', cursor: 'pointer', borderRadius: '50%', background: isSelected ? '#2563eb' : 'transparent', color: isSelected ? '#fff' : '#333', fontSize: '0.8rem', fontWeight: isSelected ? 'bold' : 'normal' }}>
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 検索バー */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="🔍 ユーザーを検索" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }}>👥</span>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button onClick={() => navigate(`/admin/${shopId}`)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>⚙️ 店舗設定に戻る</button>
          </div>
        </div>
      )}

      {/* 右カラム：メイン予約画面 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* ヘッダー */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {!isPC && <button onClick={() => navigate(`/admin/${shopId}`)} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}>⚙️</button>}
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{startDate.getMonth() + 1}月 {startDate.getDate()}日の週</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d); }} style={headerBtnStyle}>前週</button>
            <button onClick={() => setStartDate(new Date())} style={headerBtnStyle}>今日</button>
            <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d); }} style={headerBtnStyle}>次週</button>
          </div>
        </div>

        {/* カレンダー本体 */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', background: '#fff' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
              <tr>
                <th style={{ width: '60px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}></th>
                {weekDays.map(date => {
                  const dateStr = getJapanDateStr(date);
                  const isToday = getJapanDateStr(new Date()) === dateStr;
                  return (
                    <th key={dateStr} style={{ padding: '15px 5px', borderBottom: '2px solid #e2e8f0', fontSize: '0.8rem', color: isToday ? '#2563eb' : '#64748b' }}>
                      <div style={{ opacity: 0.7 }}>{['日','月','火','水','木','金','土'][date.getDay()]}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', marginTop: '4px' }}>{date.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time}>
                  <td style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #f1f5f9', height: '60px' }}>{time}</td>
                  {weekDays.map(date => {
                    const dateStr = getJapanDateStr(date);
                    const res = getStatusAt(dateStr, time);
                    const isStartTime = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === time;

                    return (
                      <td 
                        key={`${dateStr}-${time}`} 
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setTargetTime(time);
                          if (res) {
                            if (isStartTime || !isPC) openDetail(res);
                          } else {
                            setShowMenuModal(true);
                          }
                        }}
                        style={{ 
                          borderRight: '1px solid #f1f5f9', 
                          borderBottom: '1px solid #f1f5f9', 
                          position: 'relative', 
                          cursor: 'pointer',
                          background: res ? (res.res_type === 'blocked' ? '#f1f5f9' : '#eff6ff') : '#fff'
                        }}
                      >
                        {res && isStartTime && (
                          <div style={{ 
                            position: 'absolute', inset: '2px', background: res.res_type === 'blocked' ? '#cbd5e1' : '#2563eb', 
                            color: '#fff', borderRadius: '4px', padding: '4px', fontSize: '0.7rem', overflow: 'hidden', zIndex: 1,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                          }}>
                            {res.res_type === 'blocked' ? '予約不可' : (
                              <>
                                <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{res.customer_name} 様</div>
                                <div style={{ opacity: 0.9, fontSize: '0.6rem', marginTop: '2px' }}>{res.options?.services?.map(s => s.name).join(', ')}</div>
                              </>
                            )}
                          </div>
                        )}
                        {!res && !isPC && <div style={{ textAlign: 'center', color: '#e2e8f0' }}>◎</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- モーダル類 (既存ロジック・レイアウト維持) --- */}
      
      {/* 1. 詳細モーダル (削除ボタン追加) */}
      {showDetailModal && selectedRes && (
        <div onClick={() => setShowDetailModal(false)} style={modalOverlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
            <button onClick={() => setShowDetailModal(false)} style={closeBtnStyle}>×</button>
            <div style={{ padding: '30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '5px' }}>Reservation Details</div>
                <h3 style={{ margin: 0, fontSize: '1.6rem' }}>{selectedRes.customer_name} 様</h3>
                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#2563eb', fontWeight: 'bold' }}>
                  📞 {selectedRes.customer_phone} / ✉️ {selectedRes.customer_email}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '25px' }}>
                <div style={{ color: '#1e293b', fontWeight: 'bold' }}>📅 {new Date(selectedRes.start_time).toLocaleString('ja-JP')}</div>
                <div style={{ marginTop: '8px', color: '#2563eb' }}>✂️ {selectedRes.options?.services?.map(s => s.name).join(' / ')}</div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>🕒 過去の来店履歴</p>
                {customerHistory.map(h => (
                  <div key={h.id} style={{ fontSize: '0.8rem', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <b>{new Date(h.start_time).toLocaleDateString()}</b>: {h.options?.services?.map(s => s.name).join(', ')}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => deleteRes(selectedRes.id)} style={{ flex: 1, padding: '15px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>予約を削除する</button>
                <button onClick={() => setShowDetailModal(false)} style={{ flex: 1, padding: '15px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>閉じる</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ねじ込み・ブロックモーダル (モバイル版の雰囲気維持) */}
      {showMenuModal && (
        <div onClick={() => setShowMenuModal(false)} style={modalOverlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>{selectedDate}</h3>
            <p style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '1.4rem' }}>{targetTime}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '25px' }}>
              <button onClick={() => navigate(`/shop/${shopId}/reserve`, { state: { adminDate: selectedDate, adminTime: targetTime } })} style={{ padding: '20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold' }}>📝 予約を入れる</button>
              <button onClick={handleBlockTime} style={{ padding: '20px', background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '16px', fontWeight: 'bold' }}>✕ 予約不可にする</button>
              <button onClick={() => setShowMenuModal(false)} style={{ padding: '10px', background: 'none', border: 'none', color: '#666' }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義 ---
const headerBtnStyle = { padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' };
const miniBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', padding: '5px', fontSize: '0.9rem', color: '#2563eb' };
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' };
const modalContentStyle = { background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '28px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' };
const closeBtnStyle = { position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' };

export default AdminReservations;