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
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE')); 
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
    for (let i = minH; i <= maxH; i++) {
      slots.push(`${String(i).padStart(2, '0')}:00`);
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
    return slots;
  }, [shop]);

  const getJapanDateStr = (date) => date.toLocaleDateString('sv-SE');

  const getStatusAt = (dateStr, timeStr) => {
    const currentSlotStart = new Date(`${dateStr}T${timeStr}:00`).getTime();
    const matches = reservations.filter(r => {
      // 💡 テーブルに合わせて start_time を優先して判定に使用
      const start = new Date(r.start_time).getTime();
      const end = new Date(r.end_time).getTime();
      if (searchTerm && r.customer_name && !r.customer_name.includes(searchTerm)) return false;
      return currentSlotStart >= start && currentSlotStart < end;
    });

    if (matches.length === 0) return null;

    // 優先順位: 1.その時間に始まる予約 2.ブロック(✕) 3.継続中
    const exact = matches.find(r => new Date(r.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === timeStr);
    if (exact) return exact;
    return matches.find(r => r.res_type === 'blocked') || matches[0];
  };

  const deleteRes = async (id) => {
    if (window.confirm('この枠を予約可能な状態（◎）に戻しますか？')) {
      await supabase.from('reservations').delete().eq('id', id);
      setShowDetailModal(false); fetchData();
    }
  };

  const handleBlockTime = async () => {
    const startTimeStr = `${selectedDate}T${targetTime}:00`;
    const startTime = new Date(startTimeStr);
    const endTime = new Date(startTime.getTime() + (shop.slot_interval_min || 15) * 60000);
    
    // 💡 修正：スクリーンショットで確認した全カラムにデータを入れます
    const insertData = { 
      shop_id: shopId, 
      customer_name: '管理者によるブロック', 
      res_type: 'blocked', 
      start_at: startTime.toISOString(),  // 両方の時間カラムを埋める
      end_at: endTime.toISOString(),
      start_time: startTime.toISOString(), 
      end_time: endTime.toISOString(),
      total_slots: 1,                      // 数値型として送信
      customer_email: 'admin@example.com',
      customer_phone: '---',
      options: { services: [] }
    };

    const { error } = await supabase.from('reservations').insert([insertData]);
    
    if (error) {
      console.error("Insert Error:", error);
      alert(`ブロックに失敗しました: ${error.message}`);
    } else {
      setShowMenuModal(false); 
      fetchData();
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

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#fff', overflow: 'hidden', position: 'fixed', inset: 0 }}>
      {/* 💻 PC用サイドバー */}
      {isPC && (
        <div style={{ width: '300px', flexShrink: 0, borderRight: '1px solid #e2e8f0', padding: '25px', display: 'flex', flexDirection: 'column', gap: '30px', background: '#fff', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '35px', height: '35px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>S</div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: '#1e293b' }}>SnipSnap Admin</h1>
          </div>
          <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold' }}>
              {viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() - 1)))} style={miniBtnStyle}>＜</button>
                <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() + 1)))} style={miniBtnStyle}>＞</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '0.8rem' }}>
              {['月','火','水','木','金','土','日'].map(d => <div key={d} style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold' }}>{d}</div>)}
              {miniCalendarDays.map((date, i) => {
                if (!date) return <div key={i} />;
                const dStr = getJapanDateStr(date);
                return <div key={i} onClick={() => { setStartDate(date); setSelectedDate(dStr); }} style={{ padding: '8px 0', cursor: 'pointer', borderRadius: '50%', background: dStr === selectedDate ? '#2563eb' : 'none', color: dStr === selectedDate ? '#fff' : '#475569' }}>{date.getDate()}</div>;
              })}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="ユーザーを検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '15px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
            <span style={{ position: 'absolute', left: '15px', top: '15px' }}>🔍</span>
          </div>
          <button onClick={() => navigate(`/admin/${shopId}`)} style={{ marginTop: 'auto', padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>店舗設定へ</button>
        </div>
      )}

      {/* 📱💻 メイングリッドエリア */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: isPC ? '10px 20px' : '8px 12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setStartDate(new Date())} style={headerBtnStyle}>今日</button>
            <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() - 7)))} style={headerBtnStyle}>前週</button>
            <button onClick={() => setStartDate(new Date(startDate.setDate(startDate.getDate() + 7)))} style={headerBtnStyle}>次週</button>
          </div>
          <h2 style={{ fontSize: isPC ? '1rem' : '0.85rem', margin: 0, fontWeight: 'bold' }}>{startDate.getFullYear()}年 {startDate.getMonth() + 1}月</h2>
          {!isPC && <button onClick={() => navigate(`/admin/${shopId}`)} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}>⚙️</button>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: isPC ? 'auto' : 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: isPC ? '900px' : '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
              <tr>
                <th style={{ width: isPC ? '80px' : '32px', borderBottom: '1px solid #ddd', fontSize: '0.6rem', color: '#999' }}></th>
                {weekDays.map(date => {
                  const isToday = getJapanDateStr(new Date()) === getJapanDateStr(date);
                  return (
                    <th key={date.toString()} style={{ padding: '4px 0', borderBottom: '1px solid #ddd' }}>
                      <div style={{ fontSize: '0.6rem', color: isToday ? '#2563eb' : '#666' }}>{['日','月','火','水','木','金','土'][date.getDay()]}</div>
                      <div style={{ fontSize: isPC ? '1.5rem' : '0.9rem', fontWeight: 'bold', color: isToday ? '#fff' : '#333', background: isToday ? '#2563eb' : 'none', width: isPC ? '40px' : '22px', height: isPC ? '40px' : '22px', borderRadius: '50%', margin: '2px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{date.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => {
                const [hour, min] = time.split(':');
                return (
                  <tr key={time} style={{ height: '60px' }}>
                    <td style={{ borderRight: '1px solid #eee', borderBottom: '1px solid #f1f5f9', textAlign: 'center', lineHeight: '1.1' }}>
                      {isPC ? <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{time.endsWith(':00') ? time : ''}</span> : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{hour}</span>
                          <span style={{ fontSize: '0.55rem', color: '#999' }}>{min}</span>
                        </div>
                      )}
                    </td>
                    {weekDays.map(date => {
                      const dStr = getJapanDateStr(date);
                      const res = getStatusAt(dStr, time);
                      const isStart = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === time;

                      return (
                        <td key={`${dStr}-${time}`} 
                          onClick={() => { setSelectedDate(dStr); setTargetTime(time); if(res && (isStart || res.res_type === 'blocked')){ setSelectedRes(res); setShowDetailModal(true); } else setShowMenuModal(true); }}
                          style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', position: 'relative', cursor: 'pointer' }}
                        >
                          {res && (
                            <div style={{ 
                              position: 'absolute', inset: '1px', 
                              background: res.res_type === 'blocked' ? '#fee2e2' : (isStart ? '#BAE6FD' : (new Date(`${dStr}T${time}`) >= new Date(new Date(res.start_time).getTime() + res.total_slots * (shop.slot_interval_min || 15) * 60000) ? '#f8fafc' : '#F3F4F6')), 
                              color: res.res_type === 'blocked' ? '#ef4444' : (isStart ? '#451a03' : '#cbd5e1'), 
                              padding: '2px 4px', borderRadius: '2px', zIndex: 5, overflow: 'hidden', borderLeft: `2px solid ${res.res_type === 'blocked' ? '#ef4444' : (isStart ? '#0284c7' : '#d1d5db')}`,
                              display: 'flex', flexDirection: 'column', justifyContent: 'center'
                            }}>
                              {res.res_type === 'blocked' ? <div style={{fontWeight:'bold',textAlign:'center'}}>✕</div> : (
                                isStart ? (
                                  <>
                                    <div style={{ fontWeight: 'bold', fontSize: isPC ? '0.85rem' : '0.65rem', wordBreak: 'break-all' }}>{res.customer_name}</div>
                                    {isPC && <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{res.options?.services?.map(s => s.name).join(', ')}</div>}
                                  </>
                                ) : <div style={{ fontStyle: 'italic', fontSize: '0.4rem', textAlign: 'center' }}>・</div>
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

      {/* --- モーダル --- */}
      {showDetailModal && selectedRes && (
        <div onClick={() => setShowDetailModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>{selectedRes.res_type === 'blocked' ? '予約不可の解除' : `${selectedRes.customer_name} 様`}</h3>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
              <p style={{ fontWeight: 'bold', color: '#2563eb' }}>{selectedRes.res_type === 'blocked' ? 'この枠を再び予約可能にしますか？' : selectedRes.options?.services?.map(s => s.name).join(' / ')}</p>
              <p>📅 {new Date(selectedRes.start_time).toLocaleString('ja-JP')}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => deleteRes(selectedRes.id)} style={{ flex: 1, padding: '15px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{selectedRes.res_type === 'blocked' ? '解除（◎にする）' : '削除する'}</button>
              <button onClick={() => setShowDetailModal(false)} style={{ flex: 1, padding: '15px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {showMenuModal && (
        <div onClick={() => setShowMenuModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '35px', borderRadius: '30px', width: '90%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{selectedDate.replace(/-/g, '/')}</h3>
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
const modalContentStyle = { background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '25px', padding: '30px' };

export default AdminReservations;