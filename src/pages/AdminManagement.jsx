import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Save, Clipboard, Calendar, FolderPlus, PlusCircle, Trash2, 
  Tag, ChevronDown, RefreshCw, ChevronLeft, ChevronRight, Settings, Users, Percent, Plus, Minus, X, CheckCircle, User, FileText, History, ShoppingBag, Edit3, BarChart3
} from 'lucide-react';

function AdminManagement() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const cleanShopId = shopId?.trim();

  // --- 画面管理・日付 ---
  const [activeMenu, setActiveMenu] = useState('work');
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [viewMonth, setViewMonth] = useState(new Date());

  // --- マスターデータ ---
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]); 
  const [adminAdjustments, setAdminAdjustments] = useState([]);
  const [products, setProducts] = useState([]); 
  const [deletedAdjIds, setDeletedAdjIds] = useState([]);
  const [deletedProductIds, setDeletedProductIds] = useState([]);

  // --- 予約データ（今年1年分を保持して分析に使用） ---
  const [todayReservations, setTodayReservations] = useState([]);

  // --- レジパネル用State ---
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [checkoutServices, setCheckoutServices] = useState([]); 
  const [checkoutAdjustments, setCheckoutAdjustments] = useState([]); 
  const [checkoutProducts, setCheckoutProducts] = useState([]); 
  const [finalPrice, setFinalPrice] = useState(0);
  const [openAdjCategory, setOpenAdjCategory] = useState(null); 
  const [isMenuPopupOpen, setIsMenuPopupOpen] = useState(false); 

  // --- 顧客情報（カルテ）パネル用State ---
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [customerMemo, setCustomerMemo] = useState('');
  const [firstArrivalDate, setFirstArrivalDate] = useState(''); 
  const [pastVisits, setPastVisits] = useState([]);
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  useEffect(() => {
    if (cleanShopId) {
      fetchInitialData();
    }
  }, [cleanShopId, activeMenu, selectedDate]);

  // ✅ 1年分のデータを一気に取得
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const shopRes = await supabase.from('profiles').select('*').eq('id', cleanShopId).single();
      if (shopRes.data) setShop(shopRes.data);

      // 今年の範囲を設定
      const startOfYear = `${new Date().getFullYear()}-01-01T00:00:00`;
      const endOfYear = `${new Date().getFullYear()}-12-31T23:59:59`;

      const { data: resData } = await supabase
        .from('reservations')
        .select('*')
        .eq('shop_id', cleanShopId)
        .gte('start_time', startOfYear)
        .lte('start_time', endOfYear)
        .order('start_time', { ascending: true });
      setTodayReservations(resData || []);

      const [catRes, servRes, optRes, adjRes, prodRes] = await Promise.all([
        supabase.from('service_categories').select('*').eq('shop_id', cleanShopId).order('sort_order'),
        supabase.from('services').select('*').eq('shop_id', cleanShopId).order('sort_order'),
        supabase.from('service_options').select('*'),
        supabase.from('admin_adjustments').select('*'),
        supabase.from('products').select('*').eq('shop_id', cleanShopId).order('sort_order')
      ]);
      setCategories(catRes.data || []);
      setServices(servRes.data || []);
      setServiceOptions(optRes.data || []);
      setAdminAdjustments(adjRes.data || []);
      setProducts(prodRes.data || []);
      setDeletedAdjIds([]);
      setDeletedProductIds([]);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 分析用集計ロジック：日別31日 ＆ 月別12月を確実に生成
  const analyticsData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0, count: 0 }));
    
    const yearForDays = viewMonth.getFullYear();
    const monthForDays = viewMonth.getMonth();
    const daysInMonth = new Date(yearForDays, monthForDays + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, total: 0, count: 0 }));

    // 自己予定(blocked)を除外し、完了(completed)のみを計算
    todayReservations.filter(r => r.res_type === 'normal' && r.status === 'completed').forEach(r => {
      const d = new Date(r.start_time);
      const rYear = d.getFullYear();
      const rMonth = d.getMonth();
      const rDay = d.getDate();

      if (rYear === yearForDays) {
        months[rMonth].total += (r.total_price || 0);
        months[rMonth].count += 1;

        if (rMonth === monthForDays) {
          days[rDay - 1].total += (r.total_price || 0);
          days[rDay - 1].count += 1;
        }
      }
    });
    return { months, days };
  }, [todayReservations, viewMonth]);

  const handleDateChange = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toLocaleDateString('sv-SE'));
  };

  const parseReservationDetails = (res) => {
    if (!res) return { menuName: '', totalPrice: 0, items: [], subItems: [] };
    const opt = typeof res.options === 'string' ? JSON.parse(res.options) : (res.options || {});
    const items = opt.services || opt.people?.[0]?.services || [];
    const subItems = Object.values(opt.options || opt.people?.[0]?.options || {});
    const menuName = items.length > 0 ? items.map(s => s.name).join(', ') : 'メニューなし';
    let basePrice = items.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    if (basePrice === 0 && items.length > 0) {
      items.forEach(item => {
        const master = services.find(s => s.id === item.id || s.name === item.name);
        if (master) basePrice += Number(master.price || 0);
      });
    }
    const optPrice = subItems.reduce((sum, o) => sum + (Number(o.additional_price) || 0), 0);
    return { menuName, totalPrice: basePrice + optPrice, items, subItems };
  };

  const saveAllMasters = async () => {
    setIsSaving(true);
    try {
      const formattedServices = services.map(svc => ({ id: svc.id, shop_id: cleanShopId, name: svc.name, price: svc.price || 0, category: svc.category, sort_order: svc.sort_order || 0, slots: svc.slots || 1 }));
      const formattedOptions = serviceOptions.map(opt => ({ id: opt.id, service_id: opt.service_id, group_name: opt.group_name, option_name: opt.option_name, additional_price: opt.additional_price || 0 }));
      const formattedAdjustments = adminAdjustments.map(adj => ({ id: adj.id, service_id: adj.service_id, name: adj.name, price: adj.price || 0, is_percent: adj.is_percent || false, is_minus: adj.is_minus || false, category: adj.service_id ? null : (adj.category || 'その他') }));
      const formattedProducts = products.map((p, i) => ({ id: p.id, shop_id: cleanShopId, name: p.name, price: p.price || 0, sort_order: i }));

      const promises = [
        supabase.from('services').upsert(formattedServices),
        supabase.from('service_options').upsert(formattedOptions),
        supabase.from('admin_adjustments').upsert(formattedAdjustments),
        supabase.from('products').upsert(formattedProducts)
      ];
      if (deletedAdjIds.length > 0) promises.push(supabase.from('admin_adjustments').delete().in('id', deletedAdjIds));
      if (deletedProductIds.length > 0) promises.push(supabase.from('products').delete().in('id', deletedProductIds));

      await Promise.all(promises);
      alert("設定を保存しました。");
      fetchInitialData();
    } catch (err) { alert("保存失敗: " + err.message); } finally { setIsSaving(false); }
  };

  const addAdjustment = (svcId = null) => {
    const name = prompt("項目名を入力");
    if (!name) return;
    let cat = null;
    if (svcId === null) cat = prompt("カテゴリ名を入力", "その他") || "その他";
    setAdminAdjustments([...adminAdjustments, { id: crypto.randomUUID(), service_id: svcId, name, price: 0, is_percent: false, is_minus: false, category: cat }]);
  };

  const handleRemoveAdjustment = (adj) => {
    if (adj.id && typeof adj.id === 'string' && !adj.id.includes('-temp')) setDeletedAdjIds(prev => [...prev, adj.id]);
    setAdminAdjustments(adminAdjustments.filter(a => a.id !== adj.id));
  };

  const addProduct = () => {
    const name = prompt("商品名を入力");
    if (name) setProducts([...products, { id: crypto.randomUUID(), name, price: 0 }]);
  };

  const cycleAdjType = (id) => {
    setAdminAdjustments(adminAdjustments.map(a => {
      if (a.id !== id) return a;
      if (!a.is_percent && !a.is_minus) return { ...a, is_minus: true, is_percent: false };
      if (a.is_minus) return { ...a, is_minus: false, is_percent: true };
      return { ...a, is_minus: false, is_percent: false };
    }));
  };

  const openCheckout = (res) => {
    const info = parseReservationDetails(res);
    setSelectedRes(res);
    setCheckoutServices(info.items); 
    setCheckoutAdjustments([]); 
    setCheckoutProducts([]);
    setFinalPrice(info.totalPrice);
    setOpenAdjCategory(null);
    setIsCheckoutOpen(true);
    setIsCustomerInfoOpen(false);
  };

  const toggleCheckoutService = (svc) => {
    const isSelected = checkoutServices.some(s => s.id === svc.id);
    const newSelection = isSelected ? checkoutServices.filter(s => s.id !== svc.id) : [...checkoutServices, svc];
    setCheckoutServices(newSelection);
    calculateFinalTotal(newSelection, checkoutAdjustments, checkoutProducts);
  };

  const toggleCheckoutAdj = (adj) => {
    const isSelected = checkoutAdjustments.find(a => a.id === adj.id);
    const newSelection = isSelected ? checkoutAdjustments.filter(a => a.id !== adj.id) : [...checkoutAdjustments, adj];
    setCheckoutAdjustments(newSelection);
    calculateFinalTotal(checkoutServices, newSelection, checkoutProducts);
  };

  const toggleCheckoutProduct = (prod) => {
    const isSelected = checkoutProducts.find(p => p.id === prod.id);
    const newSelection = isSelected ? checkoutProducts.filter(p => p.id !== prod.id) : [...checkoutProducts, prod];
    setCheckoutProducts(newSelection);
    calculateFinalTotal(checkoutServices, checkoutAdjustments, newSelection);
  };

  const calculateFinalTotal = (currentSvcs, currentAdjs, currentProds) => {
    let total = currentSvcs.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    currentProds.forEach(p => total += Number(p.price || 0));
    currentAdjs.filter(a => !a.is_percent).forEach(a => { total += a.is_minus ? -Number(a.price) : Number(a.price); });
    currentAdjs.filter(a => a.is_percent).forEach(a => { total = total * (1 - (Number(a.price) / 100)); });
    setFinalPrice(Math.max(0, Math.round(total)));
  };

  const completePayment = async () => {
    try {
      const totalSlots = checkoutServices.reduce((sum, s) => sum + (Number(s.slots) || 1), 0);
      const menuName = checkoutServices.map(s => s.name).join(', ');
      const startTime = new Date(selectedRes.start_time);
      const interval = shop.slot_interval_min || 15;
      const endTime = new Date(startTime.getTime() + totalSlots * interval * 60000);

      const { error } = await supabase.from('reservations').update({ 
        total_price: finalPrice, 
        status: 'completed',
        total_slots: totalSlots,
        end_time: endTime.toISOString(),
        menu_name: menuName,
        options: { services: checkoutServices }
      }).eq('id', selectedRes.id);

      if (error) throw error;
      alert("お会計を確定しました。予約枠も同期されました。");
      setIsCheckoutOpen(false); fetchInitialData();
    } catch (err) { alert("エラー: " + err.message); }
  };

  const openCustomerInfo = async (res) => {
    setSelectedRes(res);
    const { data: cust } = await supabase.from('customers').select('*').eq('shop_id', cleanShopId).eq('name', res.customer_name).maybeSingle();
    const { data: history } = await supabase.from('reservations').select('*').eq('shop_id', cleanShopId).eq('customer_name', res.customer_name).order('start_time', { ascending: false });
    setSelectedCustomer(cust || { name: res.customer_name, phone: res.customer_phone, email: res.customer_email });
    setEditName(cust?.name || res.customer_name);
    setEditPhone(cust?.phone || res.customer_phone || '');
    setEditEmail(cust?.email || res.customer_email || '');
    setCustomerMemo(cust?.memo || '');
    setPastVisits(history || []);
    setFirstArrivalDate(cust?.first_arrival_date || (history?.length > 0 ? history[history.length - 1].start_time.split('T')[0] : ''));
    setIsCustomerInfoOpen(true); setIsCheckoutOpen(false);
  };

  const saveCustomerInfo = async () => {
    if (!selectedCustomer) return;
    setIsSavingMemo(true);
    try {
      const currentId = selectedCustomer.id;
      const { data: duplicate } = await supabase.from('customers').select('*').eq('shop_id', cleanShopId).eq('name', editName).neq('id', currentId || '00000000-0000-0000-0000-000000000000').maybeSingle();
      if (duplicate) {
        const confirmMerge = window.confirm(`「${editName}」様は既に名簿に存在します。統合しますか？`);
        if (confirmMerge) {
          const mergedMemo = `${duplicate.memo || ''}\n\n--- 統合データ ---\n${customerMemo}`.trim();
          const mergedVisits = (duplicate.total_visits || 0) + (selectedCustomer.total_visits || 0);
          await supabase.from('customers').update({ memo: mergedMemo, total_visits: mergedVisits, line_user_id: selectedCustomer.line_user_id || duplicate.line_user_id, phone: editPhone || duplicate.phone, email: editEmail || duplicate.email, updated_at: new Date().toISOString() }).eq('id', duplicate.id);
          await supabase.from('reservations').update({ customer_name: editName }).eq('shop_id', cleanShopId).eq('customer_name', selectedCustomer.name);
          if (currentId) await supabase.from('customers').delete().eq('id', currentId);
          alert("名寄せ統合完了！");
          setIsCustomerInfoOpen(false); fetchInitialData(); return;
        }
      }
      const payload = { shop_id: cleanShopId, name: editName, phone: editPhone, email: editEmail, memo: customerMemo, first_arrival_date: firstArrivalDate, updated_at: new Date().toISOString() };
      if (currentId) await supabase.from('customers').update(payload).eq('id', currentId);
      else await supabase.from('customers').insert([payload]);
      if (selectedCustomer.name !== editName) await supabase.from('reservations').update({ customer_name: editName }).eq('shop_id', cleanShopId).eq('customer_name', selectedCustomer.name);
      alert("情報を更新しました。");
      fetchInitialData();
    } catch (err) { alert("保存失敗: " + err.message); } finally { setIsSavingMemo(false); }
  };

  // ✅ 修正：1年分の中から、選択した「selectedDate」でお客様(normal)のみを合計
  const dailyTotalSales = useMemo(() => {
    return todayReservations
      .filter(r => r.start_time.startsWith(selectedDate) && r.res_type === 'normal' && r.status === 'completed') 
      .reduce((sum, r) => sum + (r.total_price || 0), 0);
  }, [todayReservations, selectedDate]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear(); const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewMonth]);

  const sortItems = (items) => [...items].sort((a, b) => {
    const catA = a.category || 'その他'; const catB = b.category || 'その他';
    if (catA !== catB) return catA.localeCompare(catB, 'ja');
    if (a.name !== b.name) return a.name.localeCompare(b.name, 'ja');
    return (a.price || 0) - (b.price || 0);
  });

  const groupedWholeAdjustments = useMemo(() => {
    const sorted = sortItems(adminAdjustments.filter(adj => adj.service_id === null));
    return sorted.reduce((acc, adj) => {
      const cat = adj.category || 'その他';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(adj);
      return acc;
    }, {});
  }, [adminAdjustments]);

  return (
    <div style={fullPageWrapper}>
      <div style={sidebarStyle}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '2.2rem', fontStyle: 'italic', fontWeight: '900', color: '#4b2c85', margin: 0 }}>SOLO</h2>
          <p style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>MANAGEMENT</p>
        </div>
        <button style={navBtnStyle(activeMenu === 'work', '#d34817')} onClick={() => setActiveMenu('work')}>日常業務</button>
        <button style={navBtnStyle(activeMenu === 'master_tech', '#4285f4')} onClick={() => setActiveMenu('master_tech')}>施術商品</button>
        {/* 分析タブボタン */}
        <button style={navBtnStyle(activeMenu === 'analytics', '#008000')} onClick={() => setActiveMenu('analytics')}>売上分析</button>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '10px', marginTop: '15px', border: '1px solid #4b2c85' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{viewMonth.getFullYear()}年{viewMonth.getMonth()+1}月</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth()-1)))} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>◀</button>
              <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth()+1)))} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>▶</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
            {['月','火','水','木','金','土','日'].map(d => <div key={d} style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{d}</div>)}
            {calendarDays.map((d, i) => d ? (
              <div key={i} onClick={() => setSelectedDate(d.toLocaleDateString('sv-SE'))} style={{ fontSize: '0.7rem', padding: '4px 0', cursor: 'pointer', borderRadius: '4px', background: d.toLocaleDateString('sv-SE') === selectedDate ? '#4b2c85' : 'none', color: d.toLocaleDateString('sv-SE') === selectedDate ? '#fff' : '#333' }}>{d.getDate()}</div>
            ) : <div key={i} />)}
          </div>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button style={navBtnStyle(false, '#ff1493')} onClick={() => navigate(`/admin/${cleanShopId}/reservations`)}>業 務 終 了</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* 日常業務タブ */}
        {activeMenu === 'work' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ background: '#d34817', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontStyle: 'italic', fontSize: '1.4rem' }}>受付台帳：{selectedDate.replace(/-/g, '/')}</h2>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                <button onClick={() => handleDateChange(-1)} style={headerBtnSmall}>前日</button>
                <button onClick={() => setSelectedDate(new Date().toLocaleDateString('sv-SE'))} style={headerBtnSmall}>今日</button>
                <button onClick={() => handleDateChange(1)} style={headerBtnSmall}>次日</button>
              </div>
              <div style={{ background: '#fff', color: '#d34817', padding: '5px 15px', fontWeight: 'bold', marginLeft: 'auto' }}>
                {todayReservations.filter(r => r.start_time.startsWith(selectedDate) && r.res_type === 'normal').length}件の予約
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f0ff', borderBottom: '2px solid #4b2c85' }}>
                    <th style={thStyle}>時間</th><th style={thStyle}>お客様名 (カルテ)</th><th style={thStyle}>メニュー(予定)</th><th style={thStyle}>お会計 (レジ)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 自己予定を除外して表示 */}
                  {todayReservations.filter(r => r.start_time.startsWith(selectedDate) && r.res_type === 'normal').length > 0 ? 
                    todayReservations.filter(r => r.start_time.startsWith(selectedDate) && r.res_type === 'normal').map((res) => {
                    const info = parseReservationDetails(res);
                    return (
                      <tr key={res.id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                        <td onClick={() => openCheckout(res)} style={tdStyle}>{new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td onClick={() => openCustomerInfo(res)} style={{ ...tdStyle, background: res.status === 'completed' ? '#eee' : '#008000', color: res.status === 'completed' ? '#333' : '#fff', fontWeight: 'bold' }}>{res.customer_name} {res.status === 'completed' && '✓'}</td>
                        <td onClick={() => openCheckout(res)} style={tdStyle}>{info.menuName}</td>
                        <td onClick={() => openCheckout(res)} style={{ ...tdStyle, fontWeight: 'bold' }}>¥ {(res.total_price || info.totalPrice).toLocaleString()}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="4" style={{ padding: '50px', textAlign: 'center', color: '#999' }}>予約はありません。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', background: '#d34817', padding: '15px 25px', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', color: '#fff' }}>
               <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>本日のお会計確定 合計</div>
               <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>¥ {dailyTotalSales.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* ✅ 売上分析タブ：全日・全月を網羅して表示 */}
        {activeMenu === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
            <div style={{ background: '#008000', padding: '15px 25px', color: '#fff' }}>
              <h2 style={{ margin: 0, fontStyle: 'italic', fontSize: '1.4rem' }}>売上・集計分析 ({viewMonth.getFullYear()}年)</h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* 月間・日別集計 */}
              <div style={cardStyle}>
                <div style={catHeaderStyle}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>📅 月間・日別集計 ({viewMonth.getMonth() + 1}月)</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={thStyle}>日付</th><th style={thStyle}>来客数</th><th style={thStyle}>売上高</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.days.map(d => (
                        <tr key={d.day} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={tdStyle}>{d.day}日</td>
                          <td style={tdStyle}>{d.count}名</td>
                          <td style={{ ...tdStyle, fontWeight: 'bold', color: d.total > 0 ? '#d34817' : '#94a3b8' }}>¥ {d.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 年間・月別集計 */}
              <div style={cardStyle}>
                <div style={catHeaderStyle}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>🗓️ 年間・月別集計 ({viewMonth.getFullYear()}年)</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={thStyle}>月</th><th style={thStyle}>来客数</th><th style={thStyle}>売上高</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.months.map(m => (
                        <tr key={m.month} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={tdStyle}>{m.month}月</td>
                          <td style={tdStyle}>{m.count}名</td>
                          <td style={{ ...tdStyle, fontWeight: 'bold', color: m.total > 0 ? '#4b2c85' : '#94a3b8' }}>¥ {m.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 施術商品マスター設定 */}
        {activeMenu === 'master_tech' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
            <div style={{ background: '#4285f4', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontStyle: 'italic' }}>商品マスター設定</h2>
              <button onClick={saveAllMasters} disabled={isSaving} style={{ padding: '8px 30px', background: '#008000', color: '#fff', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' }}>一括保存</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              {categories.map(cat => (
                <div key={cat.id} style={cardStyle}>
                  <div style={catHeaderStyle}><span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>📁 {cat.name}</span></div>
                  {services.filter(s => s.category === cat.name).map(svc => (
                    <div key={svc.id} style={svcRowStyle}>
                       <span style={{ fontWeight: 'bold', minWidth: '180px' }}>{svc.name} (コマ:{svc.slots || 1})</span>
                       <input type="number" value={svc.price || 0} onChange={(e) => setServices(services.map(s => s.id === svc.id ? {...s, price: parseInt(e.target.value)} : s))} style={priceInputStyle} />
                       <button onClick={() => addAdjustment(svc.id)} style={optAddBtnStyle}>＋ プロ調整</button>
                       <div style={{ flex: 1, display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {sortItems(adminAdjustments.filter(a => a.service_id === svc.id)).map(adj => (
                            <div key={adj.id} style={{ ...adjChipStyle }}>
                                <span>{adj.name}</span>
                                <button onClick={() => cycleAdjType(adj.id)} style={typeBtnStyle}>{adj.is_percent ? '%' : adj.is_minus ? '-' : '+'}</button>
                                <input type="number" value={adj.price || 0} onChange={(e) => setAdminAdjustments(adminAdjustments.map(a => a.id === adj.id ? {...a, price: parseInt(e.target.value)} : a))} style={miniPriceInput} />
                                <button onClick={() => handleRemoveAdjustment(adj)} style={{border:'none', background:'none'}}>×</button>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ ...cardStyle, border: '3px solid #008000' }}>
                <div style={{ ...catHeaderStyle, background: '#f0fdf4', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#008000' }}>🧴 店販商品マスター</span>
                  <button onClick={addProduct} style={{ ...optAddBtnStyle, borderColor: '#008000', color: '#008000' }}>＋ 商品を追加</button>
                </div>
                <div style={{ padding: '20px' }}>
                  {products.map((p) => (
                    <div key={p.id} style={{ ...svcRowStyle, borderBottom: '1px solid #eee' }}>
                      <input value={p.name} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} style={{ ...optInputStyle, width: '200px' }} />
                      <input type="number" value={p.price || 0} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, price: parseInt(e.target.value)} : x))} style={priceInputStyle} />
                      <button onClick={() => { setDeletedProductIds([...deletedProductIds, p.id]); setProducts(products.filter(x => x.id !== p.id)); }} style={{ color: '#ef4444', border: 'none', background: 'none' }}><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* レジパネル */}
        {isCheckoutOpen && (
          <div style={checkoutOverlayStyle} onClick={() => setIsCheckoutOpen(false)}>
            <div style={checkoutPanelStyle} onClick={(e) => e.stopPropagation()}>
              <div style={checkoutHeaderStyle}>
                <div><h3 style={{ margin: 0 }}>{selectedRes?.customer_name} 様</h3><p style={{ fontSize: '0.8rem', margin: 0 }}>レジ・お会計 ＆ メニュー同期</p></div>
                <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X size={24} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4b2c85', paddingBottom: '5px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b2c85', fontWeight: 'bold' }}><Clipboard size={16} /> 施術内容</div>
                  <button onClick={() => setIsMenuPopupOpen(true)} style={{ background: '#f3f0ff', color: '#4b2c85', border: '1px solid #4b2c85', borderRadius: '5px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Edit3 size={12} /> メニューを変更
                  </button>
                </div>
                <div style={{ background: '#f9f9ff', padding: '15px', borderRadius: '10px', marginBottom: '25px', border: '1px dashed #4b2c85' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#333' }}>{checkoutServices.length > 0 ? checkoutServices.map(s => s.name).join(', ') : 'メニューなし'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>時間: {checkoutServices.reduce((sum, s) => sum + (Number(s.slots) || 1), 0) * (shop?.slot_interval_min || 15)} 分</span>
                    <span style={{ color: '#4b2c85', fontWeight: 'bold' }}>¥ {checkoutServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0).toLocaleString()}</span>
                  </div>
                </div>
                <SectionTitle icon={<Settings size={16} />} title="プロの微調整" color="#ef4444" />
                {Object.entries(groupedWholeAdjustments).map(([catName, adjs]) => (
                  <div key={catName} style={{ marginBottom: '10px' }}>
                    <button onClick={() => setOpenAdjCategory(openAdjCategory === catName ? null : catName)} style={categoryToggleStyle}><span>{catName}</span><ChevronRight size={18} /></button>
                    {openAdjCategory === catName && adjs.map(adj => (<button key={adj.id} onClick={() => toggleCheckoutAdj(adj)} style={adjBtnStyle(checkoutAdjustments.some(a => a.id === adj.id))}>{adj.name}</button>))}
                  </div>
                ))}
              </div>
              <div style={checkoutFooterStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>最終合計金額</span><span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#d34817' }}>¥ {finalPrice.toLocaleString()}</span></div>
                <button onClick={completePayment} style={completeBtnStyle}><CheckCircle size={20} /> 確定して同期</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// スタイル定義パーツ
const SectionTitle = ({ icon, title, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color, fontWeight: 'bold', borderBottom: `2px solid ${color}`, paddingBottom: '5px', marginBottom: '15px' }}>{icon} {title}</div>
);

const fullPageWrapper = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', background: '#fff', zIndex: 9999, overflow: 'hidden' };
const sidebarStyle = { width: '260px', background: '#e0d7f7', borderRight: '2px solid #4b2c85', padding: '15px', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' };
const navBtnStyle = (active, color) => ({ width: '100%', padding: '12px', background: active ? '#fff' : color, color: active ? '#000' : '#fff', border: '1px solid #000', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '6px', boxShadow: active ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : '2px 2px 0px rgba(0,0,0,0.5)' });
const thStyle = { padding: '12px', border: '1px solid #4b2c85', textAlign: 'center' };
const tdStyle = { padding: '12px', border: '1px solid #eee', textAlign: 'center' };
const cardStyle = { background: '#fff', border: '2px solid #4b2c85', borderRadius: '8px', marginBottom: '30px', overflow: 'hidden' };
const catHeaderStyle = { background: '#f3f0ff', padding: '15px 20px', borderBottom: '2px solid #4b2c85' };
const svcRowStyle = { padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' };
const priceInputStyle = { border: '1px solid #ddd', padding: '5px', width: '100px', textAlign: 'right', fontWeight: '900', color: '#d34817' };
const optAddBtnStyle = { background: '#fff', border: '1px dashed #4285f4', color: '#4285f4', padding: '5px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' };
const checkoutOverlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' };
const checkoutPanelStyle = { width: '450px', background: '#fff', height: '100%', boxShadow: '-5px 0px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' };
const checkoutHeaderStyle = { background: '#4b2c85', color: '#fff', padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const checkoutFooterStyle = { background: '#f8fafc', padding: '25px', borderTop: '2px solid #ddd' };
const adjBtnStyle = (active) => ({ padding: '10px 15px', background: active ? '#ef4444' : '#fff', color: active ? '#fff' : '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', marginRight: '5px', marginBottom: '5px' });
const completeBtnStyle = { width: '100%', padding: '15px', background: '#008000', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const editInputStyle = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '10px' };
const headerBtnSmall = { padding: '5px 12px', borderRadius: '6px', border: '1px solid #fff', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' };
const categoryToggleStyle = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', color: '#4b2c85' };
const miniPriceInput = { border: 'none', background: '#f1f5f9', width: '60px', textAlign: 'right', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' };
const adjChipStyle = { background: '#fff5f5', border: '1px solid #feb2b2', padding: '8px 12px', display: 'flex', gap: '5px', borderRadius: '10px' };
const typeBtnStyle = { border: '1px solid #ef4444', background: '#fff', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ef4444' };
const optInputStyle = { background: 'transparent', border: 'none', fontSize: '0.9rem', fontWeight: 'bold' };

export default AdminManagement;