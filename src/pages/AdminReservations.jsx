import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminReservations() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // --- 状態管理 ---
  const [shop, setShop] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allServices, setAllServices] = useState([]); // 🆕 マスターメニュー保持用

  const [startDate, setStartDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const d = new Date(dateParam);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  }); 

  const [selectedDate, setSelectedDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    return dateParam || new Date().toLocaleDateString('sv-SE');
  }); 
  
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [targetTime, setTargetTime] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date(startDate)); 

  const [customers, setCustomers] = useState([]); 
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerFullHistory, setCustomerFullHistory] = useState([]);
  const [editFields, setEditFields] = useState({ name: '', phone: '', email: '', memo: '', line_user_id: null });

  // 🆕 予約メニュー編集用の一時状態
  const [editingMenuIds, setEditingMenuIds] = useState([]);

  // キーボード選択用のIndex管理
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPC = windowWidth > 1024;

  useEffect(() => { fetchData(); }, [shopId, startDate]);

  // ✅ ツイン・カレンダー対応版 fetchData (1ミリも省略なし)
  const fetchData = async () => {
    setLoading(true);
    // 1. 自分の店舗プロフィールを取得
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (!profile) { setLoading(false); return; }
    setShop(profile);

    // 2. スケジュール共有設定（schedule_sync_id）を確認
    let targetShopIds = [shopId];
    if (profile.schedule_sync_id) {
      const { data: siblingShops } = await supabase
        .from('profiles')
        .select('id')
        .eq('schedule_sync_id', profile.schedule_sync_id);
      if (siblingShops) {
        targetShopIds = siblingShops.map(s => s.id);
      }
    }

    // 3. 全関連店舗の予約データ ＆ マスターメニューを取得
    const [{ data: resData }, { data: servicesData }] = await Promise.all([
      supabase.from('reservations').select('*, profiles(business_name)').in('shop_id', targetShopIds),
      supabase.from('services').select('*').eq('shop_id', shopId).order('sort_order')
    ]);

    setReservations(resData || []);
    setAllServices(servicesData || []);
    setLoading(false);
  };

  useEffect(() => {
    const searchCustomers = async () => {
      if (!searchTerm) { setCustomers([]); setSelectedIndex(-1); return; }
      const { data } = await supabase.from('customers').select('*').eq('shop_id', shopId).ilike('name', `%${searchTerm}%`).limit(5);
      setCustomers(data || []);
      setSelectedIndex(-1); 
    };
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, shopId]);

  const openCustomerDetail = async (customer) => {
    setSelectedCustomer(customer);
    setEditFields({ 
      name: customer.name, 
      phone: customer.phone || '', 
      email: customer.email || '', 
      memo: customer.memo || '',
      line_user_id: customer.line_user_id || null 
    });
    setSearchTerm('');
    setSelectedIndex(-1);
    const { data } = await supabase.from('reservations').select('*').eq('shop_id', shopId).eq('customer_name', customer.name).order('start_time', { ascending: false });
    setCustomerFullHistory(data || []);
    setShowCustomerModal(true);
  };

  const handleKeyDown = (e) => {
    if (customers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < customers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault();
        openCustomerDetail(customers[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setSearchTerm('');
      setCustomers([]);
    }
  };

  const openDetail = async (res) => {
    if (res.shop_id !== shopId) {
      alert(`こちらは他店舗（${res.profiles?.business_name || '別ブランド'}）の予約枠です。詳細は各店舗の管理画面で確認してください。`);
      return;
    }

    setSelectedRes(res);

    // 🆕 メニュー選択状態の初期化
    const currentOpt = typeof res.options === 'string' ? JSON.parse(res.options) : res.options;
    const currentServices = currentOpt?.services || currentOpt?.people?.[0]?.services || [];
    setEditingMenuIds(currentServices.map(s => s.id));

    let cust = null;
    if (res.line_user_id) {
      const { data } = await supabase.from('customers').select('*').eq('shop_id', shopId).eq('line_user_id', res.line_user_id).maybeSingle();
      cust = data;
    }
    if (!cust && res.customer_name) {
      const { data } = await supabase.from('customers').select('*').eq('shop_id', shopId).eq('name', res.customer_name).maybeSingle();
      cust = data;
    }

    if (cust) {
      setSelectedCustomer(cust);
      setEditFields({ 
        name: cust.name, phone: cust.phone || '', email: cust.email || '', memo: cust.memo || '',
        line_user_id: cust.line_user_id || res.line_user_id || null
      });
    } else {
      setSelectedCustomer(null);
      setEditFields({ 
        name: res.customer_name, phone: res.customer_phone || '', email: res.customer_email || '', 
        memo: '', line_user_id: res.line_user_id || null
      });
    }
    const history = reservations.filter(r => r.shop_id === shopId && r.res_type === 'normal' && r.id !== res.id && (r.customer_name === res.customer_name) && new Date(r.start_time) < new Date(res.start_time)).sort((a, b) => new Date(b.start_time) - new Date(a.start_time)).slice(0, 5);
    setCustomerHistory(history);
    setShowDetailModal(true);
  };

  // ✅ 名寄せ統合 ＆ メニュー変更同期 強化版
  const handleUpdateCustomer = async () => {
    try {
      let targetCustomerId = selectedCustomer?.id;

      // 1. 名寄せ統合チェック (既存ロジックそのまま)
      const { data: duplicateNameCust } = await supabase
        .from('customers').select('*').eq('shop_id', shopId).eq('name', editFields.name)
        .neq('id', targetCustomerId || '00000000-0000-0000-0000-000000000000').maybeSingle();

      if (duplicateNameCust) {
        const confirmMerge = window.confirm(`「${editFields.name}」様は既に名簿に存在します。統合しますか？`);
        if (confirmMerge) {
          await supabase.from('customers').update({ 
            phone: editFields.phone || duplicateNameCust.phone,
            email: editFields.email || duplicateNameCust.email,
            memo: editFields.memo || duplicateNameCust.memo,
            line_user_id: editFields.line_user_id || duplicateNameCust.line_user_id,
            updated_at: new Date().toISOString()
          }).eq('id', duplicateNameCust.id);
          if (selectedCustomer) {
            await supabase.from('reservations').update({ customer_name: editFields.name }).eq('shop_id', shopId).eq('customer_name', selectedCustomer.name);
            await supabase.from('customers').delete().eq('id', selectedCustomer.id);
          }
          alert('データの統合が完了しました！');
          setShowCustomerModal(false); setShowDetailModal(false); fetchData(); return;
        }
      }

      // 2. 🆕 予約メニュー変更の反映 ＆ 衝突チェック
      let reservationUpdateData = {
        customer_name: editFields.name,
        customer_phone: editFields.phone,
        customer_email: editFields.email
      };

      if (selectedRes && showDetailModal && selectedRes.res_type === 'normal') {
        const selectedServices = allServices.filter(s => editingMenuIds.includes(s.id));
        if (selectedServices.length === 0) return alert("メニューを1つ以上選択してください");

        const totalSlots = selectedServices.reduce((sum, s) => sum + (s.slots || 1), 0);
        const startTime = new Date(selectedRes.start_time);
        const interval = shop.slot_interval_min || 15;
        const endTime = new Date(startTime.getTime() + totalSlots * interval * 60000);
        const menuName = selectedServices.map(s => s.name).join(', ');

        // 他の予約枠との重なりをチェック (衝突判定)
        const hasCollision = reservations.some(r => {
          if (r.id === selectedRes.id || r.shop_id !== shopId || r.res_type === 'system_blocked') return false;
          const rStart = new Date(r.start_time).getTime();
          const rEnd = new Date(r.end_time).getTime();
          return startTime.getTime() < rEnd && endTime.getTime() > rStart;
        });

        if (hasCollision) return alert("変更後の終了時間が、次の予約またはブロック枠と重なっています。時間を調整してください。");

        reservationUpdateData = {
          ...reservationUpdateData,
          total_slots: totalSlots,
          end_time: endTime.toISOString(),
          menu_name: menuName,
          options: { services: selectedServices }
        };
      }

      // 3. DB保存
      if (!targetCustomerId) {
        const { data: exCust } = await supabase.from('customers').select('id').eq('shop_id', shopId).eq('name', editFields.name).maybeSingle();
        if (exCust) targetCustomerId = exCust.id;
      }

      const payload = { shop_id: shopId, name: editFields.name, phone: editFields.phone, email: editFields.email, memo: editFields.memo, line_user_id: editFields.line_user_id, updated_at: new Date().toISOString() };
      if (targetCustomerId) payload.id = targetCustomerId;
      await supabase.from('customers').upsert(payload, { onConflict: 'id' });

      let resQuery = supabase.from('reservations').update(reservationUpdateData).eq('shop_id', shopId);
      if (editFields.line_user_id) resQuery = resQuery.eq('line_user_id', editFields.line_user_id);
      else if (selectedRes) resQuery = resQuery.eq('id', selectedRes.id);
      
      await resQuery;

      alert('名簿情報と予約メニューを更新しました！'); 
      setShowCustomerModal(false); setShowDetailModal(false); fetchData(); 
    } catch (err) { console.error(err); alert('予期せぬエラーが発生しました'); }
  };

  const deleteRes = async (id) => {
    const isBlock = selectedRes?.res_type === 'blocked';
    const msg = isBlock ? 'このブロックを解除して予約を「可能」に戻しますか？' : 'この予約データを消去して予約を「可能」に戻しますか？';
    if (window.confirm(msg)) {
      const { customer_name, res_type } = selectedRes;
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) { alert('削除に失敗しました: ' + error.message); return; }
      if (res_type === 'normal') {
        const { count } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('customer_name', customer_name);
        if (count === 0) await supabase.from('customers').delete().eq('shop_id', shopId).eq('name', customer_name);
        else {
          const { data: cust } = await supabase.from('customers').select('id, total_visits').eq('shop_id', shopId).eq('name', customer_name).maybeSingle();
          if (cust) await supabase.from('customers').update({ total_visits: Math.max(0, (cust.total_visits || 1) - 1) }).eq('id', cust.id);
        }
      }
      setShowDetailModal(false); fetchData();
    }
  };

  // --- ヘルパー関数群 (1ミリも省略なし) ---
  const checkIsRegularHoliday = (date) => {
    if (!shop?.business_hours?.regular_holidays) return false;
    const holidays = shop.business_hours.regular_holidays;
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[date.getDay()];
    const dom = date.getDate();
    const nthWeek = Math.ceil(dom / 7);
    const tempDate = new Date(date);
    const currentMonth = tempDate.getMonth();
    const checkLast = new Date(date); checkLast.setDate(dom + 7);
    const isLastWeek = checkLast.getMonth() !== currentMonth;
    const checkSecondLast = new Date(date); checkSecondLast.setDate(dom + 14);
    const isSecondToLastWeek = (checkSecondLast.getMonth() !== currentMonth) && !isLastWeek;
    if (holidays[`${nthWeek}-${dayName}`]) return true;
    if (isLastWeek && holidays[`L1-${dayName}`]) return true;
    if (isSecondToLastWeek && holidays[`L2-${dayName}`]) return true;
    return false;
  };

  const weekDays = useMemo(() => {
    const days = [];
    const base = new Date(startDate);
    const dayOfWeek = base.getDay(); 
    base.setDate(base.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); 
    for (let i = 0; i < 7; i++) {
      const d = new Date(base); d.setDate(d.getDate() + i); days.push(d);
    }
    return days;
  }, [startDate]);

  const timeSlots = useMemo(() => {
    if (!shop?.business_hours) return [];
    let minTotalMinutes = 24 * 60; let maxTotalMinutes = 0; let hasOpenDay = false;
    Object.values(shop.business_hours).forEach(h => {
      if (typeof h === 'object' && !h.is_closed && h.open && h.close) {
        hasOpenDay = true;
        const [openH, openM] = h.open.split(':').map(Number);
        const [closeH, closeM] = h.close.split(':').map(Number);
        if (openH * 60 + openM < minTotalMinutes) minTotalMinutes = openH * 60 + openM;
        if (closeH * 60 + closeM > maxTotalMinutes) maxTotalMinutes = closeH * 60 + closeM;
      }
    });
    if (!hasOpenDay) { minTotalMinutes = 9 * 60; maxTotalMinutes = 18 * 60; }
    const slots = [];
    const interval = shop.slot_interval_min || 15;
    for (let m = minTotalMinutes; m <= maxTotalMinutes; m += interval) {
      const h = Math.floor(m / 60); const mm = m % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
    }
    return slots;
  }, [shop]);

  const getJapanDateStr = (date) => date.toLocaleDateString('sv-SE');

  const getStatusAt = (dateStr, timeStr) => {
    const dateObj = new Date(dateStr);
    if (checkIsRegularHoliday(dateObj)) return { res_type: 'blocked', customer_name: '定休日', start_time: `${dateStr}T${timeStr}:00`, isRegularHoliday: true };
    const currentSlotStart = new Date(`${dateStr}T${timeStr}:00`).getTime();
    const matches = reservations.filter(r => {
      const start = new Date(r.start_time).getTime();
      const end = new Date(r.end_time).getTime();
      return currentSlotStart >= start && currentSlotStart < end;
    });
    if (matches.length > 0) {
      const exact = matches.find(r => new Date(r.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }) === timeStr);
      return exact || matches.find(r => r.res_type === 'blocked') || matches[0];
    }
    const buffer = shop?.buffer_preparation_min || 0;
    const dayRes = reservations.filter(r => r.start_time.startsWith(dateStr) && r.res_type === 'normal' && r.shop_id === shopId);
    const isInBuffer = dayRes.some(r => {
      const resEnd = new Date(r.end_time).getTime();
      return currentSlotStart >= resEnd && currentSlotStart < (resEnd + buffer * 60 * 1000);
    });
    if (isInBuffer) return { res_type: 'system_blocked', customer_name: 'ｲﾝﾀｰﾊﾞﾙ', isBuffer: true };
    if (shop?.auto_fill_logic && dayRes.length > 0) {
      const gapCandidates = [];
      dayRes.forEach(r => {
        const resEnd = new Date(r.end_time).getTime();
        const earliest = resEnd + (buffer * 60 * 1000);
        const nextPrime = timeSlots.find(s => {
          const [sh, sm] = s.split(':').map(Number);
          const sd = new Date(dateStr); sd.setHours(sh, sm, 0, 0);
          return sd.getTime() >= earliest;
        });
        if (nextPrime) {
          const pIdx = timeSlots.indexOf(nextPrime);
          if (pIdx + 1 < timeSlots.length) gapCandidates.push(timeSlots[pIdx + 1]);
        }
        const rStartStr = new Date(r.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
        const startIdx = timeSlots.indexOf(rStartStr);
        if (startIdx >= 3) gapCandidates.push(timeSlots[startIdx - 3]);
      });
      if (gapCandidates.includes(timeStr)) return { res_type: 'system_blocked', customer_name: '－', isGap: true };
    }
    return null;
  };

  const handleBlockTime = async () => {
    const start = new Date(`${selectedDate}T${targetTime}:00`);
    const interval = shop.slot_interval_min || 15;
    const end = new Date(start.getTime() + interval * 60000);
    const insertData = { shop_id: shopId, customer_name: '管理者ブロック', res_type: 'blocked', start_time: start.toISOString(), end_time: end.toISOString(), total_slots: 1, options: { services: [] } };
    await supabase.from('reservations').insert([insertData]);
    setShowMenuModal(false); fetchData();
  };

  const handleBlockFullDay = async () => {
    if (!window.confirm(`${selectedDate.replace(/-/g, '/')} を終日「予約不可」にしますか？`)) return;
    const interval = shop.slot_interval_min || 15;
    const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(selectedDate).getDay()];
    const hours = shop.business_hours?.[dayName];
    const openStr = hours?.open || "09:00"; const closeStr = hours?.close || "18:00";
    const start = new Date(`${selectedDate}T${openStr}:00`); const end = new Date(`${selectedDate}T${closeStr}:00`);
    const [oh, om] = openStr.split(':').map(Number); const [ch, cm] = closeStr.split(':').map(Number);
    const totalMinutes = (ch * 60 + cm) - (oh * 60 + om);
    const slotsCount = Math.ceil(totalMinutes / interval);
    const insertData = { shop_id: shopId, customer_name: '臨時休業', res_type: 'blocked', start_time: start.toISOString(), end_time: end.toISOString(), total_slots: slotsCount, options: { services: [], isFullDay: true } };
    await supabase.from('reservations').insert([insertData]);
    setShowMenuModal(false); fetchData();
  };

  const getFamilyName = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.split(/[\s\u3000]+/); 
    return parts[0];
  };

  const miniCalendarDays = useMemo(() => {
    const year = viewMonth.getFullYear(); const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewMonth]);

  const goPrev = () => setStartDate(new Date(new Date(startDate).setDate(new Date(startDate).getDate() - 7)));
  const goNext = () => setStartDate(new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 7)));
  const goPrevMonth = () => setStartDate(new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() - 1)));
  const goNextMonth = () => setStartDate(new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)));
  const goToday = () => { const today = new Date(); setStartDate(today); setSelectedDate(today.toLocaleDateString('sv-SE')); navigate(`/admin/${shopId}/reservations`, { replace: true }); };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>読み込み中...</div>;

  const themeColor = shop?.theme_color || '#2563eb';
  const themeColorLight = `${themeColor}15`; 

  // --- スタイル定義 (1ミリも省略なし) ---
  const miniBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', color: themeColor };
  const floatNavBtnStyle = { border: 'none', background: 'none', width: '60px', height: '50px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
  const modalContentStyle = { background: '#fff', width: '95%', borderRadius: '25px', padding: '30px', maxHeight: '85vh', overflowY: 'auto' };
  const headerBtnStylePC = { padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' };
  const mobileArrowBtnStyle = { background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1rem', cursor: 'pointer' };
  const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px', display: 'block' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px', fontSize: '1rem', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#fff', overflow: 'hidden', position: 'fixed', inset: 0 }}>
      {isPC && (
        <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #e2e8f0', padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px', background: '#fff', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '35px', height: '35px', background: themeColor, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>S</div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>SnipSnap Admin</h1>
            </div>
            <button onClick={() => navigate(`/admin/${shopId}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px', display: 'flex', alignItems: 'center', color: '#64748b' }}>⚙️</button>
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
              {miniCalendarDays.map((date, i) => date ? <div key={i} onClick={() => { setStartDate(date); setSelectedDate(getJapanDateStr(date)); }} style={{ padding: '8px 0', cursor: 'pointer', borderRadius: '50%', background: getJapanDateStr(date) === selectedDate ? themeColor : 'none', color: getJapanDateStr(date) === selectedDate ? '#fff' : '#475569' }}>{date.getDate()}</div> : <div key={i} />)}
            </div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => isManagementEnabled && navigate(`/admin/${shopId}/management`)} style={{ padding: '15px', background: isManagementEnabled ? themeColor : '#e2e8f0', color: isManagementEnabled ? '#fff' : '#94a3b8', border: 'none', borderRadius: '12px', cursor: isManagementEnabled ? 'pointer' : 'not-allowed', fontWeight: 'bold' }} disabled={!isManagementEnabled}>📊 顧客・売上管理へ</button>
            <button onClick={() => navigate(`/admin/${shopId}`)} style={{ padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>店舗設定へ</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <div style={{ padding: isPC ? '15px 25px' : '15px 10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          {isPC ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={goToday} style={headerBtnStylePC}>今日</button>
                <button onClick={goPrev} style={headerBtnStylePC}>前週</button>
                <button onClick={goNext} style={headerBtnStylePC}>次週</button>
              </div>
              <div style={{ position: 'relative', marginLeft: '10px', width: '300px' }}>
                <input type="text" placeholder="👤 顧客を検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleKeyDown} style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem' }} />
                <span style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }}>🔍</span>
                {customers.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '12px', marginTop: '5px', zIndex: 1000, border: '1px solid #eee' }}>
                    {customers.map((c, index) => <div key={c.id} onClick={() => openCustomerDetail(c)} style={{ padding: '12px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', fontSize: '0.9rem', background: index === selectedIndex ? themeColorLight : 'transparent' }}><div style={{ fontWeight: 'bold' }}>{c.name} 様</div><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.phone || '電話未登録'}</div></div>)}
                  </div>
                )}
              </div>
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 0 auto', fontWeight: '900', color: '#1e293b' }}>{startDate.getFullYear()}年 {startDate.getMonth() + 1}月</h2>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '15px' }}>
              <button onClick={goPrevMonth} style={mobileArrowBtnStyle}>◀</button>
              <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: '900', color: '#1e293b' }}>{startDate.getFullYear()}年 {startDate.getMonth() + 1}月</h2>
              <button onClick={goNextMonth} style={mobileArrowBtnStyle}>▶</button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: isPC ? 'auto' : 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: isPC ? '900px' : '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
              <tr>
                <th style={{ width: isPC ? '80px' : '32px', borderBottom: '1px solid #ddd' }}></th>
                {weekDays.map(date => {
                  const isToday = getJapanDateStr(new Date()) === getJapanDateStr(date);
                  return (
                    <th key={date.toString()} style={{ padding: '4px 0', borderBottom: '1px solid #ddd' }}>
                      <div style={{ fontSize: '0.6rem', color: isToday ? themeColor : '#666' }}>{['日','月','火','水','木','金','土'][date.getDay()]}</div>
                      <div style={{ fontSize: isPC ? '1.5rem' : '0.9rem', fontWeight: 'bold', color: isToday ? '#fff' : '#333', background: isToday ? themeColor : 'none', width: isPC ? '40px' : '22px', height: isPC ? '40px' : '22px', borderRadius: '50%', margin: '2px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{date.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time} style={{ height: '60px' }}>
                  <td style={{ borderRight: '1px solid #eee', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}><span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>{time}</span></td>
                  {weekDays.map(date => {
                    const dStr = getJapanDateStr(date); const res = getStatusAt(dStr, time);
                    const isStart = res && new Date(res.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }) === time;
                    const isOtherShop = res && res.shop_id !== shopId && res.res_type !== 'system_blocked' && !res.isRegularHoliday;
                    let bgColor = '#fff'; let borderColor = '#f1f5f9'; let textColor = '#cbd5e1';
                    if (res) {
                      if (res.isRegularHoliday) { bgColor = '#f3f4f6'; textColor = '#94a3b8'; }
                      else if (isOtherShop) { bgColor = '#f1f5f9'; textColor = '#94a3b8'; borderColor = '#cbd5e1'; } 
                      else if (res.res_type === 'blocked') { bgColor = '#fee2e2'; textColor = '#ef4444'; borderColor = '#ef4444'; }
                      else if (res.res_type === 'system_blocked') { bgColor = '#f8fafc'; textColor = '#cbd5e1'; }
                      else if (isStart) { bgColor = themeColorLight; textColor = '#1e293b'; borderColor = themeColor; }
                      else { bgColor = '#fdfdfd'; textColor = '#cbd5e1'; }
                    }
                    return (
                      <td key={`${dStr}-${time}`} onClick={() => { setSelectedDate(dStr); setTargetTime(time); if(res && (isStart || res.res_type === 'blocked')){ openDetail(res); } else { setShowMenuModal(true); } }} style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', position: 'relative', cursor: 'pointer' }}>
                        {res && (
                          <div style={{ position: 'absolute', inset: '1px', background: bgColor, color: textColor, padding: '4px 8px', borderRadius: '2px', zIndex: 5, overflow: 'hidden', borderLeft: `2px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            {res.res_type === 'blocked' ? (res.isRegularHoliday ? (isStart ? <span style={{fontSize:'0.6rem', fontWeight:'bold'}}>定休日</span> : '') : (res.customer_name === '臨時休業' && isStart ? <span style={{fontSize:'0.7rem', fontWeight:'bold'}}>臨時休業</span> : '✕')) : (res.res_type === 'system_blocked' ? <span style={{fontSize:'0.6rem'}}>{res.customer_name}</span> : (isStart ? (<div style={{ fontWeight: 'bold', fontSize: isPC ? '0.9rem' : 'calc(0.7rem + 0.2vw)', writingMode: isPC ? 'horizontal-tb' : 'vertical-rl', textOrientation: 'upright', lineHeight: '1.1', height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', whiteSpace: isPC ? 'normal' : 'nowrap' }}>{isOtherShop ? `(${res.profiles?.business_name})` : isPC ? `${res.customer_name} 様` : getFamilyName(res.customer_name)}</div>) : '・'))}
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
        {!isPC && (
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', background: '#fff', borderRadius: '50px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', padding: '5px', zIndex: 100, border: '1px solid #eee' }}>
            <button onClick={goPrev} style={floatNavBtnStyle}>◀</button>
            <button onClick={goToday} style={{ ...floatNavBtnStyle, width: '80px', color: themeColor, fontSize: '0.9rem' }}>今日</button>
            <button onClick={goNext} style={floatNavBtnStyle}>▶</button>
          </div>
        )}
      </div>

      {(showCustomerModal || showDetailModal) && (
        <div onClick={() => { if(selectedRes?.isRegularHoliday) return; setShowCustomerModal(false); setShowDetailModal(false); }} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalContentStyle, maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{showCustomerModal ? '👤 顧客マスター編集' : (selectedRes?.res_type === 'blocked' ? (selectedRes.isRegularHoliday ? '📅 定休日' : '🚫 ブロック設定') : '📅 予約詳細・メニュー更新')}</h2>
              {isPC && <button onClick={() => { setShowCustomerModal(false); setShowDetailModal(false); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isPC ? '1fr 1fr' : '1fr', gap: '25px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  
                  {/* 🆕 予約メニュー編集セクション (追加・削除が可能に) */}
                  {showDetailModal && selectedRes?.res_type === 'normal' && (
                    <div style={{ marginBottom: '20px', padding: '12px', background: '#fff', borderRadius: '10px', border: `2px solid ${themeColor}` }}>
                      <label style={{ ...labelStyle, color: themeColor }}>📋 予約メニューの変更</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', maxHeight: '150px', overflowY: 'auto', padding: '5px' }}>
                        {allServices.map(s => (
                          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', padding: '6px', background: editingMenuIds.includes(s.id) ? themeColorLight : '#f8fafc', borderRadius: '6px', border: editingMenuIds.includes(s.id) ? `1px solid ${themeColor}` : '1px solid #eee' }}>
                            <input type="checkbox" checked={editingMenuIds.includes(s.id)} onChange={(e) => {
                              if (e.target.checked) setEditingMenuIds([...editingMenuIds, s.id]);
                              else setEditingMenuIds(editingMenuIds.filter(id => id !== s.id));
                            }} />
                            {s.name}
                          </label>
                        ))}
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b', textAlign: 'right', fontWeight: 'bold' }}>
                        合計所要時間: {allServices.filter(s => editingMenuIds.includes(s.id)).reduce((sum, s) => sum + (s.slots || 1), 0) * (shop?.slot_interval_min || 15)}分
                      </div>
                    </div>
                  )}

                  <label style={labelStyle}>お客様名</label>
                  <input type="text" value={editFields.name} onChange={(e) => setEditFields({...editFields, name: e.target.value})} style={inputStyle} />
                  <label style={labelStyle}>電話番号</label>
                  <input type="tel" value={editFields.phone} onChange={(e) => setEditFields({...editFields, phone: e.target.value})} style={inputStyle} placeholder="未登録" />
                  <label style={labelStyle}>メールアドレス</label>
                  <input type="email" value={editFields.email} onChange={(e) => setEditFields({...editFields, email: e.target.value})} style={inputStyle} placeholder="未登録" />
                  <label style={labelStyle}>顧客メモ</label>
                  <textarea value={editFields.memo} onChange={(e) => setEditFields({...editFields, memo: e.target.value})} style={{ ...inputStyle, height: '80px' }} placeholder="好み、注意事項など" />
                  
                  <button onClick={handleUpdateCustomer} style={{ width: '100%', padding: '12px', background: themeColor, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>情報を保存 ＆ メニュー同期</button>
                  {showDetailModal && selectedRes && (
                    <button onClick={() => deleteRes(selectedRes.id)} style={{ width: '100%', padding: '12px', background: selectedRes.res_type === 'blocked' ? themeColor : '#fee2e2', color: selectedRes.res_type === 'blocked' ? '#fff' : '#ef4444', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                      {selectedRes.res_type === 'blocked' ? (selectedRes.customer_name === '臨時休業' ? '🔓 休みを解除' : '🔓 ブロック解除') : '予約を消去 ＆ 名簿掃除'}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#64748b' }}>🕒 来店履歴</h4>
                <div style={{ height: isPC ? '400px' : '200px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                  {!selectedRes?.isRegularHoliday && (showCustomerModal ? customerFullHistory : customerHistory).map(h => (
                    <div key={h.id} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{new Date(h.start_time).toLocaleDateString('ja-JP')}</div>
                      <div style={{ color: themeColor, marginTop: '2px' }}>{h.menu_name || 'メニュー情報なし'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {!isPC && (
              <button onClick={() => { setShowCustomerModal(false); setShowDetailModal(false); }} style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', zIndex: 4000 }}>閉じる ✕</button>
            )}
          </div>
        </div>
      )}

      {showMenuModal && (
        <div onClick={() => setShowMenuModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '35px', borderRadius: '30px', width: '90%', maxWidth: '340px', textAlign: 'center', position: 'relative' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '0.9rem' }}>{selectedDate.replace(/-/g, '/')}</h3>
            <p style={{ fontWeight: '900', color: themeColor, fontSize: '2.2rem', margin: '0 0 30px 0' }}>{targetTime}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => navigate(`/shop/${shopId}/reserve`, { state: { adminDate: selectedDate, adminTime: targetTime } })} style={{ padding: '22px', background: themeColor, color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.2rem' }}>📝 予約を入れる</button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={handleBlockTime} style={{ padding: '15px', background: '#fff', color: '#ef4444', border: '2px solid #fee2e2', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>✕ この枠のみ</button>
                <button onClick={handleBlockFullDay} style={{ padding: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>🚀 今日を休みに</button>
              </div>
              <button onClick={() => setShowMenuModal(false)} style={{ padding: '15px', border: 'none', background: 'none', color: '#94a3b8' }}>キャンセル</button>
            </div>
            {!isPC && (
              <button onClick={() => setShowMenuModal(false)} style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', zIndex: 4000 }}>閉じる ✕</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReservations;