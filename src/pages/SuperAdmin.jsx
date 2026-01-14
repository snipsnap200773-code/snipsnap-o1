import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function SuperAdmin() {
  const [newShopName, setNewShopName] = useState('');
  const [newShopKana, setNewShopKana] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerNameKana, setNewOwnerNameKana] = useState('');
  const [newBusinessType, setNewBusinessType] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLineToken, setNewLineToken] = useState('');
  const [newLineAdminId, setNewLineAdminId] = useState('');
  const [createdShops, setCreatedShops] = useState([]);
  const [sortType, setSortType] = useState('number_desc');
  const [editingShopId, setEditingShopId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editKana, setEditKana] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerNameKana, setEditOwnerNameKana] = useState('');
  const [editBusinessType, setEditBusinessType] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLineToken, setEditLineToken] = useState('');
  const [editLineAdminId, setEditLineAdminId] = useState('');

  const DELETE_PASSWORD = "1212";

  useEffect(() => { fetchCreatedShops(); }, []);

  const fetchCreatedShops = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (data) setCreatedShops(data);
  };

  const generateRandomPassword = () => Math.random().toString(36).slice(-8);

  const createNewShop = async () => {
    if (!newShopName || !newShopKana || !newOwnerName) return alert('店舗名、ふりがな、代表者名を入力してください');
    const newPass = generateRandomPassword();
    const { error } = await supabase.from('profiles').insert([{ business_name: newShopName, business_name_kana: newShopKana, owner_name: newOwnerName, owner_name_kana: newOwnerNameKana, business_type: newBusinessType, email_contact: newEmail, phone: newPhone, admin_password: newPass, line_channel_access_token: newLineToken, line_admin_user_id: newLineAdminId, notify_line_enabled: true }]);
    if (error) { alert('作成に失敗しました'); } else {
      setNewShopName(''); setNewShopKana(''); setNewOwnerName(''); setNewOwnerNameKana(''); setNewBusinessType(''); setNewEmail(''); setNewPhone(''); setNewLineToken(''); setNewLineAdminId(''); 
      fetchCreatedShops();
      alert(`「${newShopName}」を作成しました！\n初期パスワードは 【 ${newPass} 】 です。`);
    }
  };

  const updateShopInfo = async (id) => {
    if (!editName || !editKana || !editPassword) return alert('全項目入力してください');
    const targetShop = createdShops.find(s => s.id === id);
    const { error } = await supabase.from('profiles').update({ business_name: editName, business_name_kana: editKana, owner_name: editOwnerName, owner_name_kana: editOwnerNameKana, business_type: editBusinessType, email_contact: editEmail, phone: editPhone, admin_password: editPassword, line_channel_access_token: editLineToken || targetShop.line_channel_access_token, line_admin_user_id: editLineAdminId || targetShop.line_admin_user_id }).eq('id', id);
    if (!error) { setEditingShopId(null); setEditLineToken(''); setEditLineAdminId(''); fetchCreatedShops(); alert('店舗情報を更新しました'); } else { alert('更新に失敗しました'); }
  };

  const getSortedShops = () => {
    let listWithNumbers = [...createdShops].map((shop, index) => ({ ...shop, displayNumber: index + 1 }));
    if (sortType === 'number_desc') return listWithNumbers.reverse();
    if (sortType === 'number_asc') return listWithNumbers;
    if (sortType === 'kana') return listWithNumbers.sort((a, b) => (a.business_name_kana || "").localeCompare(b.business_name_kana || "", 'ja'));
    return listWithNumbers;
  };

  const toggleSuspension = async (shop) => {
    const action = shop.is_suspended ? '再開' : '中止';
    if (window.confirm(`「${shop.business_name}」の公開を${action}しますか？`)) {
      const { error } = await supabase.from('profiles').update({ is_suspended: !shop.is_suspended }).eq('id', shop.id);
      if (!error) fetchCreatedShops();
    }
  };

  const deleteShop = async (shop) => {
    if (window.confirm(`【警告】「${shop.business_name}」を完全に削除します。`)) {
      const inputPass = window.prompt("削除用パスワードを入力してください：");
      if (inputPass === DELETE_PASSWORD) {
        const { error } = await supabase.from('profiles').delete().eq('id', shop.id);
        if (!error) { fetchCreatedShops(); alert('店舗を削除しました。'); }
      } else if (inputPass !== null) { alert('パスワードが違います。'); }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('コピーしました！');
  };

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', borderLeft: '6px solid #2563eb', paddingLeft: '15px', marginBottom: '25px', color: '#1e293b' }}>🛠 店舗統括管理</h1>
        
        {/* 新規発行エリア */}
        <div style={{ background: '#fff', padding: '15px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>🆕 新規店舗の発行</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder="代表者名" style={{ ...smallInput, flex: '1 1 140px' }} />
              <input value={newOwnerNameKana} onChange={(e) => setNewOwnerNameKana(e.target.value)} placeholder="ふりがな" style={{ ...smallInput, flex: '1 1 140px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input value={newShopName} onChange={(e) => setNewShopName(e.target.value)} placeholder="店舗名" style={{ ...smallInput, flex: '1 1 140px' }} />
              <input value={newShopKana} onChange={(e) => setNewShopKana(e.target.value)} placeholder="店舗かな" style={{ ...smallInput, flex: '1 1 140px' }} />
            </div>
            <select value={newBusinessType} onChange={(e) => setNewBusinessType(e.target.value)} style={smallInput}>
              <option value="">-- 業種を選択 --</option>
              <option value="美容室・理容室">美容室・理容室</option>
              <option value="整体・接骨院">整体・接骨院</option>
              <option value="飲食店">飲食店</option>
              <option value="その他">その他</option>
            </select>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="メールアドレス" style={smallInput} />
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="電話番号" style={smallInput} />
            <button onClick={createNewShop} style={{ padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>店舗を発行する</button>
          </div>
        </div>

        {/* 並べ替え */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px' }}>
          {['number_desc', 'number_asc', 'kana'].map((type) => (
            <button key={type} onClick={() => setSortType(type)} style={{ padding: '6px 12px', fontSize: '0.7rem', borderRadius: '20px', border: '1px solid #2563eb', background: sortType === type ? '#2563eb' : '#fff', color: sortType === type ? '#fff' : '#2563eb' }}>
              {type === 'number_desc' ? '新しい順' : type === 'number_asc' ? '古い順' : 'あいうえお'}
            </button>
          ))}
        </div>

        {/* 店舗リスト */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {getSortedShops().map(shop => (
            <div key={shop.id} style={{ background: '#fff', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 'bold' }}>No.{shop.displayNumber}</div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{shop.business_name}</h2>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PW: <strong>{shop.admin_password}</strong></div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => setEditingShopId(shop.id)} style={actionBtnStyle}>編集</button>
                  <button onClick={() => deleteShop(shop)} style={{ ...actionBtnStyle, color: '#ef4444' }}>消去</button>
                </div>
              </div>

              {/* URLセクション：はみ出し防止の縦並びレイアウト */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {[
                  { label: '🔑 店舗主用設定', url: `${window.location.origin}/admin/${shop.id}`, color: '#2563eb' },
                  { label: '💬 LINEメニュー用', url: `${window.location.origin}/shop/${shop.id}/reserve?source=line`, color: '#00b900' },
                  { label: '📅 一般予約用', url: `${window.location.origin}/shop/${shop.id}/reserve`, color: '#059669' }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '0.65rem', color: item.color, fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{item.label}</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input readOnly value={item.url} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', minWidth: 0 }} />
                      <button onClick={() => copyToClipboard(item.url)} style={iconBtnStyle}>📋</button>
                      <a href={item.url} target="_blank" rel="noreferrer" style={openBtnStyle}>開く</a>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <button onClick={() => toggleSuspension(shop)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 'bold', background: shop.is_suspended ? '#10b981' : '#fee2e2', color: shop.is_suspended ? '#fff' : '#ef4444', fontSize: '0.75rem' }}>
                  {shop.is_suspended ? '公開を再開する' : '公開を一時停止する'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const smallInput = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' };
const actionBtnStyle = { background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontSize: '0.65rem', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' };
const iconBtnStyle = { padding: '8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' };
const openBtnStyle = { padding: '8px 12px', fontSize: '0.7rem', borderRadius: '6px', background: '#2563eb', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center' };

export default SuperAdmin;