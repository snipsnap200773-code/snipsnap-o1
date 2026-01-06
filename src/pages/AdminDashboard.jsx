import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminDashboard() {
  const { shopId } = useParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // State群
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
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
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

  const showMsg = (txt) => {
    setMessage(txt);
    setTimeout(() => setMessage(''), 3000);
  };

  // --- 1. 並び替え機能 ---
  const moveItem = async (type, list, id, direction) => {
    const newList = [...list];
    const index = newList.findIndex(item => item.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;

    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    const table = type === 'category' ? 'service_categories' : 'services';
    const updates = newList.map((item, idx) => ({
      id: item.id,
      shop_id: shopId,
      sort_order: idx,
      name: item.name,
      // メニューの場合はカテゴリとスロット数も維持
      ...(type === 'service' ? { slots: item.slots, category: item.category } : {})
    }));

    const { error } = await supabase.from(table).upsert(updates);
    if (!error) fetchData();
  };

  // --- 2. カテゴリ操作 ---
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (editingCategoryId) {
      await supabase.from('service_categories').update({ name: newCategoryName }).eq('id', editingCategoryId);
      setEditingCategoryId(null);
    } else {
      await supabase.from('service_categories').insert([{ shop_id: shopId, name: newCategoryName, sort_order: categories.length }]);
    }
    setNewCategoryName(''); fetchData(); showMsg('カテゴリを更新しました');
  };

  const deleteCategory = async (id, name) => {
    if (window.confirm(`カテゴリ「${name}」を削除しますか？`)) {
      await supabase.from('service_categories').delete().eq('id', id);
      fetchData();
    }
  };

  // --- 3. メニュー操作 (編集・削除含む) ---
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = selectedCategory || (categories.length > 0 ? categories[0].name : 'その他');
    const serviceData = { shop_id: shopId, name: newServiceName, slots: newServiceSlots, category: finalCategory };

    if (editingServiceId) {
      await supabase.from('services').update(serviceData).eq('id', editingServiceId);
      setEditingServiceId(null);
    } else {
      await supabase.from('services').insert([{ ...serviceData, sort_order: services.length }]);
    }
    setNewServiceName(''); setNewServiceSlots(1); fetchData(); showMsg('メニューを保存しました');
  };

  const deleteService = async (id) => {
    if (window.confirm('メニューを削除しますか？')) {
      await supabase.from('services').delete().eq('id', id);
      fetchData();
    }
  };

  // --- 4. 枝分かれ(オプション)操作 ---
  const handleOptionSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('service_options').insert([{
      service_id: activeServiceForOptions.id,
      group_name: optGroupName,
      option_name: optName,
      additional_slots: optSlots
    }]);
    if (!error) { setOptName(''); setOptSlots(0); fetchData(); showMsg('選択肢を追加しました'); }
  };

  const deleteOption = async (id) => {
    await supabase.from('service_options').delete().eq('id', id);
    fetchData();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto', paddingBottom: '100px' }}>
      <Link to="/" style={{ fontSize: '0.8rem', color: '#666' }}>← 戻る</Link>
      <h2 style={{ borderBottom: '2px solid #2563eb', paddingBottom: '10px' }}>⚙️ 店舗設定プロ</h2>

      {message && <div style={{ position: 'fixed', top: 20, right: 20, padding: '15px', background: '#dcfce7', color: '#166534', borderRadius: '8px', zIndex: 1000 }}>{message}</div>}

      {/* カテゴリ管理 */}
      <section style={{ marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>📂 カテゴリ順序・作成</h3>
        <form onSubmit={handleCategorySubmit} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          <input placeholder="カテゴリ名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} required />
          <button type="submit" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px' }}>確定</button>
        </form>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map((c, idx) => (
            <div key={c.id} style={{ background: '#f3f4f6', padding: '5px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
              <span>{c.name}</span>
              <button onClick={() => moveItem('category', categories, c.id, 'up')} disabled={idx === 0} style={{ border: 'none', background: 'none' }}>↑</button>
              <button onClick={() => moveItem('category', categories, c.id, 'down')} disabled={idx === categories.length - 1} style={{ border: 'none', background: 'none' }}>↓</button>
              <button onClick={() => {setEditingCategoryId(c.id); setNewCategoryName(c.name);}} style={{ border: 'none', background: 'none', color: '#2563eb' }}>✎</button>
              <button onClick={() => deleteCategory(c.id, c.name)} style={{ border: 'none', background: 'none', color: '#ef4444' }}>×</button>
            </div>
          ))}
        </div>
      </section>

      {/* メニュー登録フォーム */}
      <section style={{ marginBottom: '30px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>📝 メニュー登録・編集</h3>
        <form onSubmit={handleServiceSubmit}>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px' }} required>
            <option value="">-- カテゴリ選択 --</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="メニュー名" required />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem' }}>基本コマ数:</span>
            <input type="number" value={newServiceSlots} onChange={(e) => setNewServiceSlots(parseInt(e.target.value))} style={{ width: '60px', padding: '8px' }} min="1" />
            <span style={{ fontWeight: 'bold' }}>{newServiceSlots * 30}分</span>
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px', background: editingServiceId ? '#f97316' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px' }}>
            {editingServiceId ? '変更を保存' : 'メニューを追加'}
          </button>
        </form>
      </section>

      {/* メニュー一覧 */}
      {categories.map((cat) => (
        <div key={cat.id} style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.8rem', borderBottom: '1px solid #eee' }}>{cat.name}</h4>
          {services.filter(s => s.category === cat.name).map((s) => {
            const overallIndex = services.findIndex(item => item.id === s.id);
            return (
              <div key={s.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>{s.slots * 30}分</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <button onClick={() => moveItem('service', services, s.id, 'up')} disabled={overallIndex === 0} style={{ fontSize: '0.6rem' }}>▲</button>
                      <button onClick={() => moveItem('service', services, s.id, 'down')} disabled={overallIndex === services.length - 1} style={{ fontSize: '0.6rem' }}>▼</button>
                    </div>
                    <button onClick={() => setActiveServiceForOptions(activeServiceForOptions?.id === s.id ? null : s)} style={{ padding: '5px', fontSize: '0.7rem', background: '#f3f4f6', borderRadius: '4px' }}>枝</button>
                    <button onClick={() => {setEditingServiceId(s.id); setNewServiceName(s.name); setNewServiceSlots(s.slots); setSelectedCategory(s.category); window.scrollTo(0,0);}} style={{ color: '#2563eb', border: 'none', background: 'none', fontSize: '0.75rem' }}>編</button>
                    <button onClick={() => deleteService(s.id)} style={{ color: '#ef4444', border: 'none', background: 'none', fontSize: '0.75rem' }}>消</button>
                  </div>
                </div>

                {activeServiceForOptions?.id === s.id && (
                  <div style={{ padding: '15px', borderTop: '1px solid #eee', background: '#f9fafb' }}>
                    <form onSubmit={handleOptionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input placeholder="グループ" value={optGroupName} onChange={(e) => setOptGroupName(e.target.value)} style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} required />
                        <input placeholder="選択肢名" value={optName} onChange={(e) => setOptName(e.target.value)} style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} required />
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="number" placeholder="+コマ" value={optSlots} onChange={(e) => setOptSlots(parseInt(e.target.value))} style={{ flex: 1, padding: '8px' }} />
                        <button type="submit" style={{ width: '60px', background: '#4f46e5', color: 'white', border: 'none' }}>追加</button>
                      </div>
                    </form>
                    {options.filter(o => o.service_id === s.id).map(o => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', fontSize: '0.75rem', borderBottom: '1px dashed #ccc' }}>
                        <span>{o.group_name}: {o.option_name} (+{o.additional_slots * 30}分)</span>
                        <button onClick={() => deleteOption(o.id)} style={{ color: '#ef4444', border: 'none', background: 'none' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;