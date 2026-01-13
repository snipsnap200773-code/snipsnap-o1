import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminDashboard() {
  const { shopId } = useParams();
  
  // --- 1. セキュリティ用State ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // --- 2. 共通State ---
  const [activeTab, setActiveTab] = useState('menu'); 
  const [message, setMessage] = useState('');
  const [shopData, setShopData] = useState(null);

  // --- 3. メニュー設定用State (多段枝対応) ---
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
  const [optGroupName, setOptGroupName] = useState(''); // 枝カテゴリ（例：ブリーチ）
  const [optName, setOptName] = useState('');           // 枝メニュー名（例：1回）
  const [optSlots, setOptSlots] = useState(0);
  const [editingDisableCatId, setEditingDisableCatId] = useState(null);

  // --- 4. 営業時間・店舗情報用State ---
  const [phone, setPhone] = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [address, setAddress] = useState(''); 
  const [description, setDescription] = useState(''); 
  const [notes, setNotes] = useState(''); 
  const [businessHours, setBusinessHours] = useState({});
  const [maxLastSlots, setMaxLastSlots] = useState(2);
  const [imageUrl, setImageUrl] = useState(''); // 店舗画像URL (復活)

  // 店舗名・オーナー・業種
  const [businessName, setBusinessName] = useState('');
  const [businessNameKana, setBusinessNameKana] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerNameKana, setOwnerNameKana] = useState('');
  const [businessType, setBusinessType] = useState('');

  // 外部URL・LINE
  const [officialUrl, setOfficialUrl] = useState('');
  const [lineOfficialUrl, setLineOfficialUrl] = useState('');
  const [notifyLineEnabled, setNotifyLineEnabled] = useState(true);
  const [lineToken, setLineToken] = useState('');
  const [lineAdminId, setLineAdminId] = useState('');

  // 詳細予約ルール
  const [slotIntervalMin, setSlotIntervalMin] = useState(15); 
  const [bufferPreparationMin, setBufferPreparationMin] = useState(0); 
  const [minLeadTimeHours, setMinLeadTimeHours] = useState(0); 
  const [autoFillLogic, setAutoFillLogic] = useState(true); 

  const dayMap = { mon: '月曜日', tue: '火曜日', wed: '水曜日', thu: '木曜日', fri: '金曜日', sat: '土曜日', sun: '日曜日' };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showMsg('コピーしました！');
  };

  useEffect(() => { fetchInitialShopData(); }, [shopId]);

  const fetchInitialShopData = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (data) {
      setShopData(data); setAllowMultiple(data.allow_multiple_services); setPhone(data.phone || '');
      setEmailContact(data.email_contact || ''); setAddress(data.address || ''); setDescription(data.description || '');
      setNotes(data.notes || ''); setBusinessHours(data.business_hours || {}); setMaxLastSlots(data.max_last_slots || 2);
      setSlotIntervalMin(data.slot_interval_min || 15); setBufferPreparationMin(data.buffer_preparation_min || 0);
      setMinLeadTimeHours(data.min_lead_time_hours || 0); setAutoFillLogic(data.auto_fill_logic ?? true);
      setImageUrl(data.image_url || ''); setOfficialUrl(data.official_url || ''); setLineOfficialUrl(data.line_official_url || '');
      setNotifyLineEnabled(data.notify_line_enabled ?? true); setBusinessName(data.business_name || '');
      setBusinessNameKana(data.business_name_kana || ''); setOwnerName(data.owner_name || '');
      setOwnerNameKana(data.owner_name_kana || ''); setBusinessType(data.business_type || '');
      setLineToken(data.line_channel_access_token || ''); setLineAdminId(data.line_admin_user_id || '');
    }
  };

  useEffect(() => { if (isAuthorized) fetchMenuDetails(); }, [isAuthorized]);

  const fetchMenuDetails = async () => {
    const catRes = await supabase.from('service_categories').select('*').eq('shop_id', shopId).order('sort_order', { ascending: true });
    const servRes = await supabase.from('services').select('*').eq('shop_id', shopId).order('sort_order', { ascending: true });
    const optRes = await supabase.from('service_options').select('*'); 
    if (catRes.data) setCategories(catRes.data);
    if (servRes.data) setServices(servRes.data);
    if (optRes.data) setOptions(optRes.data);
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (passwordInput === shopData?.admin_password) setIsAuthorized(true);
    else alert("パスワードが違います");
  };

  const showMsg = (txt) => { setMessage(txt); setTimeout(() => setMessage(''), 3000); };

  const changeTab = (tabName) => { setActiveTab(tabName); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleFinalSave = async () => {
    const { error } = await supabase.from('profiles').update({
        business_name: businessName, business_name_kana: businessNameKana,
        phone, email_contact: emailContact, address, description, notes, business_hours: businessHours,
        allow_multiple_services: allowMultiple, max_last_slots: maxLastSlots,
        slot_interval_min: slotIntervalMin, buffer_preparation_min: bufferPreparationMin,
        min_lead_time_hours: minLeadTimeHours, auto_fill_logic: autoFillLogic,
        image_url: imageUrl, official_url: officialUrl, line_official_url: lineOfficialUrl,
        notify_line_enabled: notifyLineEnabled, owner_name: ownerName, owner_name_kana: ownerNameKana,
        business_type: businessType, line_channel_access_token: lineToken, line_admin_user_id: lineAdminId
      }).eq('id', shopId);
    if (!error) showMsg('すべての設定を保存しました！');
    else alert('保存に失敗しました。');
  };

  const moveItem = async (type, list, id, direction) => {
    const idx = list.findIndex(item => item.id === id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const newList = [...list]; const [moved] = newList.splice(idx, 1); newList.splice(targetIdx, 0, moved);
    const table = type === 'category' ? 'service_categories' : 'services';
    const updates = newList.map((item, i) => ({ id: item.id, shop_id: shopId, sort_order: i, name: item.name, ...(type === 'service' ? { slots: item.slots, category: item.category } : {}) }));
    await supabase.from(table).upsert(updates); fetchMenuDetails();
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
        <form onSubmit={handleAuth} style={{ background: '#fff', padding: '40px', borderRadius: '20px', textAlign: 'center', width: '90%', maxWidth: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
          <h2>管理者認証 🔒</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '25px' }}>設定を変更するには合言葉を入力してください</p>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="パスワードを入力" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '20px', boxSizing: 'border-box', textAlign: 'center', fontSize: '1.1rem' }} />
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>ログイン</button>
          <Link to="/" style={{ display: 'block', marginTop: '20px', fontSize: '0.8rem', color: '#666', textDecoration: 'none' }}>ポータルへ戻る</Link>
        </form>
      </div>
    );
  }

  // 💡 スマホ最適化スタイル：はみ出しと余白のちぐはぐを根絶
  const cardStyle = { marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', boxSizing: 'border-box', width: '100%', overflow: 'hidden' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '1rem', background: '#fff' };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto', paddingBottom: '120px', boxSizing: 'border-box', width: '100%' }}>
      {/* 🚀 タブヘッダー */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #eee', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['menu', 'hours', 'info'].map(tab => (
            <button key={tab} onClick={() => changeTab(tab)} style={{ flex: 1, padding: '12px 5px', border: 'none', borderRadius: '8px', background: activeTab === tab ? '#2563eb' : '#f1f5f9', color: activeTab === tab ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {tab === 'menu' ? 'メニュー' : tab === 'hours' ? '営業時間' : '店舗情報'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '15px', boxSizing: 'border-box', width: '100%' }}>
        {message && <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', width: '90%', padding: '15px', background: '#dcfce7', color: '#166534', borderRadius: '8px', zIndex: 1001, textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>{message}</div>}

        {/* --- 🛠️ メニュータブ --- */}
        {activeTab === 'menu' && (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <section style={{ ...cardStyle, border: '1px solid #2563eb' }}>
              <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: '#2563eb' }}>🛡️ 予約ルール</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} style={{ width: '22px', height: '22px' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>メニューの複数選択を許可する</span>
              </label>
            </section>

            <section style={cardStyle}>
              <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>📂 カテゴリ設定</h3>
              <form onSubmit={handleCategorySubmit} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <input placeholder="カテゴリ名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ ...inputStyle, flex: 1 }} required />
                <button type="submit" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px' }}>確定</button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categories.map((c, idx) => (
                  <div key={c.id} style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e5e7eb', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => moveItem('category', categories, c.id, 'up')} disabled={idx === 0}>▲</button>
                        <button onClick={() => moveItem('category', categories, c.id, 'down')} disabled={idx === categories.length - 1}>▼</button>
                        <button onClick={() => {setEditingCategoryId(c.id); setNewCategoryName(c.name);}}>✎</button>
                        <button onClick={() => deleteCategory(c.id)}>×</button>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={async () => {
                        await supabase.from('service_categories').update({ allow_multiple_in_category: !c.allow_multiple_in_category }).eq('id', c.id);
                        fetchMenuDetails();
                      }} style={{ fontSize: '0.7rem', padding: '4px 8px', background: c.allow_multiple_in_category ? '#2563eb' : '#fff', color: c.allow_multiple_in_category ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: '15px' }}>
                        {c.allow_multiple_in_category ? '複数選択可' : '1つのみ選択'}
                      </button>
                      <button onClick={() => setEditingDisableCatId(editingDisableCatId === c.id ? null : c.id)} style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '15px' }}>🔗 連動設定</button>
                    </div>
                    {editingDisableCatId === c.id && (
                      <div style={{ marginTop: '10px', padding: '12px', background: '#fff', borderRadius: '12px', border: '1px solid #2563eb' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', color: '#ef4444' }}>🚫 選択時に無効化するカテゴリ：</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                          {categories.filter(t => t.id !== c.id).map(t => {
                            const isSelected = c.disable_categories?.split(',').includes(t.name);
                            return <button key={t.id} onClick={() => handleToggleDisableCat(c.id, t.name)} style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '15px', border: '1px solid', borderColor: isSelected ? '#ef4444' : '#ccc', background: isSelected ? '#fee2e2' : '#fff', color: isSelected ? '#ef4444' : '#666' }}>{t.name}</button>
                          })}
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', color: '#2563eb' }}>✅ 選択時に必須となるカテゴリ：</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {categories.filter(t => t.id !== c.id).map(t => {
                            const isSelected = c.required_categories?.split(',').includes(t.name);
                            return <button key={t.id} onClick={() => handleToggleRequiredCat(c.id, t.name)} style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '15px', border: '1px solid', borderColor: isSelected ? '#2563eb' : '#ccc', background: isSelected ? '#dbeafe' : '#fff', color: isSelected ? '#2563eb' : '#666' }}>{t.name}</button>
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...cardStyle, background: '#f8fafc' }}><h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>📝 メニュー登録・編集</h3>
              <form onSubmit={handleServiceSubmit}>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} required>
                  <option value="">-- カテゴリ選択 --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} placeholder="メニュー名" required />
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>必要コマ数: <span style={{ color: '#2563eb' }}>{newServiceSlots}コマ ({newServiceSlots * slotIntervalMin}分)</span></label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => <button key={n} type="button" onClick={() => setNewServiceSlots(n)} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid', borderColor: newServiceSlots === n ? '#2563eb' : '#ccc', background: newServiceSlots === n ? '#2563eb' : 'white', color: newServiceSlots === n ? 'white' : '#333', fontWeight: 'bold' }}>{n}</button>)}
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', padding: '15px', background: editingServiceId ? '#f97316' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>メニューを保存</button>
              </form>
            </section>

            {categories.map((cat) => (
              <div key={cat.id} style={{ marginBottom: '25px', width: '100%', boxSizing: 'border-box' }}>
                <h4 style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '10px', borderLeft: '4px solid #cbd5e1', paddingLeft: '8px' }}>{cat.name}</h4>
                {services.filter(s => s.category === cat.name).map((s, idxInCat) => (
                  <div key={s.id} style={{ ...cardStyle, marginBottom: '10px', padding: '12px 15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>{s.slots * slotIntervalMin}分 ({s.slots}コマ)</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <button onClick={() => moveItem('service', services.filter(ser => ser.category === cat.name), s.id, 'up')} disabled={idxInCat === 0} style={{ border: 'none', background: 'none' }}>▲</button>
                          <button onClick={() => moveItem('service', services.filter(ser => ser.category === cat.name), s.id, 'down')} disabled={idxInCat === services.filter(ser => ser.category === cat.name).length - 1} style={{ border: 'none', background: 'none' }}>▼</button>
                        </div>
                        <button onClick={() => setActiveServiceForOptions(activeServiceForOptions?.id === s.id ? null : s)}>枝</button>
                        <button onClick={() => {setEditingServiceId(s.id); setNewServiceName(s.name); setNewServiceSlots(s.slots); setSelectedCategory(s.category);}}>✎</button>
                        <button onClick={() => deleteService(s.id)}>×</button>
                      </div>
                    </div>
                    {/* 💡 多段枝分かれ設定エリア (修正完了版) */}
                    {activeServiceForOptions?.id === s.id && (
                      <div style={{ marginTop: '15px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #eee' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>🌿 枝分かれ（条件分岐）の設定</p>
                        <form onSubmit={handleOptionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                          <input placeholder="枝カテゴリ名（例：ブリーチ）" value={optGroupName} onChange={(e) => setOptGroupName(e.target.value)} style={inputStyle} />
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <input placeholder="選択メニュー名（例：1回）" value={optName} onChange={(e) => setOptName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                            <input type="number" value={optSlots} onChange={(e) => setOptSlots(parseInt(e.target.value))} style={{ width: '60px', ...inputStyle }} />
                            <button type="submit" style={{ padding: '0 15px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px' }}>＋</button>
                          </div>
                        </form>
                        {Array.from(new Set(options.filter(o => o.service_id === s.id).map(o => o.group_name))).map(group => (
                          <div key={group} style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>▼ {group || '共通枝'}</div>
                            {options.filter(o => o.service_id === s.id && o.group_name === group).map(o => (
                              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '5px 8px', background: '#fff', borderRadius: '6px', border: '1px solid #eee', marginBottom: '3px' }}>
                                <span>{o.option_name} (+{o.additional_slots}コマ)</span>
                                <button onClick={() => deleteOption(o.id)} style={{ color: '#ef4444', border: 'none', background: 'none' }}>×</button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* --- ⏰ 営業時間タブ --- */}
        {activeTab === 'hours' && (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <section style={{ ...cardStyle, border: '2px solid #2563eb' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#2563eb' }}>⚙️ 詳細予約エンジンの設定</h3>
              <div style={{ marginBottom: '20px' }}><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1コマの単位</label><div style={{ display: 'flex', gap: '10px' }}>{[15, 30].map(min => (<button key={min} onClick={() => setSlotIntervalMin(min)} style={{ flex: 1, padding: '10px', background: slotIntervalMin === min ? '#2563eb' : '#fff', color: slotIntervalMin === min ? '#fff' : '#333', border: '1px solid #ccc' }}>{min}分</button>))}</div></div>
              <div style={{ marginBottom: '20px' }}><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>準備時間（インターバル）</label><select value={bufferPreparationMin} onChange={(e) => setBufferPreparationMin(parseInt(e.target.value))} style={inputStyle}><option value={0}>なし</option><option value={15}>15分</option><option value={30}>30分</option></select></div>
              <div style={{ marginBottom: '20px' }}><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>当日予約の制限</label><select value={minLeadTimeHours} onChange={(e) => setMinLeadTimeHours(parseInt(e.target.value))} style={inputStyle}><option value={0}>制限なし</option><option value={1}>1時間後</option><option value={3}>3時間後</option><option value={24}>前日まで</option></select></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><input type="checkbox" checked={autoFillLogic} onChange={(e) => setAutoFillLogic(e.target.checked)} style={{ width: '22px', height: '22px' }} /><b>自動詰め機能を有効にする</b></label>
            </section>
            
            <section style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>⏰ 基本営業時間と休憩</h3>
              {Object.keys(dayMap).map(day => (
                <div key={day} style={{ borderBottom: '1px solid #f1f5f9', padding: '15px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: '1rem' }}>{dayMap[day]}</b>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!businessHours[day]?.is_closed} onChange={(e) => { const h = { ...businessHours }; h[day] = { ...h[day], is_closed: !e.target.checked }; setBusinessHours(h); }} style={{ width: '18px', height: '18px' }} />
                      {businessHours[day]?.is_closed ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>定休日</span> : '営業中'}
                    </label>
                  </div>
                  {!businessHours[day]?.is_closed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15, padding: '10px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: '0.8rem', width: '35px' }}>営業</span>
                        <input type="time" value={businessHours[day]?.open || '09:00'} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], open: e.target.value}})} style={{ ...inputStyle, width: 'auto', padding: '5px' }} />
                        <span>〜</span>
                        <input type="time" value={businessHours[day]?.close || '18:00'} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], close: e.target.value}})} style={{ ...inputStyle, width: 'auto', padding: '5px' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: '0.8rem', width: '35px' }}>休憩</span>
                        <input type="time" value={businessHours[day]?.rest_start || ''} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], rest_start: e.target.value}})} style={{ ...inputStyle, width: 'auto', padding: '5px' }} />
                        <span>〜</span>
                        <input type="time" value={businessHours[day]?.rest_end || ''} onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], rest_end: e.target.value}})} style={{ ...inputStyle, width: 'auto', padding: '5px' }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>
        )}

        {/* --- 🏪 店舗情報タブ --- */}
        {activeTab === 'info' && (
          <div style={{ width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <UrlBox label={`🔑 店舗主用設定 (PW: ${shopData?.admin_password})`} url={`${window.location.origin}/admin/${shopId}`} color="#2563eb" copy={() => copyToClipboard(`${window.location.origin}/admin/${shopId}`)} />
                <UrlBox label="💬 LINEリッチメニュー用URL（読込爆速）" url={`${window.location.origin}/shop/${shopId}/reserve?openExternalBrowser=1`} color="#00b900" copy={() => copyToClipboard(`${window.location.origin}/shop/${shopId}/reserve?openExternalBrowser=1`)} />
                <UrlBox label="📅 お客様用予約（一般Web用）" url={`${window.location.origin}/shop/${shopId}/reserve`} color="#059669" copy={() => copyToClipboard(`${window.location.origin}/shop/${shopId}/reserve`)} />
              </div>
            </section>

            <section style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>🏪 店舗プロフィールの設定</h3>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>店舗名 / ふりがな</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={inputStyle} /><input value={businessNameKana} onChange={(e) => setBusinessNameKana(e.target.value)} style={inputStyle} /></div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>代表者名 / ふりがな</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}><input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} style={inputStyle} /><input value={ownerNameKana} onChange={(e) => setOwnerNameKana(e.target.value)} style={inputStyle} /></div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>業種</label>
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} style={{ ...inputStyle, marginBottom: '15px' }}><option value="美容室・理容室">美容室・理容室</option><option value="その他">その他</option></select>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>店舗画像URL (復元完了)</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ ...inputStyle, marginBottom: '15px' }} placeholder="https://..." />
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>住所</label><input value={address} onChange={(e) => setAddress(e.target.value)} style={{ ...inputStyle, marginBottom: '15px' }} />
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>電話番号</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...inputStyle, marginBottom: '15px' }} />
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>メール</label><input type="email" value={emailContact} onChange={(e) => setEmailContact(e.target.value)} style={{ ...inputStyle, marginBottom: '15px' }} />
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>注意事項</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, border: '2px solid #ef4444', minHeight: '80px' }} />
            </section>

            <section style={{ ...cardStyle, border: '1px solid #00b900' }}>
              <h3 style={{ marginTop: 0, color: '#00b900' }}>💬 LINE公式アカウント連携ガイド</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { step: '1', title: '公式アカウントの作成', desc: 'LINE Official Account Managerから開設。' },
                  { step: '2', title: 'Messaging API有効化', desc: '管理画面の設定から有効にしてください。' },
                  { step: '3', title: 'アクセストークン取得', desc: 'LINE Developersでトークンを発行。' },
                  { step: '4', title: 'ユーザーIDの確認', desc: 'Messaging API設定にある「あなたのユーザーID」。' },
                  { step: '5', title: '設定画面への入力', desc: '取得した情報を下の項目に入力して保存。' },
                  { step: '6', title: 'リッチメニュー設定', desc: 'URLをコピーしてLINE側に貼り付け！' }
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', gap: '10px', background: '#f0fdf4', padding: '12px', borderRadius: '10px', alignItems: 'center', boxSizing: 'border-box' }}>
                    <div style={{ width: '24px', height: '24px', background: '#00b900', color: '#fff', borderRadius: '50%', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.step}</div>
                    <div style={{ fontSize: '0.75rem' }}><b>{item.title}</b><br/>{item.desc}</div>
                  </div>
                ))}
                <div style={{ marginTop: '10px', padding: '15px', background: '#f0fdf4', borderRadius: '12px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={notifyLineEnabled} onChange={(e) => setNotifyLineEnabled(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>📢 LINE通知を有効にする</span>
                  </label>
                  <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#15803d', display: 'block', marginBottom: '5px' }}>Access Token</label><input type="password" value={lineToken} onChange={(e) => setLineToken(e.target.value)} style={inputStyle} />
                  <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#15803d', marginTop: '10px', display: 'block', marginBottom: '5px' }}>Admin User ID</label><input value={lineAdminId} onChange={(e) => setLineAdminId(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        <button onClick={handleFinalSave} style={{ padding: '18px 35px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '40px', fontWeight: 'bold', boxShadow: '0 8px 30px rgba(37,99,235,0.4)', fontSize: '1rem', cursor: 'pointer' }}>設定を保存する 💾</button>
      </div>
    </div>
  );
}

const UrlBox = ({ label, url, color, copy }) => (
  <div style={{ boxSizing: 'border-box', width: '100%', marginBottom: '10px' }}>
    <label style={{ fontSize: '0.7rem', color, fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{label}</label>
    <div style={{ display: 'flex', gap: '5px' }}>
      <input readOnly value={url} style={{ flex: 1, padding: '10px', fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #eee', borderRadius: '10px', boxSizing: 'border-box' }} />
      <button onClick={copy} style={{ padding: '8px 12px', background: '#fff', border: `1px solid ${color}`, color, borderRadius: '10px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>コピー</button>
    </div>
  </div>
);

export default AdminDashboard;