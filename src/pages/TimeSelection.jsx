import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function TimeSelection() {
  const { shopId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { totalSlotsNeeded } = location.state || { totalSlotsNeeded: 0 };

  const [shop, setShop] = useState(null);
  const [existingReservations, setExistingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [selectedDateTime, setSelectedDateTime] = useState({ date: null, time: null });

  useEffect(() => { fetchInitialData(); }, [shopId]);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (profile) setShop(profile);
    const { data: resData } = await supabase.from('reservations').select('start_time, end_time').eq('shop_id', shopId);
    setExistingReservations(resData || []);
    setLoading(false);
  };

  const checkIsRegularHoliday = (date) => {
    if (!shop?.business_hours?.regular_holidays) return false;
    const holidays = shop.business_hours.regular_holidays;
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[date.getDay()];
    const dom = date.getDate();
    const nthWeek = Math.ceil(dom / 7);
    const tempDate = new Date(date);
    const currentMonth = tempDate.getMonth();
    const checkLast = new Date(date);
    checkLast.setDate(dom + 7);
    const isLastWeek = checkLast.getMonth() !== currentMonth;
    const checkSecondLast = new Date(date);
    checkSecondLast.setDate(dom + 14);
    const isSecondToLastWeek = (checkSecondLast.getMonth() !== currentMonth) && !isLastWeek;
    if (holidays[`${nthWeek}-${dayName}`]) return true;
    if (isLastWeek && holidays[`L1-${dayName}`]) return true;
    if (isSecondToLastWeek && holidays[`L2-${dayName}`]) return true;
    return false;
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
    if (!shop?.business_hours) return [];
    let minOpen = "23:59", maxClose = "00:00";
    Object.values(shop.business_hours).forEach(h => {
      if (typeof h === 'object' && h.is_closed) return;
      if (typeof h === 'object' && h.open < minOpen) minOpen = h.open;
      if (typeof h === 'object' && h.close > maxClose) maxClose = h.close;
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

  const checkAvailability = (date, timeStr) => {
    if (!shop?.business_hours) return { status: 'none' };
    if (checkIsRegularHoliday(date)) return { status: 'closed', label: '休' };

    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
    const hours = shop.business_hours[dayOfWeek];
    const dateStr = date.toLocaleDateString('sv-SE'); 
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE');

    if (!hours || hours.is_closed) return { status: 'closed', label: '休' };
    if (timeStr < hours.open || timeStr >= hours.close) return { status: 'none', label: '' };
    if (hours.rest_start && hours.rest_end && timeStr >= hours.rest_start && timeStr < hours.rest_end) return { status: 'rest', label: '休' };

    const targetDateTime = new Date(`${dateStr}T${timeStr}:00`);
    const buffer = shop.buffer_preparation_min || 0;

    const limitDays = Math.floor((shop.min_lead_time_hours || 0) / 24);
    const limitDate = new Date(now);
    limitDate.setHours(0,0,0,0);
    limitDate.setDate(limitDate.getDate() + limitDays);

    if (dateStr === todayStr && targetDateTime < now) return { status: 'past', label: '－' };
    if (new Date(dateStr) < limitDate) return { status: 'past', label: '－' };

    const interval = shop.slot_interval_min || 15;
    const totalMinRequired = (totalSlotsNeeded * interval);
    const potentialEndTime = new Date(targetDateTime.getTime() + totalMinRequired * 60 * 1000);

    const [closeH, closeM] = hours.close.split(':').map(Number);
    const closeDateTime = new Date(`${dateStr}T${String(closeH).padStart(2,'0')}:${String(closeM).padStart(2,'0')}:00`);
    if (potentialEndTime > closeDateTime) return { status: 'short', label: '△' };

    const isBooked = existingReservations.some(res => {
      const resStart = new Date(res.start_time).getTime();
      const resEnd = new Date(res.end_time).getTime();
      const bufferEnd = resEnd + (buffer * 60 * 1000);
      return (targetDateTime.getTime() < bufferEnd && potentialEndTime.getTime() > resStart);
    });

    if (isBooked) return { status: 'booked', label: '×' };

    // 🆕 修正版：優先順位付き・前後ピンポイント隙間ブロック
    if (shop.auto_fill_logic) {
      const dayRes = existingReservations.filter(r => r.start_time.startsWith(dateStr));
      if (dayRes.length > 0) {
        const specialSlots = [];
        const gapBlockCandidates = [];

        dayRes.forEach(r => {
          // 【特等席】予約直後の枠（後ろ1マス目）を特定
          const resEnd = new Date(r.end_time).getTime();
          const earliestPossible = resEnd + (buffer * 60 * 1000);
          const perfectPostSlot = timeSlots.find(s => {
            const [sh, sm] = s.split(':').map(Number);
            const slotDate = new Date(dateStr); slotDate.setHours(sh, sm, 0, 0);
            return slotDate.getTime() >= earliestPossible;
          });
          
          if (perfectPostSlot) {
            specialSlots.push(perfectPostSlot); // 優先的に空ける枠
            // 【後ろ側ブロック】特等席のさらに１つ後ろ（２マス目）を候補に
            const idx = timeSlots.indexOf(perfectPostSlot);
            if (idx + 1 < timeSlots.length) gapBlockCandidates.push(timeSlots[idx + 1]);
          }
          
          // 【前側ブロック】開始時間の３マス前を候補に
          const resStartStr = new Date(r.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
          const startIdx = timeSlots.indexOf(resStartStr);
          if (startIdx >= 3) gapBlockCandidates.push(timeSlots[startIdx - 3]);
        });

        // 判定：候補の中でも、他の予約の「特等席」になっている枠はブロックしない
        if (gapBlockCandidates.includes(timeStr) && !specialSlots.includes(timeStr)) {
          return { status: 'gap', label: '✕' }; 
        }
      }
    }

    return { status: 'available', label: '◎' };
  };

  if (loading) return <div style={{textAlign:'center', padding:'100px'}}>読み込み中...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333', paddingBottom: '120px' }}>
      <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', color: '#666', fontWeight: 'bold' }}>← 戻る</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>日時選択</div>
          <div style={{ fontSize: '0.7rem', color: '#2563eb' }}>所要時間: {totalSlotsNeeded * (shop?.slot_interval_min || 15)}分</div>
        </div>
        <div style={{ width: '40px' }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
        <button style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff' }} onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d); }}>前週</button>
        <div style={{ fontWeight: 'bold' }}>{startDate.getMonth() + 1}月</div>
        <button style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff' }} onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d); }}>次週</button>
      </div>

      <div style={{ overflow: 'auto', maxHeight: '65vh', border: '1px solid #e2e8f0', margin: '0 5px', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '14%', background: '#f8fafc', borderRight: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, left: 0, zIndex: 50 }}></th>
              {weekDays.map(date => {
                const isSun = date.getDay() === 0;
                const isSat = date.getDay() === 6;
                return (
                  <th key={date.toString()} style={{ width: '12.28%', padding: '8px 0', background: isSun ? '#fff1f2' : isSat ? '#eff6ff' : '#f8fafc', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40 }}>
                    <div style={{ fontSize: '0.55rem', color: isSun ? '#ef4444' : isSat ? '#2563eb' : '#64748b' }}>{['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{date.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(time => (
              <tr key={time}>
                <td style={{ padding: '8px 0', textAlign: 'center', fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b', background: '#f8fafc', borderRight: '2px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', position: 'sticky', left: 0, zIndex: 30 }}>{time}</td>
                {weekDays.map(date => {
                  const res = checkAvailability(date, time);
                  const dateStr = date.toLocaleDateString('sv-SE');
                  const isSelected = selectedDateTime.date === dateStr && selectedDateTime.time === time;
                  return (
                    <td key={date.toString()} onClick={() => res.status === 'available' && setSelectedDateTime({ date: dateStr, time })} style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', cursor: res.status === 'available' ? 'pointer' : 'default', background: isSelected ? '#2563eb' : (['none', 'closed', 'rest', 'past', 'booked', 'gap'].includes(res.status) ? '#f1f5f9' : '#fff'), color: isSelected ? '#fff' : (res.status === 'available' ? '#2563eb' : '#cbd5e1'), height: '42px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{res.label || (res.status === 'available' ? '◎' : '')}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDateTime.time && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', zIndex: 1000, boxShadow: '0 -4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.9rem' }}>選択：<b>{selectedDateTime.date.replace(/-/g, '/')} {selectedDateTime.time}</b></div>
          <button style={{ width: '100%', maxWidth: '400px', padding: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }} onClick={() => navigate(`/shop/${shopId}/confirm`, { state: { ...location.state, ...selectedDateTime } })}>予約内容の確認へ進む</button>
        </div>
      )}
    </div>
  );
}

export default TimeSelection;