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
    return d.toLocaleDateString('sv-SE'); 
  }); 
  
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [targetTime, setTargetTime] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date()); 

  // 🆕 顧客管理用State
  const [customers, setCustomers] = useState([]); 
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editCustomerMemo, setEditCustomerMemo] = useState('');
  const [customerFullHistory, setCustomerFullHistory] = useState([]);

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

  // 🆕 顧客サジェストロジック
  useEffect(() => {
    const searchCustomers = async () => {
      if (!searchTerm || searchTerm.length < 1) { setCustomers([]); return; }
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .ilike('name', `%${searchTerm}%`)
        .limit(5);
      setCustomers(data || []);
    };
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, shopId]);

  // 🆕 顧客詳細を開くロジック
  const openCustomerDetail = async (customer) => {
    setSelectedCustomer(customer);
    setEditCustomerMemo(customer.memo || '');
    setSearchTerm(''); // 検索窓を閉じる
    
    // 全期間の予約履歴を取得
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('shop_id', shopId)
      .eq('customer_name', customer.name) // 名前連動
      .order('start_time', { ascending: false });
    
    setCustomerFullHistory(data || []);
    setShowCustomerModal(true);
  };

  // 🆕 顧客メモの保存
  const saveCustomerMemo = async () => {
    if (!selectedCustomer) return;
    const { error } = await supabase
      .from('customers')
      .update({ memo: editCustomerMemo })
      .eq('id', selectedCustomer.id);
    
    if (!error) {
      alert('メモを保存しました');
      setShowCustomerModal(false);
    }
  };

  // 🛡️ 死守：カレンダー表示ロジック
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

  // 🛡️ 死守：スロット生成ロジック
  const timeSlots = useMemo(() => {
    if (!shop?.business_hours) return [];
    let minTotalMinutes = 24 * 60;
    let maxTotalMinutes = 0;
    let hasOpenDay = false;
    Object.values(shop.business_hours).forEach(h => {
      if (!h.is_closed && h.open && h.close) {
        hasOpenDay = true;
        const [openH, openM] = h.open.split(':').map(Number);
        const [closeH, closeM] = h.close.split(':').map(Number);
        const openTotal = openH * 60 + openM;
        const closeTotal = closeH * 60 + closeM;
        if (openTotal < minTotalMinutes) minTotalMinutes = openTotal;
        if (closeTotal > maxTotalMinutes) maxTotalMinutes = closeTotal;
      }
    });
    if (!hasOpenDay) { minTotalMinutes = 9 * 60; maxTotalMinutes = 18 * 60; }
    const slots = [];
    const interval = shop.slot_interval_min || 30;
    for (let m = minTotalMinutes; m <= maxTotalMinutes; m += interval) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
    }
    return slots;
  }, [shop]);

  const getJapanDateStr = (date) => date.toLocaleDateString('sv-SE');

  // 🛡️ 死守：予約重なり判定ロジック
  const getStatusAt = (dateStr, timeStr) => {
    const currentSlotStart = new Date(`${dateStr}T${timeStr}:00`).getTime();
    const matches = reservations.filter(r => {
      const start = new Date(r.start_time).getTime();
      const end = new Date(r.end_time).getTime();
      return currentSlotStart >= start && currentSlotStart < end;
    });
    if (matches.length === 0) return null;
    const exact = matches.find(r => new Date(r.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === timeStr);
    if (exact) return exact;
    return matches.find(r => r.res_type === 'blocked') || matches[0];
  };

  const openDetail = (res) => {
    setSelectedRes(res);
    const history = reservations
      .filter(r => 
        r.res_type === 'normal' && r.id !== res.id &&
        ((r.customer_email === res.customer_email && res.customer_email !== 'admin@example.com') || 
         (r.customer_phone === res.customer_phone && res.customer_phone !== '---')) &&
        new Date(r.start_time) < new Date(res.start_time)
      )
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 5);
    setCustomerHistory(history);
    setShowDetailModal(true);
  };

  const deleteRes = async (id) => {
    if (window.confirm('このデータを消去して予約を「可能」に戻しますか？')) {
      await supabase.from('reservations').delete().eq('id', id);
      setShowDetailModal(false); fetchData();
    }
  };

  const handleBlockTime = async () => {
    const startTimeStr = `${selectedDate}T${targetTime}:00`;
    const startTime = new Date(startTimeStr);
    const endTime = new Date(startTime.getTime() + (shop.slot_interval_min || 30) * 60000);
    const insertData = { 
      shop_id: shopId, customer_name: '管理者によるブロック', res_type: 'blocked', 
      start_at: startTime.toISOString(), end_at: endTime.toISOString(),
      start_time: startTime.toISOString(), end_time: endTime.toISOString(),
      total_slots: 1, customer_email: 'admin@example.com', customer_phone: '---', options: { services: [] }
    };
    const { error } = await supabase.from('reservations').insert([insertData]);
    if (error) alert(`エラー: ${error.message}`);
    else { setShowMenuModal(false); fetchData(); }
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

  const goPrev = () => setStartDate(new Date(startDate.setDate(startDate.getDate() - 7)));
  const goNext = () => setStartDate(new Date(startDate.setDate(startDate.getDate() + 7)));
  const goToday = () => setStartDate(new Date());

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>読み込み中...</div>;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#fff', overflow: 'hidden', position: 'fixed', inset: 0 }}>
      
      {/* 💻 PC用サイドバー（検索結果リストを削除して整理） */}
      {isPC && (
        <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #e2e8f0', padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px', background: '#fff', zIndex: 100 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.8rem' }}>
              {['月','火','水','木','金','土','日'].map(d => <div key={d} style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold' }}>{d}</div>)}
              {miniCalendarDays.map((date, i) => {
                if (!date) return <div key={i} />;
                const dStr = getJapanDateStr(date);
                return <div key={i} onClick={() => { setStartDate(date); setSelectedDate(dStr); }} style={{ padding: '8px 0', cursor: 'pointer', borderRadius: '50%', background: dStr === selectedDate ? '#2563eb' : 'none', color: dStr === selectedDate ? '#fff' : '#475569' }}>{date.getDate()}</div>;
              })}
            </div>
          </div>

          <button onClick={() => navigate(`/admin/${shopId}`)} style={{ marginTop: 'auto', padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>店舗設定へ</button>
        </div>
      )}

      {/* 📱💻 メイングリッドエリア */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: isPC ? 0 : '80px' }}>
        <div style={{ padding: isPC ? '15px 25px' : '15px 10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          {isPC ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={goToday} style={headerBtnStylePC}>今日</button>
                <button onClick={goPrev} style={headerBtnStylePC}>前週</button>
                <button onClick={goNext} style={headerBtnStylePC}>次週</button>
              </div>

              {/* 🆕 統合されたヘッダー顧客検索窓 */}
              <div style={{ position: 'relative', marginLeft: '10px', width: '300px' }}>
                <input 
                  type="text" 
                  placeholder="👤 顧客を検索..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem' }} 
                />
                <span style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }}>🔍</span>
                
                {/* 🆕 サジェスト結果 */}
                {customers.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '12px', marginTop: '5px', zIndex: 1000, border: '1px solid #eee', overflow: 'hidden' }}>
                    {customers.map(c => (
                      <div key={c.id} onClick={() => openCustomerDetail(c)} style={{ padding: '12px 15px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.background = '#f1f5f9'} onMouseLeave={(e) => e.target.style.background = '#fff'}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{c.name} 様</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.phone || '電話未登録'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 0 auto', fontWeight: '900', color: '#1e293b' }}>{startDate.getFullYear()}年 {startDate.getMonth() + 1}月</h2>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '15px' }}>
              <button onClick={goPrev} style={mobileArrowBtnStyle}>◀</button>
              <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: '900', color: '#1e293b' }}>{startDate.getFullYear()}年 {startDate.getMonth() + 1}月</h2>
              <button onClick={goNext} style={mobileArrowBtnStyle}>▶</button>
            </div>
          )}
          {!isPC && <button onClick={() => navigate(`/admin/${shopId}`)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', opacity: 0.3 }}>⚙️</button>}
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
                      {isPC ? <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>{time}</span> : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {min === '00' ? <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#444' }}>{parseInt(hour)}</span> : <span style={{ fontSize: '0.65rem', color: '#999' }}>{min}</span>}
                        </div>
                      )}
                    </td>
                    {weekDays.map(date => {
                      const dStr = getJapanDateStr(date);
                      const res = getStatusAt(dStr, time);
                      const isStart = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) === time;
                      return (
                        <td key={`${dStr}-${time}`} onClick={() => { setSelectedDate(dStr); setTargetTime(time); if(res && (isStart || res.res_type === 'blocked')){ openDetail(res); } else { setShowMenuModal(true); } }} style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', position: 'relative', cursor: 'pointer' }}>
                          {res && (
                            <div style={{ position: 'absolute', inset: '1px', background: res.res_type === 'blocked' ? '#fee2e2' : (isStart ? '#BAE6FD' : '#F3F4F6'), color: res.res_type === 'blocked' ? '#ef4444' : (isStart ? '#451a03' : '#cbd5e1'), padding: isPC ? '6px 8px' : '2px 4px', borderRadius: '2px', zIndex: 5, overflow: 'hidden', borderLeft: `2px solid ${res.res_type === 'blocked' ? '#ef4444' : (isStart ? '#0284c7' : '#d1d5db')}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              {res.res_type === 'blocked' ? <div style={{fontWeight:'bold',textAlign:'center'}}>✕</div> : (isStart ? <><div style={{ fontWeight: 'bold', fontSize: isPC ? '0.85rem' : '0.65rem', wordBreak: 'break-all' }}>{res.customer_name} 様</div>{isPC && <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{res.options?.services?.map(s => s.name).join(', ')}</div>}</> : <div style={{ fontStyle: 'italic', fontSize: '0.4rem', textAlign: 'center' }}>・</div>)}
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

      {/* --- モーダル（共通） --- */}
      
      {/* 🆕 顧客詳細モーダル（案1の核心） */}
      {showCustomerModal && selectedCustomer && (
        <div onClick={() => setShowCustomerModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalContentStyle, maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedCustomer.name} 様</h2>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>
                  📞 {selectedCustomer.phone || '電話未登録'} / ✉️ {selectedCustomer.email || 'メール未登録'}
                </div>
              </div>
              <button onClick={() => setShowCustomerModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isPC ? '1fr 1fr' : '1fr', gap: '20px' }}>
              {/* 左：顧客メモ */}
              <div>
                <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>📋 顧客メモ・注意事項</h4>
                <textarea 
                  value={editCustomerMemo} 
                  onChange={(e) => setEditCustomerMemo(e.target.value)}
                  style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', marginBottom: '10px' }}
                  placeholder="アレルギー、好み、過去の話題など..."
                />
                <button onClick={saveCustomerMemo} style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>メモを保存</button>
              </div>

              {/* 右：全履歴 */}
              <div>
                <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>🕒 全期間の予約履歴 ({customerFullHistory.length}回)</h4>
                <div style={{ height: '210px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                  {customerFullHistory.map(h => (
                    <div key={h.id} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{new Date(h.start_time).toLocaleDateString('ja-JP')}</div>
                      <div style={{ color: '#2563eb', marginTop: '2px' }}>{h.options?.services?.map(s => s.name).join(', ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ 死守：予約詳細ポップアップ */}
      {showDetailModal && selectedRes && (
        <div onClick={() => setShowDetailModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalContentStyle, maxWidth: '450px' }}>
            <h3 style={{ marginTop: 0 }}>{selectedRes.res_type === 'blocked' ? '予約不可の解除' : `${selectedRes.customer_name} 様`}</h3>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              {selectedRes.res_type === 'blocked' ? <p style={{ fontWeight: 'bold', color: '#ef4444', margin: 0 }}>🚫 この枠を予約可能に戻しますか？</p> : (
                <>
                  <div style={{ color: '#0369a1', fontWeight: '900', fontSize: '1.1rem', marginBottom: '10px' }}>✂️ {selectedRes.options?.services?.map(s => s.name).join(' / ')}</div>
                  <div style={{ fontSize: '0.9rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span>📅 <b>日時:</b> {new Date(selectedRes.start_time).toLocaleString('ja-JP', {month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                    <span>📞 <b>電話:</b> {selectedRes.customer_phone === '---' ? '未登録' : selectedRes.customer_phone}</span>
                    <span>✉️ <b>メール:</b> {selectedRes.customer_email === 'admin@example.com' ? '未登録' : selectedRes.customer_email}</span>
                  </div>
                </>
              )}
            </div>
            {selectedRes.res_type === 'normal' && (
              <div style={{ marginBottom: '25px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '10px' }}>🕒 最近の履歴</p>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                  {customerHistory.length > 0 ? customerHistory.map(h => (
                    <div key={h.id} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#475569' }}>{new Date(h.start_time).toLocaleDateString('ja-JP')}</div>
                      <div style={{ color: '#64748b', marginTop: '4px' }}>{h.options?.services?.map(s => s.name).join(', ')}</div>
                    </div>
                  )) : <div style={{ padding: '20px', textAlign: 'center', color: '#cbd5e1' }}>履歴はありません</div>}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => deleteRes(selectedRes.id)} style={{ flex: 1, padding: '15px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>消去</button>
              <button onClick={() => setShowDetailModal(false)} style={{ flex: 1, padding: '15px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ 死守：ねじ込み予約モーダル */}
      {showMenuModal && (
        <div onClick={() => setShowMenuModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '35px', borderRadius: '30px', width: '90%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b' }}>{selectedDate.replace(/-/g, '/')}</h3>
            <p style={{ fontWeight: '900', color: '#2563eb', fontSize: '2.2rem', margin: '0 0 30px 0' }}>{targetTime}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => navigate(`/shop/${shopId}/reserve`, { state: { adminDate: selectedDate, adminTime: targetTime } })} style={{ padding: '22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.2rem' }}>📝 予約を入れる</button>
              <button onClick={handleBlockTime} style={{ padding: '20px', background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem' }}>✕ 予約不可にする</button>
              <button onClick={() => setShowMenuModal(false)} style={{ padding: '15px', border: 'none', background: 'none', color: '#94a3b8' }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const headerBtnStylePC = { padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' };
const mobileArrowBtnStyle = { background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1rem', color: '#1e293b', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const floatingBtnStyle = { background: 'none', border: 'none', fontSize: '1.4rem', fontWeight: 'bold', color: '#475569', cursor: 'pointer', padding: '10px' };
const miniBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', color: '#2563eb', padding: '0 5px' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', backdropFilter: 'blur(8px)' };
const modalContentStyle = { background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '25px', padding: '30px' };

export default AdminReservations;