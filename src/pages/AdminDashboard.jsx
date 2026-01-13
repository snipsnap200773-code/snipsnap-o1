import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminDashboard() {
  const { shopId } = useParams();
  
  // --- セキュリティ用State ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // 共通State
  const [activeTab, setActiveTab] = useState('menu'); 
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
  const [imageUrl, setImageUrl] = useState('');

  // 店舗名・オーナー・業種情報State
  const [businessName, setBusinessName] = useState('');
  const [businessNameKana, setBusinessNameKana] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerNameKana, setOwnerNameKana] = useState('');
  const [businessType, setBusinessType] = useState('');

  // 外部URL用State
  const [officialUrl, setOfficialUrl] = useState('');
  const [lineOfficialUrl, setLineOfficialUrl] = useState('');

  // LINE通知設定・連携用State
  const [notifyLineEnabled, setNotifyLineEnabled] = useState(true);
  const [lineToken, setLineToken] = useState('');
  const [lineAdminId, setLineAdminId] = useState('');

  // 詳細予約ルールState
  const [slotIntervalMin, setSlotIntervalMin] = useState(15); 
  const [bufferPreparationMin, setBufferPreparationMin] = useState(0); 
  const [minLeadTimeHours, setMinLeadTimeHours] = useState(0); 
  const [autoFillLogic, setAutoFillLogic] = useState(true); 

  const dayMap = {
    mon: '月曜日', tue: '火曜日', wed: '水曜日', thu: '木曜日',
    fri: '金曜日', sat: '土曜日', sun: '日曜日'
  };

  // 💡 コピペ用ヘルパー
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showMsg('コピーしました！');
  };

  useEffect(() => {
    fetchInitialShopData();
  }, [shopId]);

  const fetchInitialShopData = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (data) {
      setShopData(data);
      setAllowMultiple(data.allow_multiple_services);
      setPhone(data.phone || '');
      setEmailContact(data.email_contact || '');
      setAddress(data.address || '');
      setDescription(data.description || '');
      setNotes(data.notes || '');
      setBusinessHours(data.business_hours || {});
      setMaxLastSlots(data.max_last_slots || 2);
      setSlotIntervalMin(data.slot_interval_min || 15);
      setBufferPreparationMin(data.buffer_preparation_min || 0);
      setMinLeadTimeHours(data.min_lead_time_hours || 0);
      setAutoFillLogic(data.auto_fill_logic ?? true);
      setImageUrl(data.image_url || '');
      setOfficialUrl(data.official_url || '');
      setLineOfficialUrl(data.line_official_url || '');
      setNotifyLineEnabled(data.notify_line_enabled ?? true);
      setBusinessName(data.business_name || '');
      setBusinessNameKana(data.business_name_kana || '');
      setOwnerName(data.owner_name || '');
      setOwnerNameKana(data.owner_name_kana || '');
      setBusinessType(data.business_type || '');
      setLineToken(data.line_channel_access_token || '');
      setLineAdminId(data.line_admin_user_id || '');
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchMenuDetails();
    }
  }, [isAuthorized]);

  const fetchMenuDetails = async () => {
    const catRes = await supabase.from('service_categories').select('*').eq('shop_id', shopId).order('sort_order', { ascending: true });
    const servRes = await supabase.from('services').select('*').eq('shop_id', shopId).order('sort_order', { ascending: true });
    const optRes = await supabase.from('service_options').select('*'); 

    if (catRes.data) {
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !selectedCategory) setSelectedCategory(catRes.data[0].name);
    }
    if (servRes.data) setServices(servRes.data);
    if (optRes.data) setOptions(optRes.data);
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (passwordInput === shopData?.admin_password) {
      setIsAuthorized(true);
    } else {
      alert("パスワードが違います");
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
        business_name: businessName,
        business_name_kana: businessNameKana,
        phone, email_contact: emailContact, address, description, notes, business_hours: businessHours,
        allow_multiple_services: allowMultiple, max_last_slots: maxLastSlots,
        slot_interval_min: slotIntervalMin, buffer_preparation_min: bufferPreparationMin,
        min_lead_time_hours: minLeadTimeHours, auto_fill_logic: autoFillLogic,
        image_url: imageUrl,
        official_url: officialUrl, 
        line_official_url: lineOfficialUrl,
        notify_line_enabled: notifyLineEnabled,
        owner_name: ownerName,
        owner_name_kana: ownerNameKana,
        business_type: businessType,
        line_channel_access_token: lineToken,
        line_admin_user_id: lineAdminId
      })
      .eq('id', shopId);

    if (!error) showMsg('すべての設定を保存しました！');
    else alert('保存に失敗しました。');
  };

  const moveItem = async (type, list, id, direction) => {
    const idx = list.findIndex(item => item.id === id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const newList = [...list];
    const [moved] = newList.splice(idx, 1);
    newList.splice(targetIdx, 0, moved);

    const table = type === 'category' ? 'service_categories' : 'services';
    const updates = newList.map((item, i) => ({
      id: item.id, shop_id: shopId, sort_order: i, name: item.name,
      ...(type === 'service' ? { slots: item.slots, category: item.category } : {})
    }));
    const { error } = await supabase.from(table).upsert(updates);
    if (!error) fetchMenuDetails();
  };

  const handleToggleDisableCat = async (catId, targetCatName) => {
    const targetCat = categories.find(c => c.id === catId);
    let currentDisables = targetCat.disable_categories ? targetCat.disable_categories.split(',').map(s => s.trim()).filter(s => s) : [];
    if (currentDisables.includes(targetCatName)) currentDisables = currentDisables.filter(name => name !== targetCatName);
    else currentDisables.push(targetCatName);
    await supabase.from('service_categories').update({ disable_categories: currentDisables.join(',') }).eq('id', catId);
    fetchMenuDetails();
  };

  const handleToggleRequiredCat = async (catId, targetCatName) => {
    const targetCat = categories.find(c => c.id === catId);
    let currentRequired = targetCat.required_categories ? targetCat.required_categories.split(',').map(s => s.trim()).filter(s => s) : [];
    if (currentRequired.includes(targetCatName)) currentRequired = currentRequired.filter(name => name !== targetCatName);
    else currentRequired.push(targetCatName);
    await supabase.from('service_categories').update({ required_categories: currentRequired.join(',') }).eq('id', catId);
    fetchMenuDetails();
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (editingCategoryId) await supabase.from('service_categories').update({ name: newCategoryName }).eq('id', editingCategoryId);
    else await supabase.from('service_categories').insert([{ shop_id: shopId, name: newCategoryName, sort_order: categories.length }]);
    setEditingCategoryId(null); setNewCategoryName(''); fetchMenuDetails();
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = selectedCategory || (categories[0]?.name || 'その他');
    const serviceData = { shop_id: shopId, name: newServiceName, slots: newServiceSlots, category: finalCategory };
    if (editingServiceId) await supabase.from('services').update(serviceData).eq('id', editingServiceId);
    else await supabase.from('services').insert([{ ...serviceData, sort_order: services.length }]);
    setEditingServiceId(null); setNewServiceName(''); setNewServiceSlots(1); fetchMenuDetails();
  };

  const handleOptionSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('service_options').insert([{ service_id: activeServiceForOptions.id, group_name: optGroupName, option_name: optName, additional_slots: optSlots }]);
    setOptName(''); setOptSlots(0); fetchMenuDetails();
  };

  const deleteCategory = async (id) => { if (window.confirm(`削除しますか？`)) { await supabase.from('service_categories').delete().eq('id', id); fetchMenuDetails(); } };
  const deleteService = async (id) => { if (window.confirm('削除しますか？')) { await supabase.from('services').delete().eq('id', id); fetchMenuDetails(); } };
  const deleteOption = async (id) => { await supabase.from('service_options').delete().eq('id', id); fetchMenuDetails(); };

  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleAuth} style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', width: '90%', maxWidth: '350px' }}>
          <h2 style={{ marginBottom: '10px' }}>管理者認証 🔒</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '25px' }}>設定を変更するには合言葉を入力してください</p>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="パスワードを入力" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '20px', boxSizing: 'border-box', textAlign: 'center', fontSize: '1.1rem' }} />
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ログイン</button>
          <Link to="/" style={{ display: 'block', marginTop: '20px', fontSize: '0.8rem', color: '#666', textDecoration: 'none' }}>ポータルへ戻る</Link>
        </form>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto', paddingBottom: '120px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #eee', padding: '10px' }}>
        {/* 💡 修正：ヘッダーボタンを撤去し、タブのみの構成に */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {['menu', 'hours', 'info'].map(tab => (
            <button key={tab} onClick={() => changeTab(tab)} style={{ flex: 1, padding: '12px 5px', border: 'none', borderRadius: '8px', background: activeTab === tab ? '#2563eb' : '#f1f5f9', color: activeTab === tab ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {tab === 'menu' ? 'メニュー' : tab === 'hours' ? '営業時間' : '店舗情報'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '15px' }}>
        {message && <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', width: '90%', padding: '15px', background: '#dcfce7', color: '#166534', borderRadius: '8px', zIndex: 1001, textAlign: 'center' }}>{message}</div>}

        {/* --- メニュータブ (内容維持) --- */}
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
                <button type="submit" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px' }}>確定</button>
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
                      <button onClick={async () => {
                        const { error } = await supabase.from('service_categories').update({ allow_multiple_in_category: !c.allow_multiple_in_category }).eq('id', c.id);
                        if (!error) fetchMenuDetails();
                      }} style={{ fontSize: '0.7rem', padding: '4px 8px', background: c.allow_multiple_in_category ? '#2563eb' : '#fff', color: c.allow_multiple_in_category ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: '15px' }}>
                        {c.allow_multiple_in_category ? '複数選択可' : '1つのみ選択'}
                      </button>
                      <button onClick={() => setEditingDisableCatId(editingDisableCatId === c.id ? null : c.id)} style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '15px' }}>🔗 連動設定</button>
                    </div>
                    {editingDisableCatId === c.id && (
                      <div style={{ marginTop: '10px', padding: '15px', background: '#fff', borderRadius: '12px', border: '1px solid #2563eb' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', color: '#ef4444' }}>🚫 選択時に無効化するカテゴリ：</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                          {categories.filter(target => target.id !== c.id).map(target => {
                            const isSelected = c.disable_categories?.split(',').includes(target.name);
                            return <button key={target.id} onClick={() => handleToggleDisableCat(c.id, target.name)} style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '15px', border: '1px solid', borderColor: isSelected ? '#ef4444' : '#ccc', background: isSelected ? '#fee2e2' : '#fff', color: isSelected ? '#ef4444' : '#666' }}>{isSelected ? '✕ ' : '+ '} {target.name}</button>
                          })}
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', color: '#2563eb' }}>✅ 選択時に必須となるカテゴリ：</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {categories.filter(target => target.id !== c.id).map(target => {
                            const isSelected = c.required_categories?.split(',').includes(target.name);
                            return <button key={target.id} onClick={() => handleToggleRequiredCat(c.id, target.name)} style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '15px', border: '1px solid', borderColor: isSelected ? '#2563eb' : '#ccc', background: isSelected ? '#dbeafe' : '#fff', color: isSelected ? '#2563eb' : '#666' }}>{isSelected ? '✕ ' : '+ '} {target.name}</button>
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
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => <button key={n} type="button" onClick={() => setNewServiceSlots(n)} style={{ flex: 1, padding: '12px 0', borderRadius: '8px', border: '1px solid', borderColor: newServiceSlots === n ? '#2563eb' : '#ccc', background: newServiceSlots === n ? '#2563eb' : 'white', color: newServiceSlots === n ? 'white' : '#333', fontWeight: 'bold', fontSize: '0.75rem' }}>{n}</button>)}
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', padding: '15px', background: editingServiceId ? '#f97316' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>メニューを保存</button>
              </form>
            </section>
            {categories.map((cat) => (
              <div key={cat.id} style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '10px', borderLeft: '4px solid #cbd5e1', paddingLeft: '8px' }}>{cat.name}</h4>
                {services.filter(s => s.category === cat.name).map((s, idxInCat) => (
                  <div key={s.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', marginBottom: '10px' }}>
                    <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>{s.slots * slotIntervalMin}分 ({s.slots}コマ)</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <button onClick={() => moveItem('service', services, s.id, 'up')} disabled={idxInCat === 0}>▲</button>
                          <button onClick={() => moveItem('service', services, s.id, 'down')} disabled={idxInCat === services.filter(ser => ser.category === cat.name).length - 1}>▼</button>
                        </div>
                        <button onClick={() => setActiveServiceForOptions(activeServiceForOptions?.id === s.id ? null : s)}>枝</button>
                        <button onClick={() => {setEditingServiceId(s.id); setNewServiceName(s.name); setNewServiceSlots(s.slots); setSelectedCategory(s.category);}}>✎</button>
                        <button onClick={() => deleteService(s.id)}>×</button>
                      </div>
                    </div>
                    {activeServiceForOptions?.id === s.id && (
                      <div style={{ padding: '15px', borderTop: '1px solid #eee', background: '#f9fafb' }}>
                        <form onSubmit={handleOptionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', gap: 8 }}><input placeholder="グループ名" value={optGroupName} onChange={(e) => setOptGroupName(e.target.value)} required /><input placeholder="名称" value={optName} onChange={(e) => setOptName(e.target.value)} required /></div>
                          <div style={{ display: 'flex', gap: 8 }}><input type="number" value={optSlots} onChange={(e) => setOptSlots(parseInt(e.target.value))} min="0" /><button type="submit">追加</button></div>
                        </form>
                        {options.filter(o => o.service_id === s.id).map(o => (<div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '0.8rem' }}><span>{o.group_name}: {o.option_name} (+{o.additional_slots * slotIntervalMin}分)</span><button onClick={() => deleteOption(o.id)}>削除</button></div>))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* --- 営業時間タブ (内容維持) --- */}
        {activeTab === 'hours' && (
          <div>
            <section style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '2px solid #2563eb', marginBottom: '25px' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#2563eb' }}>⚙️ 詳細予約エンジンの設定</h3>
              <div style={{ marginBottom: '20px' }}><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1コマの単位</label><div style={{ display: 'flex', gap: '10px' }}>{[15, 30].map(min => (<button key={min} onClick={() => setSlotIntervalMin(min)} style={{ flex: 1, padding: '10px', background: slotIntervalMin === min ? '#2563eb' : '#fff', color: slotIntervalMin === min ? '#fff' : '#333', border: '1px solid #ccc' }}>{min}分</button>))}</div></div>
              <div style={{ marginBottom: '20px' }}><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>準備時間（インターバル）</label><select value={bufferPreparationMin} onChange={(e) => setBufferPreparationMin(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}><option value={0}>なし</option><option value={15}>15分</option><option value={30}>30分</option></select></div>
              <div style={{ marginBottom: '20px' }}><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>当日予約の制限</label><select value={minLeadTimeHours} onChange={(e) => setMinLeadTimeHours(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}><option value={0}>制限なし</option><option value={1}>1時間後</option><option value={3}>3時間後</option><option value={24}>前日まで</option></select></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><input type="checkbox" checked={autoFillLogic} onChange={(e) => setAutoFillLogic(e.target.checked)} style={{ width: '20px', height: '20px' }} /><b>自動詰め機能を有効にする</b></label>
            </section>
            
            <section style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd' }}>
              <h3 style={{ marginTop: 0 }}>⏰ 基本営業時間</h3>
              {Object.keys(dayMap).map(day => (
                <div key={day} style={{ borderBottom: '1px solid #f1f5f9', padding: '15px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: '1rem' }}>{dayMap[day]}</b>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!businessHours[day]?.is_closed} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], is_closed: !e.target.checked}})} style={{ width: '18px', height: '18px' }} />
                      {businessHours[day]?.is_closed ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>定休日</span> : '営業中'}
                    </label>
                  </div>
                  {!businessHours[day]?.is_closed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 15, padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.85rem', width: '40px' }}>営業</span>
                        <input type="time" value={businessHours[day]?.open || '09:00'} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], open: e.target.value}})} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <span>〜</span>
                        <input type="time" value={businessHours[day]?.close || '18:00'} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], close: e.target.value}})} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.85rem', width: '40px' }}>休憩</span>
                        <input type="time" value={businessHours[day]?.rest_start || ''} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], rest_start: e.target.value}})} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <span>〜</span>
                        <input type="time" value={businessHours[day]?.rest_end || ''} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], rest_end: e.target.value}})} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>
        )}

        {/* --- 💡 店舗情報タブ (大幅アップデート) --- */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 🆕 各種URL案内ボックス (image_12802c.png 形式) */}
            <section style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    🔑 店舗主用設定 (PW: {shopData?.admin_password})
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <input readOnly value={`${window.location.origin}/admin/${shopId}`} style={{ flex: 1, padding: '10px', fontSize: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <button onClick={() => copyToClipboard(`${window.location.origin}/admin/${shopId}`)} style={{ padding: '10px 15px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #2563eb', color: '#2563eb', background: '#fff', fontWeight: 'bold' }}>コピー</button>
                    <a href={`${window.location.origin}/admin/${shopId}`} target="_blank" rel="noreferrer" style={{ padding: '10px 15px', fontSize: '0.8rem', borderRadius: '8px', background: '#2563eb', color: '#fff', textDecoration: 'none', textAlign: 'center', fontWeight: 'bold' }}>開く</a>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#00b900', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    💬 LINEリッチメニュー用URL
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <input readOnly value={`${window.location.origin}/shop/${shopId}/reserve?source=line`} style={{ flex: 1, padding: '10px', fontSize: '0.8rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }} />
                    <button onClick={() => copyToClipboard(`${window.location.origin}/shop/${shopId}/reserve?source=line`)} style={{ padding: '10px 15px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #00b900', color: '#00b900', background: '#fff', fontWeight: 'bold' }}>コピー</button>
                    <a href={`${window.location.origin}/shop/${shopId}/reserve?source=line`} target="_blank" rel="noreferrer" style={{ padding: '10px 15px', fontSize: '0.8rem', borderRadius: '8px', background: '#00b900', color: '#fff', textDecoration: 'none', textAlign: 'center', fontWeight: 'bold' }}>開く</a>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    📅 お客様用予約（一般Web用）
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <input readOnly value={`${window.location.origin}/shop/${shopId}/reserve`} style={{ flex: 1, padding: '10px', fontSize: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <button onClick={() => copyToClipboard(`${window.location.origin}/shop/${shopId}/reserve`)} style={{ padding: '10px 15px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #059669', color: '#059669', background: '#fff', fontWeight: 'bold' }}>コピー</button>
                    <a href={`${window.location.origin}/shop/${shopId}/reserve`} target="_blank" rel="noreferrer" style={{ padding: '10px 15px', fontSize: '0.8rem', borderRadius: '8px', background: '#059669', color: '#fff', textDecoration: 'none', textAlign: 'center', fontWeight: 'bold' }}>開く</a>
                  </div>
                </div>
              </div>
            </section>

            {/* 🏪 店舗プロフィールの設定 */}
            <section style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd' }}>
              <h3 style={{ marginTop: 0 }}>🏪 店舗プロフィールの設定</h3>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>店舗名</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="店舗名" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <input value={businessNameKana} onChange={(e) => setBusinessNameKana(e.target.value)} placeholder="店舗名のふりがな" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>代表者名</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="氏名" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <input value={ownerNameKana} onChange={(e) => setOwnerNameKana(e.target.value)} placeholder="ふりがな" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>業種</label>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                  <option value="">-- 業種を選択 --</option>
                  <option value="美容室・理容室">美容室・理容室</option>
                  <option value="ネイル・アイラッシュ">ネイル・アイラッシュ</option>
                  <option value="エステ・リラク">エステ・リラク</option>
                  <option value="整体・接骨院">整体・接骨院</option>
                  <option value="飲食店">飲食店</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>店舗画像URL</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', marginBottom: 20, borderRadius: '6px', border: '1px solid #ddd' }} />
              
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#2563eb', display: 'block', marginBottom: '5px' }}>🌐 オフィシャルサイト URL</label>
                <input type="url" value={officialUrl} onChange={(e) => setOfficialUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00b900', display: 'block', marginBottom: '5px' }}>💬 LINE予約・公式アカウント URL</label>
                <input type="url" value={lineOfficialUrl} onChange={(e) => setLineOfficialUrl(e.target.value)} placeholder="https://line.ee/..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px' }}>※URLを入力するとホーム画面にボタンが表示されます</p>
              </div>

              <label>店舗の説明</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', minHeight: 100, marginBottom: 20, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              <label>住所</label><input value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: '100%', marginBottom: 20, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              <label>電話番号</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', marginBottom: 20, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              <label>メール</label><input type="email" value={emailContact} onChange={(e) => setEmailContact(e.target.value)} style={{ width: '100%', marginBottom: 20, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              <label>注意事項</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', border: '2px solid #ef4444', padding: '10px', borderRadius: '6px' }} />
            </section>

            {/* 💬 LINE公式アカウント連携ガイド (動的構成) */}
            <section style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #00b900' }}>
              <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#00b900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>💬</span> LINE公式アカウント連携ガイド
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {[
                  { step: '1', title: '公式アカウントの作成', desc: 'LINE公式アカウントマネージャーからアカウントを開設します。' },
                  { step: '2', title: 'Messaging APIの有効化', desc: '設定 ＞ Messaging API から「APIを利用する」を有効にします。' },
                  { step: '3', title: 'アクセストークンの取得', desc: 'LINE Developersにて「チャネルアクセストークン」を発行します。' },
                  { step: '4', title: 'ユーザーIDの確認', desc: 'LINE Developersの基本設定にて、店長様の「ユーザーID(U...)」を確認します。' },
                  { step: '5', title: '設定画面への入力', desc: '取得したトークンとIDを下の「LINE通知設定」欄に入力して保存します。' },
                  { step: '6', title: 'リッチメニューの設定', desc: 'LINEのリッチメニューに下の【LINEリッチメニュー専用】予約URLを貼り付けて完了です！' }
                ].map((item) => (
                  <React.Fragment key={item.step}>
                    <div style={{ display: 'flex', gap: '15px', padding: '15px', background: '#f0fdf4', borderRadius: '10px' }}>
                      <div style={{ width: '28px', height: '28px', background: '#00b900', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 }}>{item.step}</div>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#166534' }}>{item.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#4b5563', lineHeight: '1.4' }}>{item.desc}</p>
                      </div>
                    </div>
                    
                    {/* 💡 ⑤番の直下に LINE通知設定入力枠 (image_12932b.png 形式) */}
                    {item.step === '5' && (
                      <div style={{ marginLeft: '43px', marginBottom: '10px', background: '#f0fdf4', padding: '15px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '15px' }}>
                          <input type="checkbox" checked={notifyLineEnabled} onChange={(e) => setNotifyLineEnabled(e.target.checked)} style={{ width: '22px', height: '22px' }} />
                          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#166534' }}>📢 新着予約のLINE通知を受け取る</span>
                        </label>
                        <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: '10px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#15803d', display: 'block', marginBottom: '5px' }}>💬 LINE Channel Access Token</label>
                          <input type="password" value={lineToken} onChange={(e) => setLineToken(e.target.value)} placeholder="アクセストークンを貼り付け" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '10px' }} />
                          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#15803d', display: 'block', marginBottom: '5px' }}>🆔 通知先 LINE User ID (U...)</label>
                          <input value={lineAdminId} onChange={(e) => setLineAdminId(e.target.value)} placeholder="Uxxxxxxxx..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0' }} />
                        </div>
                      </div>
                    )}

                    {/* 💡 ⑥番の直下に 爆速URL表示枠 (image_1296ea.png 形式) */}
                    {item.step === '6' && (
                      <div style={{ marginLeft: '43px', marginTop: '-5px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#166534', marginBottom: '5px' }}>【LINEリッチメニュー専用】（読込が爆速になります）</p>
                        <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', overflow: 'hidden' }}>
                          <code style={{ fontSize: '0.75rem', color: '#2563eb', wordBreak: 'break-all', display: 'block' }}>
                            {`${window.location.origin}/shop/${shopId}/reserve?openExternalBrowser=1`}
                          </code>
                          <button onClick={() => copyToClipboard(`${window.location.origin}/shop/${shopId}/reserve?openExternalBrowser=1`)} style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.7rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', cursor: 'pointer' }}>
                            このURLをコピーする
                          </button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        <button onClick={handleFinalSave} style={{ padding: '18px 35px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '40px', fontWeight: 'bold', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)' }}>
          設定を保存する 💾
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;