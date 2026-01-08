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

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [startDate]);

  const timeSlots = useMemo(() => {
    if (!shop || !shop.business_hours) return [];
    let minOpen = "23:59"; let maxClose = "00:00";
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

  const getStatusAt = (dateStr, timeStr) => {
    const found = reservations.find(r => {
      const rDate = new Date(r.start_time).toLocaleDateString('sv-SE');
      const rTime = new Date(r.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return rDate === dateStr && rTime === timeStr;
    });
    return found;
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
      fetchData();
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>読み込み中...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333', background: '#fff' }}>
      
      {/* 🔴 1段目固定：前週・次週ボタン */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 1200, 
        background: '#fff', padding: '10px 15px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #eee'
      }}>
        <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d); }} style={{padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '0.8rem'}}>前週</button>
        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{startDate.getMonth() + 1}月の空き状況</div>
        <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d); }} style={{padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '0.8rem'}}>次週</button>
      </div>
      
      {/* 🔴 2段目固定：カレンダーのヘッダー（曜日・日付） */}
      <div style={{ position: 'sticky', top: '48px', zIndex: 1100, background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '18%', background: '#f8fafc', borderBottom: '2px solid #2563eb' }}></th>
              {weekDays.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                return (
                  <th key={date.toString()} onClick={() => setSelectedDate(dateStr)}
                    style={{ 
                      padding: '10px 0', background: isSelected ? '#2563eb' : '#f8fafc', color: isSelected ? '#fff' : '#333',
                      borderBottom: '2px solid #2563eb', fontSize: '0.7rem', cursor: 'pointer'
                    }}
                  >
                    {['日','月','火','水','木','金','土'][date.getDay()]}<br/>
                    <b style={{fontSize:'1rem'}}>{date.getDate()}</b>
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>

      {/* グリッドカレンダーの中身（ここからは流れる） */}
      <div style={{ margin: '0 5px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', border: '1px solid #e2e8f0', borderTop: 'none' }}>
          <tbody>
            {timeSlots.map(time => (
              <tr key={time}>
                <td style={{ width: '18%', textAlign: 'center', fontSize: '0.65rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', color: '#64748b' }}>{time}</td>
                {weekDays.map(date => {
                  const dateStr = date.toISOString().split('T')[0];
                  const res = getStatusAt(dateStr, time);
                  return (
                    <td key={dateStr} 
                      onClick={() => { setSelectedDate(dateStr); setTargetTime(time); setShowMenuModal(true); }}
                      style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', height: '40px', cursor: 'pointer', background: res ? '#fee2e2' : '#fff' }}
                    >
                      <span style={{ fontSize: '0.8rem', color: res ? '#ef4444' : '#2563eb' }}>{res ? '✕' : '◎'}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 予約詳細（ズラーっと表示） */}
      <div style={{ padding: '30px 15px' }}>
        <h4 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', borderLeft: '5px solid #2563eb', paddingLeft: '15px' }}>
          📅 {selectedDate.replace(/-/g, '/')} の予約詳細
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {timeSlots.map(time => {
            const res = getStatusAt(selectedDate, time);
            return (
              <div key={time} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '60px', fontSize: '1rem', fontWeight: 'bold', color: '#64748b' }}>{time}</div>
                <div style={{ flex: 1 }}>
                  {res ? (
                    <div style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: res.res_type === 'blocked' ? '#f8fafc' : '#eff6ff', 
                      padding: '15px', borderRadius: '16px', border: '1px solid', borderColor: res.res_type === 'blocked' ? '#e2e8f0' : '#dbeafe' 
                    }}>
                      <div style={{ flex: 1 }}>
                        {res.res_type === 'blocked' ? (
                          <div style={{ color: '#94a3b8', fontWeight: 'bold' }}>🚫 予約不可設定</div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '1.1rem' }}>{res.customer_name} 様</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{res.services?.services?.map(s => s.name).join(', ')}</div>
                          </div>
                        )}
                      </div>
                      <button onClick={() => deleteRes(res.id)} style={{ padding: '8px', border: 'none', background: 'none', color: '#ef4444', fontWeight: 'bold' }}>削除</button>
                    </div>
                  ) : (
                    <button onClick={() => { setSelectedDate(selectedDate); setTargetTime(time); setShowMenuModal(true); }}
                      style={{ width: '100%', padding: '18px', background: 'transparent', border: '1px dashed #cbd5e1', borderRadius: '16px', color: '#94a3b8', fontSize: '1rem', textAlign: 'left' }}
                    >＋ 枠の操作（予約・ブロック）</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ポップアップ */}
      {showMenuModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>{selectedDate}</h3>
            <p style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '1.4rem' }}>{targetTime}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '25px' }}>
              <button onClick={() => navigate(`/shop/${shopId}/reserve`, { state: { adminDate: selectedDate, adminTime: targetTime } })} style={{ padding: '20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem' }}>📝 予約を入れる</button>
              <button onClick={handleBlockTime} style={{ padding: '20px', background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem' }}>✕ 予約不可にする</button>
              <button onClick={() => setShowMenuModal(false)} style={{ padding: '10px', background: 'none', border: 'none', color: '#666' }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReservations;