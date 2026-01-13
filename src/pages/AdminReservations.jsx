import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminReservations() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  // --- 状態管理 ---
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date()); 

  // 画面サイズ監視
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

  // 1週間分の日付生成
  const weekDays = useMemo(() => {
    const days = [];
    const base = new Date(startDate);
    const dayOfWeek = base.getDay(); 
    base.setDate(base.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // 月曜始まり
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [startDate]);

  // タイムスロット生成
  const timeSlots = useMemo(() => {
    if (!shop || !shop.business_hours) return [];
    let minOpen = "09:00"; let maxClose = "20:00";
    Object.values(shop.business_hours).forEach(h => {
      if (!h.is_closed) {
        if (h.open < minOpen) minOpen = h.open;
        if (h.close > maxClose) maxClose = h.close;
      }
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
      if (searchTerm && r.customer_name && !r.customer_name.includes(searchTerm)) return false;
      return currentSlotStart >= start && currentSlotStart < end;
    });
  };

  const handleBlockTime = async () => {
    const startTime = new Date(`${selectedDate}T${targetTime}`);
    const endTime = new Date(startTime.getTime() + (shop.slot_interval_min || 15) * 60000);
    await supabase.from('reservations').insert([{
      shop_id: shopId, customer_name: '予約不可設定', res_type: 'blocked',
      start_time: startTime.toISOString(), end_time: endTime.toISOString()
    }]);
    setShowMenuModal(false); fetchData();
  };

  const deleteRes = async (id) => {
    if (window.confirm('この予約を削除しますか？')) {
      await supabase.from('reservations').delete().eq('id', id);
      setShowDetailModal(false); fetchData();
    }
  };

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

  return (
    <div style={{ display: isPC ? 'flex' : 'block', height: '100vh', width: '100vw', background: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* --- 左カラム（PC専用サイドバー） --- */}
      {isPC && (
        <div style={{ width: '300px', flexShrink: 0, borderRight: '1px solid #e2e8f0', padding: '25px', display: 'flex', flexDirection: 'column', gap: '30px', background: '#fff', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '35px', height: '35px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>S</div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: '#1e293b' }}>SnipSnap Admin</h1>
          </div>

          {/* ミニカレンダー（1ヶ月分） */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <b style={{ fontSize: '1rem' }}>{viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月</b>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() - 1)))} style={miniBtnStyle}>＜</button>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() + 1)))} style={miniBtnStyle}>＞</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
              {['日','月','火','水','木','金','土'].map(d => <div key={d} style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold', paddingBottom: '10px' }}>{d}</div>)}
              {miniCalendarDays.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />;
                const dateStr = getJapanDateStr(date);
                const isSelected = selectedDate === dateStr;
                return (
                  <div key={dateStr} onClick={() => { setSelectedDate(dateStr); setStartDate(date); }} 
                    style={{ padding: '8px 0', cursor: 'pointer', borderRadius: '50%', background: isSelected ? '#2563eb' : 'transparent', color: isSelected ? '#fff' : '#475569', fontSize: '0.8rem', fontWeight: isSelected ? 'bold' : '500', transition: '0.2s' }}>
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
              placeholder="ユーザーを検索" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '15px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }}
            />
            <span style={{ position: 'absolute', left: '15px', top: '15px', fontSize: '1.2rem', opacity: 0.5 }}>🔍</span>
          </div>

          <button onClick={() => navigate(`/admin/${shopId}`)} style={{ marginTop: 'auto', width: '100%', padding: '15px', borderRadius: '12px', background: '#fff', border: '1px solid #cbd5e1', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>店舗設定に戻る</button>
        </div>
      )}

      {/* --- メインコンテンツ（週カレンダー or スマホリスト） --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
        
        {/* ヘッダー */}
        <div style={{ padding: '15px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {!isPC && <button onClick={() => navigate(`/admin/${shopId}`)} style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem' }}>⚙️</button>}
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>
              {weekDays[0].getMonth() + 1}月 {weekDays[0].getDate()}日 〜 {weekDays[6].getDate()}日
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d); }} style={headerBtnStyle}>前週</button>
            <button onClick={() => setStartDate(new Date())} style={{ ...headerBtnStyle, background: '#2563eb', color: '#fff', borderColor: '#2563eb' }}>今日</button>
            <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d); }} style={headerBtnStyle}>次週</button>
          </div>
        </div>

        {/* カレンダー本体（スクロールエリア） */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: isPC ? '20px' : '0' }}>
          <div style={{ minWidth: isPC ? '900px' : '100%', background: '#fff', borderRadius: isPC ? '20px' : '0', boxShadow: isPC ? '0 4px 20px rgba(0,0,0,0.05)' : 'none', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
                <tr>
                  <th style={{ width: '70px', padding: '20px 0', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}></th>
                  {weekDays.map(date => {
                    const dateStr = getJapanDateStr(date);
                    const isToday = getJapanDateStr(new Date()) === dateStr;
                    return (
                      <th key={dateStr} style={{ padding: '15px 0', borderBottom: '1px solid #f1f5f9', background: isToday ? '#eff6ff' : '#fff' }}>
                        <div style={{ fontSize: '0.75rem', color: isToday ? '#2563eb' : '#94a3b8', fontWeight: 'bold' }}>{['日','月','火','水','木','金','土'][date.getDay()]}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: isToday ? '#2563eb' : '#1e293b', marginTop: '5px' }}>{date.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time}>
                    <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', height: isPC ? '80px' : '60px' }}>{time}</td>
                    {weekDays.map(date => {
                      const dateStr = getJapanDateStr(date);
                      const res = getStatusAt(dateStr, time);
                      const isStartTime = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === time;

                      return (
                        <td 
                          key={`${dateStr}-${time}`} 
                          onClick={() => {
                            setSelectedDate(dateStr); setTargetTime(time);
                            if (res) { if (isStartTime || !isPC) openDetail(res); } 
                            else { setShowMenuModal(true); }
                          }}
                          style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', position: 'relative', cursor: 'pointer', background: res ? (res.res_type === 'blocked' ? '#f8fafc' : '#eff6ff') : '#fff' }}
                        >
                          {res && isStartTime && (
                            <div style={{ 
                              position: 'absolute', inset: '4px', background: res.res_type === 'blocked' ? '#cbd5e1' : '#2563eb', 
                              color: '#fff', borderRadius: '10px', padding: '10px', fontSize: '0.85rem', overflow: 'hidden', zIndex: 1,
                              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', lineWeight: '1.4'
                            }}>
                              {res.res_type === 'blocked' ? '予約不可' : (
                                <>
                                  <div style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{res.customer_name} 様</div>
                                  <div style={{ opacity: 0.9, fontSize: '0.7rem', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '4px' }}>
                                    {res.options?.services?.map(s => s.name).join(', ')}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          {!res && !isPC && <div style={{ textAlign: 'center', color: '#e2e8f0', fontSize: '1.2rem' }}>○</div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- モーダル (ロジック維持) --- */}
      
      {/* 1. 予約詳細 & 履歴 & 消去ボタン */}
      {showDetailModal && selectedRes && (
        <div onClick={() => setShowDetailModal(false)} style={modalOverlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
            <button onClick={() => setShowDetailModal(false)} style={closeBtnStyle}>×</button>
            <div style={{ padding: '40px' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900' }}>{selectedRes.customer_name} 様</h3>
                <div style={{ marginTop: '15px', padding: '10px', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.9rem', color: '#475569' }}>
                  📞 {selectedRes.customer_phone} <br/> ✉️ {selectedRes.customer_email}
                </div>
              </div>

              <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '20px', marginBottom: '30px', border: '1px solid #dbeafe' }}>
                <div style={{ color: '#1e40af', fontWeight: 'bold', fontSize: '1.1rem' }}>📅 {new Date(selectedRes.start_time).toLocaleString('ja-JP', {month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                <div style={{ marginTop: '10px', color: '#2563eb', fontWeight: 'bold' }}>✂️ {selectedRes.options?.services?.map(s => s.name).join(' / ')}</div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>🕒 過去の来店履歴</p>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {customerHistory.length > 0 ? customerHistory.map(h => (
                    <div key={h.id} style={{ fontSize: '0.85rem', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <b>{new Date(h.start_time).toLocaleDateString()}</b>: {h.options?.services?.map(s => s.name).join(', ')}
                    </div>
                  )) : <div style={{ color: '#cbd5e1', fontSize: '0.85rem', padding: '10px 0' }}>履歴はありません</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => deleteRes(selectedRes.id)} style={{ flex: 1, padding: '18px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>予約を削除</button>
                <button onClick={() => setShowDetailModal(false)} style={{ flex: 1, padding: '18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>閉じる</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ねじ込み予約・ブロック選択 (image_203d95.png を再現) */}
      {showMenuModal && (
        <div onClick={() => setShowMenuModal(false)} style={modalOverlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '35px', borderRadius: '30px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b' }}>{selectedDate.replace(/-/g, '/')}</h3>
            <p style={{ fontWeight: '900', color: '#2563eb', fontSize: '2rem', margin: '0 0 30px 0' }}>{targetTime}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button onClick={() => navigate(`/shop/${shopId}/reserve`, { state: { adminDate: selectedDate, adminTime: targetTime } })} style={{ padding: '22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                📝 予約を入れる
              </button>
              <button onClick={handleBlockTime} style={{ padding: '20px', background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem' }}>✕ 予約不可にする</button>
              <button onClick={() => setShowMenuModal(false)} style={{ padding: '15px', background: 'none', border: 'none', color: '#94a3b8', fontWeight: 'bold' }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル定数
const headerBtnStyle = { padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const miniBtnStyle = { border: 'none', background: '#f1f5f9', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', fontSize: '0.8rem', color: '#2563eb', fontWeight: 'bold' };
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' };
const modalContentStyle = { background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '35px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const closeBtnStyle = { position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f8fafc', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8', fontWeight: 'bold' };

export default AdminReservations;