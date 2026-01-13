import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminReservations() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  // --- 基本State ---
  const [shop, setShop] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date()); // 表示の起点日
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // 選択日
  
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

  useEffect(() => { fetchData(); }, [shopId, startDate]);

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
      .filter(r => r.res_type === 'normal' && (r.customer_email === res.customer_email || r.customer_phone === res.customer_phone) && new Date(r.start_time) < new Date(res.start_time))
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 5);
    setCustomerHistory(history);
    setShowDetailModal(true);
  };

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
      if (searchTerm && r.customer_name && !r.customer_name.includes(searchTerm)) return false;
      return currentSlotStart >= start && currentSlotStart < end;
    });
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
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewMonth]);

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>読み込み中...</div>;

  // ==========================================
  // 💻 PC版レンダリング (2カラム・全画面)
  // ==========================================
  if (isPC) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', width: '100vw', height: '100vh', background: '#fff', zIndex: 9999 }}>
        {/* 左サイドバー */}
        <div style={{ width: '320px', borderRight: '1px solid #ddd', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1 style={{ color: '#2563eb', fontSize: '1.2rem', fontWeight: 'bold' }}>SnipSnap Admin</h1>
          <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold' }}>
              {viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月
              <div>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() - 1)))}>＜</button>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() + 1)))}>＞</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', fontSize: '0.8rem' }}>
              {['月','火','水','木','金','土','日'].map(d => <div key={d} style={{ color: '#999' }}>{d}</div>)}
              {miniCalendarDays.map((date, i) => {
                if (!date) return <div key={i} />;
                const dStr = getJapanDateStr(date);
                return <div key={i} onClick={() => { setStartDate(date); setSelectedDate(dStr); }} style={{ cursor: 'pointer', padding: '5px', borderRadius: '50%', background: dStr === selectedDate ? '#2563eb' : 'none', color: dStr === selectedDate ? '#fff' : '#333' }}>{date.getDate()}</div>;
              })}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="ユーザーを検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <span style={{ position: 'absolute', left: '12px', top: '12px' }}>👥</span>
          </div>
          <button onClick={() => navigate(`/admin/${shopId}`)} style={{ marginTop: 'auto', padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>店舗設定へ</button>
        </div>
        {/* 右カレンダー */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
            <h2>{weekDays[0].getFullYear()}年 {weekDays[0].getMonth() + 1}月</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setStartDate(new Date())} style={headerBtnStyle}>今日</button>
              <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() - 7)))} style={headerBtnStyle}>前週</button>
              <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() + 7)))} style={headerBtnStyle}>次週</button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '900px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
                <tr>
                  <th style={{ width: '80px', borderBottom: '1px solid #ddd' }}>GMT+09</th>
                  {weekDays.map(date => (
                    <th key={date.toString()} style={{ borderBottom: '1px solid #ddd', padding: '10px 0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>{['日','月','火','水','木','金','土'][date.getDay()]}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getJapanDateStr(new Date()) === getJapanDateStr(date) ? '#2563eb' : '#333' }}>{date.getDate()}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time} style={{ height: '50px' }}>
                    <td style={{ textAlign: 'center', fontSize: '0.7rem', color: '#999', borderBottom: '1px solid #f1f1f1' }}>{time.endsWith(':00') ? time : ''}</td>
                    {weekDays.map(date => {
                      const dStr = getJapanDateStr(date);
                      const res = getStatusAt(dStr, time);
                      const isStart = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === time;
                      return (
                        <td key={`${dStr}-${time}`} onClick={() => { setSelectedDate(dStr); setTargetTime(time); if(res){ if(isStart) openDetail(res); } else setShowMenuModal(true); }} style={{ border: '1px solid #f1f1f1', position: 'relative', cursor: 'pointer' }}>
                          {res && isStart && (
                            <div style={{ position: 'absolute', inset: '2px', background: res.res_type === 'blocked' ? '#ddd' : '#f9a825', color: '#fff', padding: '5px', borderRadius: '4px', fontSize: '0.7rem', zIndex: 5, borderLeft: '4px solid #ef6c00', overflow: 'hidden' }}>
                              <div style={{ fontWeight: 'bold' }}>{res.customer_name} 様</div>
                              <div>{res.options?.services?.map(s => s.name).join(', ')}</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {renderModals()}
      </div>
    );
  }

  // ==========================================
  // 📱 スマホ版レンダリング (いつものリスト表示)
  // ==========================================
  return (
    <div style={{ background: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() - 7)))} style={headerBtnStyle}>前週</button>
        <b style={{ fontSize: '1rem' }}>{startDate.getMonth() + 1}月の空き状況</b>
        <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() + 7)))} style={headerBtnStyle}>次週</button>
      </div>
      <div style={{ display: 'flex', overflowX: 'auto', padding: '10px', background: '#f8fafc', gap: '5px' }}>
        {weekDays.map(date => {
          const dStr = getJapanDateStr(date);
          const isSel = selectedDate === dStr;
          return (
            <div key={dStr} onClick={() => setSelectedDate(dStr)} style={{ flexShrink: 0, width: '50px', padding: '10px 0', textAlign: 'center', borderRadius: '12px', background: isSel ? '#2563eb' : '#fff', color: isSel ? '#fff' : '#333', border: '1px solid #eee' }}>
              <div style={{ fontSize: '0.7rem' }}>{['日','月','火','水','木','金','土'][date.getDay()]}</div>
              <b style={{ fontSize: '1rem' }}>{date.getDate()}</b>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '20px 15px' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#1e293b' }}>📅 {selectedDate.replace(/-/g, '/')} の予約詳細</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
          {timeSlots.map(time => {
            const res = getStatusAt(selectedDate, time);
            const isStart = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === time;
            return (
              <div key={time} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', width: '45px' }}>{time}</span>
                <div style={{ flex: 1 }}>
                  {res ? (
                    <div style={{ padding: '12px', background: isStart ? '#eff6ff' : '#f8fafc', borderRadius: '12px', border: '1px solid', borderColor: isStart ? '#dbeafe' : '#eee', display: 'flex', justifyContent: 'space-between' }}>
                      <div onClick={() => isStart && openDetail(res)} style={{ fontWeight: isStart ? 'bold' : 'normal', color: isStart ? '#1e40af' : '#94a3b8' }}>
                        {isStart ? `${res.customer_name} 様` : "　┗ (予約継続中)"}
                      </div>
                      {isStart && <button onClick={() => deleteRes(res.id)} style={{ color: '#ef4444', border: 'none', background: 'none', fontWeight: 'bold' }}>消去</button>}
                    </div>
                  ) : (
                    <button onClick={() => { setTargetTime(time); setShowMenuModal(true); }} style={{ width: '100%', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#94a3b8', textAlign: 'left', background: 'none' }}>＋ 枠の操作</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {renderModals()}
    </div>
  );

  // --- モーダル関数 (共通) ---
  function renderModals() {
    return (
      <>
        {showDetailModal && selectedRes && (
          <div onClick={() => setShowDetailModal(false)} style={overlayStyle}>
            <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
              <h3 style={{ marginTop: 0 }}>{selectedRes.customer_name} 様</h3>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                <p style={{ fontWeight: 'bold', color: '#2563eb', margin: '0 0 5px 0' }}>{selectedRes.options?.services?.map(s => s.name).join(' / ')}</p>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>📞 {selectedRes.customer_phone} / ✉️ {selectedRes.customer_email}</p>
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>🕒 過去の履歴</p>
              {customerHistory.map(h => <div key={h.id} style={{ fontSize: '0.8rem', padding: '5px 0', borderBottom: '1px solid #f1f1f1' }}><b>{new Date(h.start_time).toLocaleDateString()}</b>: {h.options?.services?.map(s => s.name).join(', ')}</div>)}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => deleteRes(selectedRes.id)} style={{ flex: 1, padding: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>消去する</button>
                <button onClick={() => setShowDetailModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px' }}>閉じる</button>
              </div>
            </div>
          </div>
        )}
        {showMenuModal && (
          <div onClick={() => setShowMenuModal(false)} style={overlayStyle}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '30px', borderRadius: '25px', width: '340px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{selectedDate}</h3>
              <p style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '1.6rem', margin: 0 }}>{targetTime}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px' }}>
                <button onClick={() => navigate(`/shop/${shopId}/reserve`, { state: { adminDate: selectedDate, adminTime: targetTime } })} style={{ padding: '15px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>📝 予約を入れる</button>
                <button onClick={async () => {
                  const sTime = new Date(`${selectedDate}T${targetTime}`);
                  const eTime = new Date(sTime.getTime() + (shop.slot_interval_min || 15) * 60000);
                  await supabase.from('reservations').insert([{ shop_id: shopId, customer_name: '予約不可設定', res_type: 'blocked', start_time: sTime.toISOString(), end_time: eTime.toISOString() }]);
                  setShowMenuModal(false); fetchData();
                }} style={{ padding: '15px', background: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '12px', fontWeight: 'bold' }}>✕ 予約不可にする</button>
                <button onClick={() => setShowMenuModal(false)} style={{ padding: '10px', color: '#999', border: 'none', background: 'none' }}>キャンセル</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

// スタイル定数
const headerBtnStyle = { padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '0.8rem', cursor: 'pointer' };
const miniBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', color: '#2563eb', padding: '0 5px' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' };
const modalContentStyle = { background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '25px', padding: '30px' };

export default AdminReservations;