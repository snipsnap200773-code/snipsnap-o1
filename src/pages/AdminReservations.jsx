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

  // 1週間分の日付生成 (月曜始まり)
  const weekDays = useMemo(() => {
    const days = [];
    const base = new Date(startDate);
    const dayOfWeek = base.getDay(); 
    base.setDate(base.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); 
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [startDate]);

  // タイムスロット生成 (7:00〜21:00)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 7; i <= 21; i++) {
      slots.push(`${String(i).padStart(2, '0')}:00`);
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

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
      // 検索フィルタ
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
    if (window.confirm('この予約を消去しますか？')) {
      await supabase.from('reservations').delete().eq('id', id);
      setShowDetailModal(false); fetchData();
    }
  };

  // 左カラム用ミニカレンダーロジック
  const miniCalendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewMonth]);

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>読み込み中...</div>;

  return (
    <div style={{ display: isPC ? 'flex' : 'block', height: '100vh', width: '100vw', background: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* --- 左カラム：PC専用サイドバー --- */}
      {isPC && (
        <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #ddd', padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月</h1>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() - 1)))} style={miniBtnStyle}>＜</button>
              <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() + 1)))} style={miniBtnStyle}>＞</button>
            </div>
          </div>

          {/* ミニカレンダー */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {['月','火','水','木','金','土','日'].map(d => <div key={d} style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', paddingBottom: '10px' }}>{d}</div>)}
            {miniCalendarDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const dateStr = getJapanDateStr(date);
              const isSelected = selectedDate === dateStr;
              const isToday = getJapanDateStr(new Date()) === dateStr;
              return (
                <div key={dateStr} onClick={() => { setSelectedDate(dateStr); setStartDate(date); }} 
                  style={{ padding: '8px 0', cursor: 'pointer', borderRadius: '50%', background: isSelected ? '#2563eb' : (isToday ? '#eff6ff' : 'transparent'), color: isSelected ? '#fff' : (isToday ? '#2563eb' : '#475569'), fontSize: '0.85rem', fontWeight: isSelected || isToday ? 'bold' : '500' }}>
                  {date.getDate()}
                </div>
              );
            })}
          </div>

          {/* 検索バー */}
          <div style={{ position: 'relative', marginTop: '10px' }}>
            <input 
              type="text" 
              placeholder="ユーザーを検索" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', border: 'none', background: '#f1f5f9', fontSize: '1rem', outline: 'none' }}
            />
            <span style={{ position: 'absolute', left: '15px', top: '15px', fontSize: '1.2rem', opacity: 0.5 }}>👥</span>
          </div>

          <button onClick={() => navigate(`/admin/${shopId}`)} style={{ marginTop: 'auto', width: '100%', padding: '15px', borderRadius: '12px', background: '#fff', border: '1px solid #cbd5e1', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>店舗設定に戻る</button>
        </div>
      )}

      {/* --- 右カラム：メインコンテンツ --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
        
        {/* ヘッダー */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setStartDate(new Date())} style={headerBtnStyle}>今日</button>
            <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d); }} style={headerBtnStyle}>前週</button>
            <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d); }} style={headerBtnStyle}>次週</button>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>
            {weekDays[0].getFullYear()}年 {weekDays[0].getMonth() + 1}月
          </h2>
        </div>

        {/* カレンダー本体（スクロールエリア） */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '800px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
              <tr>
                <th style={{ width: '80px', borderBottom: '1px solid #ddd', borderRight: '1px solid #eee', color: '#999', fontSize: '0.7rem' }}>GMT+09</th>
                {weekDays.map(date => {
                  const isToday = getJapanDateStr(new Date()) === getJapanDateStr(date);
                  return (
                    <th key={date.toString()} style={{ padding: '10px 0', borderBottom: '1px solid #ddd' }}>
                      <div style={{ fontSize: '0.75rem', color: isToday ? '#2563eb' : '#666' }}>{['日','月','火','水','木','金','土'][date.getDay()]}</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: isToday ? 'bold' : 'normal', color: isToday ? '#fff' : '#333', background: isToday ? '#2563eb' : 'none', width: '40px', height: '40px', borderRadius: '50%', margin: '5px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time} style={{ height: isPC ? '50px' : '60px' }}>
                  <td style={{ borderRight: '1px solid #eee', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {time.endsWith(':00') ? time : ''}
                  </td>
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
                        style={{ borderRight: '1px solid #eee', borderBottom: '1px solid #f1f5f9', position: 'relative', cursor: 'pointer' }}
                      >
                        {res && isStartTime && (
                          <div style={{ 
                            position: 'absolute', inset: '2px', background: res.res_type === 'blocked' ? '#cbd5e1' : '#f9a825', 
                            color: '#fff', borderRadius: '4px', padding: '6px 8px', fontSize: '0.75rem', zIndex: 5, overflow: 'hidden', borderLeft: `4px solid ${res.res_type === 'blocked' ? '#94a3b8' : '#ef6c00'}`
                          }}>
                            {res.res_type === 'blocked' ? '予約不可' : (
                              <>
                                <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{res.customer_name} 様</div>
                                <div style={{ opacity: 0.9, fontSize: '0.65rem' }}>{res.options?.services?.map(s => s.name).join(', ')}</div>
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

      {/* 1. 予約詳細ポップアップ (消去ボタンあり) */}
      {showDetailModal && selectedRes && (
        <div onClick={() => setShowDetailModal(false)} style={modalOverlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
            <h3 style={{ marginTop: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{selectedRes.customer_name} 様</h3>
            <p style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '10px' }}>{selectedRes.options?.services?.map(s => s.name).join(' / ')}</p>
            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', fontSize: '0.9rem', color: '#64748b' }}>
              📞 {selectedRes.customer_phone} <br/> ✉️ {selectedRes.customer_email} <br/>
              📅 {new Date(selectedRes.start_time).toLocaleString('ja-JP')}
            </div>

            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>🕒 過去5回分の履歴</p>
              {customerHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customerHistory.map(h => (
                    <div key={h.id} style={{ fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>
                      <b>{new Date(h.start_time).toLocaleDateString()}</b>: {h.options?.services?.map(s => s.name).join(', ')}
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>履歴はありません</p>}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button onClick={() => deleteRes(selectedRes.id)} style={{ flex: 1, padding: '15px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>予約を消去</button>
              <button onClick={() => setShowDetailModal(false)} style={{ flex: 1, padding: '15px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 予約・ブロック選択ポップアップ (モバイル版と同じ雰囲気) */}
      {showMenuModal && (
        <div onClick={() => setShowMenuModal(false)} style={modalOverlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '35px', borderRadius: '30px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '1rem' }}>{selectedDate.replace(/-/g, '/')}</h3>
            <p style={{ fontWeight: '900', color: '#2563eb', fontSize: '2rem', margin: '0 0 30px 0' }}>{targetTime}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button onClick={() => navigate(`/shop/${shopId}/reserve`, { state: { adminDate: selectedDate, adminTime: targetTime } })} style={{ padding: '22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer' }}>
                📝 予約を入れる
              </button>
              <button onClick={handleBlockTime} style={{ padding: '20px', background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>✕ 予約不可にする</button>
              <button onClick={() => setShowMenuModal(false)} style={{ padding: '15px', border: 'none', background: 'none', color: '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const headerBtnStyle = { padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' };
const miniBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', color: '#2563eb', padding: '0 10px' };
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' };
const modalContentStyle = { background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '25px', padding: '30px', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' };

export default AdminReservations;