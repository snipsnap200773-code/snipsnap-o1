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
    for (let i = minH - 1; i <= maxH + 1; i++) {
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
    if (window.confirm('この予約を削除しますか？')) {
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
      
      {/* 💻 PC用サイドバー */}
      {isPC && (
        <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #ddd', padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px', background: '#fff' }}>
          <h1 style={{ color: '#2563eb', fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>SnipSnap Admin</h1>
          <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold' }}>
              {viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月
              <div>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() - 1)))} style={miniBtnStyle}>＜</button>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() + 1)))} style={miniBtnStyle}>＞</button>
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
            <input type="text" placeholder="ユーザーを検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #ddd', background: '#f8fafc' }} />
            <span style={{ position: 'absolute', left: '12px', top: '12px' }}>👥</span>
          </div>
          <button onClick={() => navigate(`/admin/${shopId}`)} style={{ marginTop: 'auto', padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>店舗設定へ</button>
        </div>
      )}

      {/* 📱💻 メイングリッドエリア */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* ヘッダー */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setStartDate(new Date())} style={headerBtnStyle}>今日</button>
            <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() - 7)))} style={headerBtnStyle}>前週</button>
            <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() + 7)))} style={headerBtnStyle}>次週</button>
          </div>
          <h2 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 'bold' }}>{startDate.getFullYear()}年 {startDate.getMonth() + 1}月</h2>
          {!isPC && <button onClick={() => navigate(`/admin/${shopId}`)} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}>⚙️</button>}
        </div>

        {/* 1画面凝縮グリッド本体 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
              <tr>
                <th style={{ width: isPC ? '60px' : '30px', borderBottom: '1px solid #ddd', fontSize: '0.6rem', color: '#999' }}>時</th>
                {weekDays.map(date => {
                  const isToday = getJapanDateStr(new Date()) === getJapanDateStr(date);
                  return (
                    <th key={date.toString()} style={{ padding: '4px 0', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6rem', color: isToday ? '#2563eb' : '#666' }}>{['日','月','火','水','木','金','土'][date.getDay()]}</div>
                      <div style={{ fontSize: isPC ? '1.2rem' : '0.9rem', fontWeight: 'bold', color: isToday ? '#fff' : '#333', background: isToday ? '#2563eb' : 'none', width: isPC ? '30px' : '22px', height: isPC ? '30px' : '22px', borderRadius: '50%', margin: '2px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => {
                const hour = time.split(':')[0];
                const min = time.split(':')[1];
                return (
                  <tr key={time} style={{ height: isPC ? '60px' : '50px' }}>
                    {/* 💡 三土手さん案：時間の縦積み表示 */}
                    <td style={{ borderRight: '1px solid #eee', borderBottom: '1px solid #f1f5f9', textAlign: 'center', lineHeight: '1.1' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#444' }}>{hour}</div>
                      <div style={{ fontSize: '0.55rem', color: '#999' }}>{min}</div>
                    </td>
                    {weekDays.map(date => {
                      const dStr = getJapanDateStr(date);
                      const res = getStatusAt(dStr, time);
                      const isStart = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === time;
                      const intervalWidth = shop?.slot_interval_min || 15;
                      const treatmentEndTime = res ? new Date(new Date(res.start_time).getTime() + res.total_slots * intervalWidth * 60000) : null;
                      const isBuffer = res && !isStart && new Date(`${dStr}T${time}`) >= treatmentEndTime;

                      return (
                        <td 
                          key={`${dStr}-${time}`} 
                          onClick={() => {
                            setSelectedDate(dStr); setTargetTime(time);
                            if (res && isStart) { openDetail(res); }
                            else { setShowMenuModal(true); }
                          }}
                          style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', position: 'relative', cursor: 'pointer' }}
                        >
                          {res && (
                            <div style={{ 
                              position: 'absolute', inset: '1px', 
                              background: isStart ? '#BAE6FD' : '#F3F4F6', 
                              color: isStart ? '#451a03' : '#cbd5e1', 
                              padding: '2px', borderRadius: '2px', zIndex: 5, overflow: 'hidden', 
                              borderLeft: `2px solid ${isStart ? '#0284c7' : '#e5e7eb'}`,
                              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                            }}>
                              {isStart ? (
                                <div style={{ 
                                  fontSize: isPC ? '0.75rem' : '0.6rem', 
                                  fontWeight: 'bold', 
                                  writingMode: isPC ? 'horizontal-tb' : 'vertical-rl', // 💡 スマホ時は縦書きでスペース確保
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {res.customer_name.slice(0, 4)}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.4rem', opacity: 0.5 }}>・</div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- モーダル（既存ロジック・レイアウト維持） --- */}
      {showDetailModal && selectedRes && (
        <div onClick={() => setShowDetailModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
            <h3 style={{ marginTop: 0, fontSize: '1.4rem' }}>{selectedRes.customer_name} 様</h3>
            <p style={{ color: '#0369a1', fontWeight: 'bold' }}>{selectedRes.options?.services?.map(s => s.name).join(' / ')}</p>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>🕒 過去の履歴</p>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {customerHistory.map(h => <div key={h.id} style={{ fontSize: '0.8rem', padding: '5px 0', borderBottom: '1px solid #f1f1f1' }}><b>{new Date(h.start_time).toLocaleDateString()}</b>: {h.options?.services?.map(s => s.name).join(', ')}</div>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => deleteRes(selectedRes.id)} style={{ flex: 1, padding: '15px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>削除</button>
              <button onClick={() => setShowDetailModal(false)} style={{ flex: 1, padding: '15px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {showMenuModal && (
        <div onClick={() => setShowMenuModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '30px', borderRadius: '30px', width: '90%', maxWidth: '340px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.9rem' }}>{selectedDate}</h3>
            <p style={{ fontWeight: '900', color: '#2563eb', fontSize: '1.8rem', margin: '0 0 20px 0' }}>{targetTime}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => navigate(`/shop/${shopId}/reserve`, { state: { adminDate: selectedDate, adminTime: targetTime } })} style={{ padding: '18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '1.1rem' }}>📝 予約を入れる</button>
              <button onClick={handleBlockTime} style={{ padding: '18px', background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '15px', fontWeight: 'bold' }}>✕ 予約不可にする</button>
              <button onClick={() => setShowMenuModal(false)} style={{ padding: '10px', color: '#94a3b8', border: 'none', background: 'none' }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const headerBtnStyle = { padding: '5px 8px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', fontSize: '0.7rem', cursor: 'pointer' };
const miniBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', color: '#2563eb', padding: '0 5px' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', backdropFilter: 'blur(8px)' };
const modalContentStyle = { background: '#fff', width: '100%', maxWidth: '380px', borderRadius: '25px', padding: '25px', position: 'relative' };

export default AdminReservations;