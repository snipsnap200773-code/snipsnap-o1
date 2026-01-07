import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminDashboard() {
  const { shopId } = useParams();
  
  // 共通State
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'hours', 'info'
  const [message, setMessage] = useState('');
  const [shopData, setShopData] = useState(null);

  // メニュー設定用State
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceSlots, setNewServiceSlots] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [options, setOptions] = useState([]);
  const [activeServiceForOptions, setActiveServiceForOptions] = useState(null);
  const [optGroupName, setOptGroupName] = useState('');
  const [optName, setOptName] = useState('');
  const [optSlots, setOptSlots] = useState(0);
  const [editingDisableCatId, setEditingDisableCatId] = useState(null);

  // 営業時間・店舗情報用State
  const [phone, setPhone] = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [address, setAddress] = useState(''); 
  const [description, setDescription] = useState(''); 
  const [notes, setNotes] = useState(''); 
  const [businessHours, setBusinessHours] = useState({});
  const [maxLastSlots, setMaxLastSlots] = useState(2);

  // 新規追加：詳細予約ルールState
  const [slotIntervalMin, setSlotIntervalMin] = useState(15); // 予約単位（15, 30分）
  const [bufferPreparationMin, setBufferPreparationMin] = useState(0); // 準備時間
  const [minLeadTimeHours, setMinLeadTimeHours] = useState(0); // 当日予約制限
  const [autoFillLogic, setAutoFillLogic] = useState(true); // 自動詰め機能

  const dayMap = {
    mon: '月曜日', tue: '火曜日', wed: '水曜日', thu: '木曜日',
    fri: '金曜日', sat: '土曜日', sun: '日曜日'
  };

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
    const catRes = await supabase.from('service_categories').select('*').eq('shop_id', shopId).order('sort_order', { ascending: true });
    const servRes = await supabase.from('services').select('*').eq('shop_id', shopId).order('sort_order', { ascending: true });
    const optRes = await supabase.from('service_options').select('*'); 
    const shopRes = await supabase.from('profiles').select('*').eq('id', shopId).single();

    if (catRes.data) setCategories(catRes.data);
    if (servRes.data) setServices(servRes.data);
    if (optRes.data) setOptions(optRes.data);
    if (shopRes.data) {
      setShopData(shopRes.data);
      setAllowMultiple(shopRes.data.allow_multiple_services);
      setPhone(shopRes.data.phone || '');
      setEmailContact(shopRes.data.email_contact || '');
      setAddress(shopRes.data.address || '');
      setDescription(shopRes.data.description || '');
      setNotes(shopRes.data.notes || '');
      setBusinessHours(shopRes.data.business_hours || {});
      setMaxLastSlots(shopRes.data.max_last_slots || 2);
      
      // 新規項目の読み込み（データがない場合はデフォルト値）
      setSlotIntervalMin(shopRes.data.slot_interval_min || 15);
      setBufferPreparationMin(shopRes.data.buffer_preparation_min || 0);
      setMinLeadTimeHours(shopRes.data.min_lead_time_hours || 0);
      setAutoFillLogic(shopRes.data.auto_fill_logic ?? true);
    }
  };

  const showMsg = (txt) => {
    setMessage(txt);
    setTimeout(() => setMessage(''), 3000);
  };

  const changeTab = (tabName) => {
    setActiveTab(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSave = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        phone: phone,
        email_contact: emailContact,
        address: address,
        description: description,
        notes: notes,
        business_hours: businessHours,
        allow_multiple_services: allowMultiple,
        max_last_slots: maxLastSlots,
        // 新規項目
        slot_interval_min: slotIntervalMin,
        buffer_preparation_min: bufferPreparationMin,
        min_lead_time_hours: minLeadTimeHours,
        auto_fill_logic: autoFillLogic
      })
      .eq('id', shopId);

    if (!error) {
      showMsg('すべての設定を保存しました！');
    } else {
      alert('保存に失敗しました。DBのカラムが追加されているか確認してください。');
    }
  };

  const moveItem = async (type, list, id, direction) => {
    if (type === 'category') {
      const idx = list.findIndex(item => item.id === id);
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return;
      const newList = [...list];
      const [moved] = newList.splice(idx, 1);
      newList.splice(targetIdx, 0, moved);
      const updates = newList.map((item, i) => ({ id: item.id, shop_id: shopId, sort_order: i, name: item.name }));
      setCategories(newList);
      await supabase.from('service_categories').upsert(updates);
    } else {
      const itemToMove = list.find(s => s.id === id);
      const categoryItems = list.filter(s => s.category === itemToMove.category);
      const idxInCat = categoryItems.findIndex(s => s.id === id);
      const targetIdxInCat = direction === 'up' ? idxInCat - 1 : idxInCat + 1;
      if (targetIdxInCat < 0 || targetIdxInCat >= categoryItems.length) return;
      const newCatItems = [...categoryItems];
      const [moved] = newCatItems.splice(idxInCat, 1);
      newCatItems.splice(targetIdxInCat, 0, moved);
      const otherCatItems = list.filter(s => s.category !== itemToMove.category);
      const combinedList = [...otherCatItems, ...newCatItems]; 
      const finalUpdates = combinedList.map((item, i) => ({
        id: item.id, shop_id: shopId, sort_order: i, name: item.name, slots: item.slots, category: item.category
      }));
      setServices(combinedList);
      await supabase.from('services').upsert(finalUpdates);
    }
    fetchData();
  };

  const handleToggleDisableCat = async (catId, targetCatName) => {
    const targetCat = categories.find(c => c.id === catId);
    let currentDisables = targetCat.disable_categories ? targetCat.disable_categories.split(',').map(s => s.trim()).filter(s => s) : [];
    if (currentDisables.includes(targetCatName)) {
      currentDisables = currentDisables.filter(name => name !== targetCatName);
    } else {
      currentDisables.push(targetCatName);
    }
    await supabase.from('service_categories').update({ disable_categories: currentDisables.join(',') }).eq('id', catId);
    fetchData();
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (editingCategoryId) {
      await supabase.from('service_categories').update({ name: newCategoryName }).eq('id', editingCategoryId);
      setEditingCategoryId(null);
    } else {
      await supabase.from('service_categories').insert([{ shop_id: shopId, name: newCategoryName, sort_order: categories.length }]);
    }
    setNewCategoryName(''); fetchData();
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = selectedCategory || (categories[0]?.name || 'その他');
    const serviceData = { shop_id: shopId, name: newServiceName, slots: newServiceSlots, category: finalCategory };
    if (editingServiceId) {
      await supabase.from('services').update(serviceData).eq('id', editingServiceId);
      setEditingServiceId(null);
    } else {
      await supabase.from('services').insert([{ ...serviceData, sort_order: services.length }]);
    }
    setNewServiceName(''); setNewServiceSlots(1); fetchData();
  };

  const handleOptionSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('service_options').insert([{ service_id: activeServiceForOptions.id, group_name: optGroupName, option_name: optName, additional_slots: optSlots }]);
    setOptName(''); setOptSlots(0); fetchData();
  };

  const deleteCategory = async (id) => { if (window.confirm(`削除しますか？`)) { await supabase.from('service_categories').delete().eq('id', id); fetchData(); } };
  const deleteService = async (id) => { if (window.confirm('削除しますか？')) { await supabase.from('services').delete().eq('id', id); fetchData(); } };
  const deleteOption = async (id) => { await supabase.from('service_options').delete().eq('id', id); fetchData(); };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto', paddingBottom: '120px' }}>
      
      {/* 1. 固定ヘッダー & タブ切り替え */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #eee', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <Link to="/" style={{ fontSize: '0.8rem', color: '#666' }}>← 戻る</Link>
          <Link to={`/shop/${shopId}/reserve`} style={{ fontSize: '0.75rem', background: '#10b981', color: 'white', padding: '5px 12px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold' }}>予約画面を確認</Link>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={() => changeTab('menu')} style={{ flex: 1, padding: '12px 5px', border: 'none', borderRadius: '8px', background: activeTab === 'menu' ? '#2563eb' : '#f1f5f9', color: activeTab === 'menu' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '0.85rem' }}>メニュー</button>
          <button onClick={() => changeTab('hours')} style={{ flex: 1, padding: '12px 5px', border: 'none', borderRadius: '8px', background: activeTab === 'hours' ? '#2563eb' : '#f1f5f9', color: activeTab === 'hours' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '0.85rem' }}>営業時間</button>
          <button onClick={() => changeTab('info')} style={{ flex: 1, padding: '12px 5px', border: 'none', borderRadius: '8px', background: activeTab === 'info' ? '#2563eb' : '#f1f5f9', color: activeTab === 'info' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '0.85rem' }}>店舗情報</button>
        </div>
      </div>

      <div style={{ padding: '15px' }}>
        {message && <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', width: '90%', padding: '15px', background: '#dcfce7', color: '#166534', borderRadius: '8px', zIndex: 1001, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{message}</div>}

        {/* --- タブ内容：メニュー設定 --- */}
        {activeTab === 'menu' && (
          <div>
            <section style={{ marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #2563eb' }}>
              <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: '#2563eb' }}>🛡️ 予約ルール</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} style={{ width: '22px', height: '22px' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>メニューの複数選択を許可する</span>
              </label>
            </section>

            <section style={{ marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #ddd' }}>
              <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>📂 カテゴリ設定</h3>
              <form onSubmit={handleCategorySubmit} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <input placeholder="カテゴリ名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} required />
                <button type="submit" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px' }}>作成</button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categories.map((c, idx) => (
                  <div key={c.id} style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                         <button onClick={() => moveItem('category', categories, c.id, 'up')} disabled={idx === 0}>▲</button>
                         <button onClick={() => moveItem('category', categories, c.id, 'down')} disabled={idx === categories.length - 1}>▼</button>
                         <button onClick={() => {setEditingCategoryId(c.id); setNewCategoryName(c.name);}}>✎</button>
                         <button onClick={() => deleteCategory(c.id)}>×</button>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => {
                        const updates = categories.map(cat => cat.id === c.id ? {...cat, allow_multiple_in_category: !cat.allow_multiple_in_category} : cat);
                        setCategories(updates);
                        supabase.from('service_categories').update({ allow_multiple_in_category: !c.allow_multiple_in_category }).eq('id', c.id).then();
                      }} style={{ fontSize: '0.7rem', padding: '4px 8px', background: c.allow_multiple_in_category ? '#2563eb' : '#fff', color: c.allow_multiple_in_category ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: '15px' }}>
                        {c.allow_multiple_in_category ? '複数選択可' : '1つのみ選択'}
                      </button>
                      <button onClick={() => setEditingDisableCatId(editingDisableCatId === c.id ? null : c.id)} style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '15px' }}>🔗 連動設定</button>
                    </div>
                    {editingDisableCatId === c.id && (
                      <div style={{ marginTop: '10px', padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #2563eb' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '5px' }}>無効にするカテゴリ：</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {categories.filter(target => target.id !== c.id).map(target => {
                            const isSelected = c.disable_categories?.split(',').includes(target.name);
                            return <button key={target.id} onClick={() => handleToggleDisableCat(c.id, target.name)} style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '10px', border: '1px solid', borderColor: isSelected ? '#ef4444' : '#ccc', background: isSelected ? '#fee2e2' : '#fff', color: isSelected ? '#ef4444' : '#666' }}>{isSelected ? '✕ ' : '+ '} {target.name}</button>
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: '30px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>📝 メニュー登録・編集</h3>
              <form onSubmit={handleServiceSubmit}>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }} required>
                  <option value="">-- カテゴリ選択 --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="メニュー名" required />
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>必要コマ数: <span style={{ color: '#2563eb' }}>{newServiceSlots}コマ ({newServiceSlots * slotIntervalMin}分)</span></label>
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => <button key={n} type="button" onClick={() => setNewServiceSlots(n)} style={{ flex: 1, padding: '12px 0', borderRadius: '8px', border: '1px solid', borderColor: newServiceSlots === n ? '#2563eb' : '#ccc', background: newServiceSlots === n ? '#2563eb' : 'white', color: newServiceSlots === n ? 'white' : '#333', fontWeight: 'bold', fontSize: '0.75rem' }}>{n}</button>)}
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', padding: '15px', background: editingServiceId ? '#f97316' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>メニューを保存</button>
              </form>
            </section>

            {categories.map((cat) => {
              const catServices = services.filter(s => s.category === cat.name);
              return (
                <div key={cat.id} style={{ marginBottom: '25px' }}>
                  <h4 style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '10px', borderLeft: '4px solid #cbd5e1', paddingLeft: '8px' }}>{cat.name}</h4>
                  {catServices.map((s, idxInCat) => (
                    <div key={s.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>{s.slots * slotIntervalMin}分 ({s.slots}コマ)</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button onClick={() => moveItem('service', services, s.id, 'up')} disabled={idxInCat === 0} style={{ padding: '4px', fontSize: '0.6rem' }}>▲</button>
                            <button onClick={() => moveItem('service', services, s.id, 'down')} disabled={idxInCat === catServices.length - 1} style={{ padding: '4px', fontSize: '0.6rem' }}>▼</button>
                          </div>
                          <button onClick={() => setActiveServiceForOptions(activeServiceForOptions?.id === s.id ? null : s)} style={{ padding: '8px 10px', fontSize: '0.7rem', background: '#f1f5f9', borderRadius: '6px', border: 'none' }}>枝</button>
                          <button onClick={() => {setEditingServiceId(s.id); setNewServiceName(s.name); setNewServiceSlots(s.slots); setSelectedCategory(s.category);}}>✎</button>
                          <button onClick={() => deleteService(s.id)}>×</button>
                        </div>
                      </div>
                      {activeServiceForOptions?.id === s.id && (
                        <div style={{ padding: '15px', borderTop: '1px solid #eee', background: '#f9fafb' }}>
                          <form onSubmit={handleOptionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}><input placeholder="グループ名" value={optGroupName} onChange={(e) => setOptGroupName(e.target.value)} style={{ flex: 1.2, padding: '10px', border: '1px solid #ccc' }} required /><input placeholder="選択肢名" value={optName} onChange={(e) => setOptName(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #ccc' }} required /></div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><input type="number" value={optSlots} onChange={(e) => setOptSlots(parseInt(e.target.value))} style={{ flex: 1, padding: '10px', border: '1px solid #ccc' }} min="0" /><button type="submit" style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>追加</button></div>
                          </form>
                          {options.filter(o => o.service_id === s.id).map(o => (<div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #ccc', fontSize: '0.8rem' }}><span>{o.group_name}: {o.option_name} (+{o.additional_slots * slotIntervalMin}分)</span><button onClick={() => deleteOption(o.id)} style={{ color: 'red', border: 'none', background: 'none' }}>削除</button></div>))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* --- タブ内容：営業時間 & 詳細ルール --- */}
        {activeTab === 'hours' && (
          <div>
            {/* 詳細予約ルール設定 */}
            <section style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '2px solid #2563eb', marginBottom: '25px' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#2563eb' }}>⚙️ 詳細予約エンジンの設定</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1コマの単位</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[15, 30].map(min => (
                    <button key={min} onClick={() => setSlotIntervalMin(min)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: slotIntervalMin === min ? '#2563eb' : '#ccc', background: slotIntervalMin === min ? '#2563eb' : '#fff', color: slotIntervalMin === min ? '#fff' : '#333', fontWeight: 'bold' }}>{min}分</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>準備時間（インターバル）</label>
                <select value={bufferPreparationMin} onChange={(e) => setBufferPreparationMin(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                  <option value={0}>なし</option>
                  <option value={15}>15分</option>
                  <option value={30}>30分</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>当日予約の制限</label>
                <select value={minLeadTimeHours} onChange={(e) => setMinLeadTimeHours(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                  <option value={0}>制限なし（即時）</option>
                  <option value={1}>1時間後から受付</option>
                  <option value={3}>3時間後から受付</option>
                  <option value={24}>前日まで（24時間前）</option>
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoFillLogic} onChange={(e) => setAutoFillLogic(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>自動詰め機能を有効にする</span>
                </label>
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '5px', marginLeft: '32px' }}>中途半端な空き時間を作らないよう、予約を詰めて表示します。</p>
              </div>
            </section>

            <section style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem' }}>⏰ 基本営業時間</h3>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '15px' }}>お昼休み（休憩）もこちらで設定可能です。</p>
              {Object.keys(dayMap).map(day => (
                <div key={day} style={{ borderBottom: '1px solid #f1f5f9', padding: '15px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{dayMap[day]}</span>
                    <label style={{ fontSize: '0.8rem', color: businessHours[day]?.is_closed ? '#ef4444' : '#10b981', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!businessHours[day]?.is_closed} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], is_closed: !e.target.checked}})} />
                      {businessHours[day]?.is_closed ? '定休日' : '営業中'}
                    </label>
                  </div>
                  {!businessHours[day]?.is_closed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                        <span style={{ width: '40px' }}>営業</span>
                        <input type="time" value={businessHours[day]?.open || '09:00'} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], open: e.target.value}})} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
                        <span>〜</span>
                        <input type="time" value={businessHours[day]?.close || '18:00'} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], close: e.target.value}})} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#64748b' }}>
                        <span style={{ width: '40px' }}>休憩</span>
                        <input type="time" value={businessHours[day]?.rest_start || ''} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], rest_start: e.target.value}})} placeholder="なし" style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
                        <span>〜</span>
                        <input type="time" value={businessHours[day]?.rest_end || ''} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], rest_end: e.target.value}})} placeholder="なし" style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>

            <section style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f97316' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#f97316' }}>🏁 最終受付の制限設定</h3>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '15px' }}>
                閉店時間ジャストでも受け付ける最大コマ数を指定します。<br/>
                例：<b>2コマ</b>に設定すると、3コマのメニューは閉店の1コマ分前までしか選べません。
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '0.9rem' }}>最終受付許容枠:</span>
                <input type="number" value={maxLastSlots} onChange={(e) => setMaxLastSlots(parseInt(e.target.value))} style={{ width: '60px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }} min="1" />
                <span style={{ fontWeight: 'bold' }}>{maxLastSlots * slotIntervalMin}分までのメニュー</span>
              </div>
            </section>
          </div>
        )}

        {/* --- タブ内容：店舗情報 --- */}
        {activeTab === 'info' && (
          <section style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd' }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>🏪 店舗プロフィールの設定</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>店舗の説明（メッセージ）</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="お店のこだわりや雰囲気を入力してください" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '100px', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>店舗の住所</label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="神奈川県厚木市..." 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>電話番号</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03-1234-5678" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>メールアドレス</label>
              <input type="email" value={emailContact} onChange={(e) => setEmailContact(e.target.value)} placeholder="shop@example.com" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#ef4444' }}>⚠️ 予約時の注意事項</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="例：保険証を持参してください。" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ef4444', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          </section>
        )}
      </div>

      {/* 2. 浮遊する保存ボタン（右下） */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        <button
          onClick={handleFinalSave}
          style={{ 
            padding: '18px 35px', background: '#2563eb', color: '#fff', 
            border: 'none', borderRadius: '40px', fontWeight: 'bold', fontSize: '1.1rem',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}
        >
          <span>設定を保存する</span>
          <span style={{ fontSize: '1.2rem' }}>💾</span>
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;