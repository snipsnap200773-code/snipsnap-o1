import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminReservations() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 💡 修正：時差問題を回避するため、ISO形式を使わずに初期値を設定
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

  // 💡 修正：時差の影響を受けない日付文字列の生成関数を追加
  const getJapanDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getStatusAt = (dateStr, timeStr) => {
    const currentSlotStart = new Date(`${dateStr}T${timeStr}:00`).getTime();
    
    const found = reservations.find(r => {
      const start = new Date(r.start_time).getTime();
      const end = new Date(r.end_time).getTime();
      return currentSlotStart >= start && currentSlotStart < end;
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
      setShowDetailModal(false);
      fetchData();
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>読み込み中...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333', background: '#fff' }}>
      
      <div style={{ position: 'sticky', top: 0, zIndex: 1200, background: '#fff', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d); }} style={{padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '0.8rem'}}>前週</button>
        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{startDate.getMonth() + 1}月の空き状況</div>
        <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d); }} style={{padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '0.8rem'}}>次週</button>
      </div>
      
      <div style={{ position: 'sticky', top: '48px', zIndex: 1100, background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '18%', background: '#f8fafc', borderBottom: '2px solid #2563eb' }}></th>
              {weekDays.map(date => {
                const dateStr = getJapanDateStr(date); // 💡 修正：ISOStringを使わずに日付文字列を取得
                const isSelected = selectedDate === dateStr;
                return (
                  <th key={date.toString()} onClick={() => setSelectedDate(dateStr)}
                    style={{ padding: '10px 0', background: isSelected ? '#2563eb' : '#f8fafc', color: isSelected ? '#fff' : '#333', borderBottom: '2px solid #2563eb', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    {['日','月','火','水','木','金','土'][date.getDay()]}<br/><b style={{fontSize:'1rem'}}>{date.getDate()}</b>
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>

      <div style={{ margin: '0 5px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', border: '1px solid #e2e8f0', borderTop: 'none' }}>
          <tbody>
            {timeSlots.map(time => (
              <tr key={time}>
                <td style={{ width: '18%', textAlign: 'center', fontSize: '0.65rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', color: '#64748b' }}>{time}</td>
                {weekDays.map(date => {
                  const dateStr = getJapanDateStr(date); // 💡 修正
                  const res = getStatusAt(dateStr, time);
                  return (
                    <td key={dateStr} onClick={() => { setSelectedDate(dateStr); setTargetTime(time); setShowMenuModal(true); }}
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

      <div style={{ padding: '30px 15px' }}>
        <h4 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', borderLeft: '5px solid #2563eb', paddingLeft: '15px' }}>📅 {selectedDate.replace(/-/g, '/')} の予約詳細</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {timeSlots.map(time => {
            const res = getStatusAt(selectedDate, time);
            
            // 💡 修正：時差に強い判定方法に変更
            const isStartTime = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === time;
            
            const intervalWidth = shop.slot_interval_min || 15;
            const treatmentEndTime = res ? new Date(new Date(res.start_time).getTime() + res.total_slots * intervalWidth * 60000) : null;
            const isBufferTime = res && !isStartTime && new Date(`${selectedDate}T${time}`) >= treatmentEndTime;

            return (
              <div key={time} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '60px', fontSize: '1rem', fontWeight: 'bold', color: '#64748b' }}>{time}</div>
                <div style={{ flex: 1 }}>
                  {res ? (
                    <div style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: res.res_type === 'blocked' ? '#f8fafc' : (isStartTime ? '#eff6ff' : (isBufferTime ? '#f1f5f9' : '#fcfcfc')), 
                      padding: '15px', borderRadius: '16px', border: '1px solid', borderColor: res.res_type === 'blocked' ? '#e2e8f0' : (isStartTime ? '#dbeafe' : '#f1f5f9'),
                      opacity: isStartTime ? 1 : (isBufferTime ? 0.6 : 0.8)
                    }}>
                      <div style={{ flex: 1 }}>
                        {res.res_type === 'blocked' ? (
                          <div style={{ color: '#94a3b8', fontWeight: 'bold' }}>🚫 予約不可設定</div>
                        ) : (
                          <div>
                            <div onClick={() => isStartTime && openDetail(res)}
                              style={{ fontWeight: 'bold', color: isStartTime ? '#1e40af' : (isBufferTime ? '#64748b' : '#94a3b8'), fontSize: '1.1rem', cursor: isStartTime ? 'pointer' : 'default' }}
                            >
                              {isStartTime ? `${res.customer_name} 様` : (isBufferTime ? "　🧹 (次客への準備・清掃中)" : "　┗ (予約継続中)")}
                            </div>
                            {isStartTime && (
                              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                {res.options?.services?.map(s => s.name).join(', ') || 'メニューなし'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {isStartTime && <button onClick={() => deleteRes(res.id)} style={{ padding: '8px', border: 'none', background: 'none', color: '#ef4444', fontWeight: 'bold' }}>削除</button>}
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

      {showDetailModal && selectedRes && (
        <div onClick={() => setShowDetailModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '28px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <button onClick={() => setShowDetailModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', zIndex: 1 }}>×</button>
            
            <div style={{ padding: '30px', overflowY: 'auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '5px' }}>Customer Detail</div>
                <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#1e293b' }}>{selectedRes.customer_name} 様</h3>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                    📞 {selectedRes.customer_phone === '---' ? '電話未登録' : (selectedRes.customer_phone || '電話なし')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    ✉️ {selectedRes.customer_email === 'admin@example.com' ? 'メール未登録' : (selectedRes.customer_email || 'メールなし')}
                  </span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '25px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '10px' }}>今回のご予約</div>
                <div style={{ color: '#1e293b', fontWeight: 'bold', fontSize: '1rem' }}>📅 {new Date(selectedRes.start_time).toLocaleDateString('ja-JP')} {new Date(selectedRes.start_time).toLocaleTimeString('ja-JP', {hour:'2-digit', minute:'2-digit'})}</div>
                <div style={{ marginTop: '8px', color: '#2563eb', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  ✂️ {selectedRes.options?.services?.map(s => s.name).join(' / ') || 'メニュー未登録'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🕒 過去5回分の履歴（新しい順）
                </div>
                {customerHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {customerHistory.map(h => (
                      <div key={h.id} style={{ padding: '12px 15px', borderLeft: '3px solid #e2e8f0', background: '#fff', borderRadius: '0 12px 12px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>{new Date(h.start_time).toLocaleDateString('ja-JP')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '3px' }}>
                          {h.options?.services?.map(s => s.name).join(', ') || 'メニュー記録なし'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#cbd5e1', fontSize: '0.8rem', border: '1px dashed #e2e8f0', borderRadius: '15px' }}>過去の履歴はありません</div>
                )}
              </div>

              <button onClick={() => setShowDetailModal(false)} style={{ width: '100%', marginTop: '30px', padding: '15px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {showMenuModal && (
        <div onClick={() => setShowMenuModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>{selectedDate}</h3>
            <p style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '1.4rem' }}>{targetTime}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '25px' }}>
              <button 
                onClick={() => navigate(`/shop/${shopId}/reserve`, { 
                  state: { 
                    adminDate: selectedDate, 
                    adminTime: targetTime 
                  } 
                })} 
                style={{ padding: '20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem' }}
              >
                📝 予約を入れる
              </button>
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