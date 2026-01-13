import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminReservations() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [targetTime, setTargetTime] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date()); 

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

  // 💡 設定時間に基づく厳密な時間軸の生成
  const timeSlots = useMemo(() => {
    if (!shop?.business_hours) return [];
    let minH = 9, maxH = 20;
    Object.values(shop.business_hours).forEach(h => {
      if (!h.is_closed) {
        const op = parseInt(h.open.split(':')[0]);
        const cl = parseInt(h.close.split(':')[0]);
        if (op < minH) minH = op;
        if (cl > maxH) maxH = cl;
      }
    });
    const slots = [];
    for (let i = minH - 1; i <= maxH + 1; i++) { // 上下に1時間だけ余裕を持たせる
      slots.push(`${String(i).padStart(2, '0')}:00`);
      slots.push(`${String(i).padStart(2, '0')}:30`);
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

  const openDetail = (res) => {
    setSelectedRes(res);
    const history = reservations
      .filter(r => r.res_type === 'normal' && (r.customer_email === res.customer_email || r.customer_phone === res.customer_phone) && new Date(r.start_time) < new Date(res.start_time))
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 5);
    setCustomerHistory(history);
    setShowDetailModal(true);
  };

  const deleteRes = async (id) => {
    if (window.confirm('この予約を消去しますか？')) {
      await supabase.from('reservations').delete().eq('id', id);
      setShowDetailModal(false); fetchData();
    }
  };

  const handleBlockTime = async () => {
    const startTime = new Date(`${selectedDate}T${targetTime}`);
    const endTime = new Date(startTime.getTime() + (shop.slot_interval_min || 15) * 60000);
    await supabase.from('reservations').insert([{ shop_id: shopId, customer_name: '予約不可設定', res_type: 'blocked', start_time: startTime.toISOString(), end_time: endTime.toISOString() }]);
    setShowMenuModal(false); fetchData();
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

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#fff', overflow: 'hidden', position: 'fixed', inset: 0 }}>
      
      {/* 💻 PC用サイドバー (スマホでは非表示) */}
      {isPC && (
        <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #ddd', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#fff' }}>
          <h1 style={{ color: '#2563eb', fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>SnipSnap Admin</h1>
          <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold' }}>
              {viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月
              <div>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() - 1)))}>＜</button>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() + 1)))}>＞</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.8rem' }}>
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
      )}

      {/* 📱💻 メイングリッドエリア */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* ヘッダー：PC/スマホ共通の切り替えボタン */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setStartDate(new Date())} style={headerBtnStyle}>今日</button>
            <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() - (isPC ? 7 : 1))))} style={headerBtnStyle}>{isPC ? '前週' : '前日'}</button>
            <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() + (isPC ? 7 : 1))))} style={headerBtnStyle}>{isPC ? '次週' : '次日'}</button>
          </div>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>{startDate.getFullYear()}年 {startDate.getMonth() + 1}月</h2>
          {!isPC && <button onClick={() => navigate(`/admin/${shopId}`)} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}>⚙️</button>}
        </div>

        {/* グリッド本体 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: isPC ? '900px' : '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
              <tr>
                <th style={{ width: isPC ? '80px' : '50px', borderBottom: '1px solid #ddd', borderRight: '1px solid #eee', color: '#999', fontSize: '0.7rem' }}>GMT+09</th>
                {(isPC ? weekDays : [startDate]).map(date => {
                  const isToday = getJapanDateStr(new Date()) === getJapanDateStr(date);
                  return (
                    <th key={date.toString()} style={{ padding: '10px 0', borderBottom: '1px solid #ddd' }}>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>{['日','月','火','水','木','金','土'][date.getDay()]}</div>
                      <div style={{ fontSize: isPC ? '1.6rem' : '1.2rem', fontWeight: 'bold', color: isToday ? '#fff' : '#333', background: isToday ? '#2563eb' : 'none', width: isPC ? '40px' : '30px', height: isPC ? '40px' : '30px', borderRadius: '50%', margin: '5px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time} style={{ height: isPC ? '55px' : '65px' }}>
                  <td style={{ borderRight: '1px solid #eee', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                    {time.endsWith(':00') ? time : ''}
                  </td>
                  {(isPC ? weekDays : [startDate]).map(date => {
                    const dStr = getJapanDateStr(date);
                    const res = getStatusAt(dStr, time);
                    
                    // 💡 「予約継続中」や「清掃中」の判定ロジック
                    const isStartTime = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === time;
                    const intervalWidth = shop?.slot_interval_min || 15;
                    const treatmentEndTime = res ? new Date(new Date(res.start_time).getTime() + res.total_slots * intervalWidth * 60000) : null;
                    const isBufferTime = res && !isStartTime && new Date(`${dStr}T${time}`) >= treatmentEndTime;

                    return (
                      <td key={`${dStr}-${time}`} onClick={() => { setSelectedDate(dStr); setTargetTime(time); if(res){ openDetail(res); } else { setShowMenuModal(true); } }}
                        style={{ borderRight: '1px solid #eee', borderBottom: '1px solid #f1f5f9', position: 'relative', cursor: 'pointer' }}>
                        {res && (
                          <div style={{ 
                            position: 'absolute', inset: '2px', background: res.res_type === 'blocked' ? '#f1f1f1' : (isStartTime ? '#f9a825' : (isBufferTime ? '#f8fafc' : '#fef3c7')), 
                            color: isStartTime ? '#fff' : '#94a3b8', borderRadius: '4px', padding: '4px 6px', fontSize: '0.7rem', zIndex: 5, overflow: 'hidden', 
                            borderLeft: `4px solid ${res.res_type === 'blocked' ? '#999' : (isStartTime ? '#ef6c00' : (isBufferTime ? '#e2e8f0' : '#f9a825'))}`
                          }}>
                            {isStartTime ? (
                              <>
                                <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{res.customer_name} 様</div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>{res.options?.services?.map(s => s.name).join(', ')}</div>
                              </>
                            ) : (
                              <div style={{ fontStyle: 'italic', fontSize: '0.6rem' }}>
                                {isBufferTime ? "🧹 清掃・準備中" : "予約継続中..."}
                              </div>
                            )}
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

      {/* --- モーダル (維持) --- */}
      {showDetailModal && selectedRes && (
        <div onClick={() => setShowDetailModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
            <h3 style={{ marginTop: 0, fontSize: '1.4rem' }}>{selectedRes.customer_name} 様</h3>
            <p style={{ color: '#2563eb', fontWeight: 'bold' }}>{selectedRes.options?.services?.map(s => s.name).join(' / ')}</p>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>📅 {new Date(selectedRes.start_time).toLocaleString('ja-JP')}</p>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>🕒 過去の履歴</p>
              {customerHistory.map(h => <div key={h.id} style={{ fontSize: '0.8rem', padding: '5px 0', borderBottom: '1px solid #f1f1f1' }}><b>{new Date(h.start_time).toLocaleDateString()}</b>: {h.options?.services?.map(s => s.name).join(', ')}</div>)}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => deleteRes(selectedRes.id)} style={{ flex: 1, padding: '15px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>予約を消去</button>
              <button onClick={() => setShowDetailModal(false)} style={{ flex: 1, padding: '15px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {showMenuModal && (
        <div onClick={() => setShowMenuModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '35px', borderRadius: '30px', width: '360px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b' }}>{selectedDate.replace(/-/g, '/')}</h3>
            <p style={{ fontWeight: '900', color: '#2563eb', fontSize: '2rem', margin: '0 0 30px 0' }}>{targetTime}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button onClick={() => navigate(`/shop/${shopId}/reserve`, { state: { adminDate: selectedDate, adminTime: targetTime } })} style={{ padding: '22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.2rem' }}>📝 予約を入れる</button>
              <button onClick={handleBlockTime} style={{ padding: '20px', background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '20px', fontWeight: 'bold' }}>✕ 予約不可にする</button>
              <button onClick={() => setShowMenuModal(false)} style={{ padding: '15px', border: 'none', background: 'none', color: '#94a3b8' }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const headerBtnStyle = { padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '0.85rem', cursor: 'pointer' };
const miniBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', color: '#2563eb', padding: '0 10px' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' };
const modalContentStyle = { background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '25px', padding: '30px', position: 'relative' };

export default AdminReservations;