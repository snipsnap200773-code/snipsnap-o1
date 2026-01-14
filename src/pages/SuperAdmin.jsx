import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function SuperAdmin() {
  // --- 1. 新規作成用State ---
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // --- 2. 編集用State (全項目完備) ---
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
  const [editImageUrl, setEditImageUrl] = useState('');

  const DELETE_PASSWORD = "1212";

  // 画面幅の監視
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;

  useEffect(() => {
    fetchCreatedShops();
  }, []);

  const fetchCreatedShops = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (data) setCreatedShops(data);
  };

  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const createNewShop = async () => {
    if (!newShopName || !newShopKana || !newOwnerName) return alert('店舗名、ふりがな、代表者名を入力してください');
    const newPass = generateRandomPassword();
    const { error } = await supabase.from('profiles').insert([{ 
        business_name: newShopName, 
        business_name_kana: newShopKana,
        owner_name: newOwnerName,
        owner_name_kana: newOwnerNameKana,
        business_type: newBusinessType,
        email_contact: newEmail,
        phone: newPhone,
        admin_password: newPass,
        line_channel_access_token: newLineToken,
        line_admin_user_id: newLineAdminId,
        notify_line_enabled: true 
    }]);

    if (error) {
      alert('作成に失敗しました');
    } else {
      setNewShopName(''); setNewShopKana(''); setNewOwnerName(''); setNewOwnerNameKana('');
      setNewBusinessType(''); setNewEmail(''); setNewPhone(''); setNewLineToken(''); setNewLineAdminId(''); 
      fetchCreatedShops();
      alert(`「${newShopName}」を作成しました！\n初期パスワードは 【 ${newPass} 】 です。`);
    }
  };

  const updateShopInfo = async (id) => {
    if (!editName || !editKana || !editPassword) return alert('必須項目を入力してください');
    const targetShop = createdShops.find(s => s.id === id);
    const { error } = await supabase.from('profiles').update({ 
        business_name: editName, 
        business_name_kana: editKana,
        owner_name: editOwnerName,
        owner_name_kana: editOwnerNameKana,
        business_type: editBusinessType,
        email_contact: editEmail,
        phone: editPhone,
        admin_password: editPassword,
        image_url: editImageUrl,
        line_channel_access_token: editLineToken || targetShop.line_channel_access_token,
        line_admin_user_id: editLineAdminId || targetShop.line_admin_user_id
    }).eq('id', id);

    if (!error) {
      setEditingShopId(null);
      fetchCreatedShops();
      alert('店舗情報を更新しました');
    } else {
      alert('更新に失敗しました');
    }
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
      } else if (inputPass !== null) {
        alert('パスワードが違います。');
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('コピーしました！');
  };

  // 💡 スマホ専用：はみ出しを防ぐ共通スタイル
  const cardStyle = { background: '#fff', padding: '15px', borderRadius: '16px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', boxSizing: 'border-box', width: '100%' };
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' };
  const flexGroupStyle = { display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row', marginBottom: '10px' };

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#f4f7f9', minHeight: '100vh', paddingBottom: '100px', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: '1.5rem', borderLeft: '6px solid #2563eb', paddingLeft: '15px', marginBottom: '25px', color: '#1e293b' }}>🛠 店舗統括管理</h1>
      
      {/* 🆕 新規店舗の発行エリア */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: '#64748b', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>🆕 新規店舗の発行</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={flexGroupStyle}>
            <input value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder="代表者 氏名" style={inputStyle} />
            <input value={newOwnerNameKana} onChange={(e) => setNewOwnerNameKana(e.target.value)} placeholder="氏名 ふりがな" style={inputStyle} />
          </div>
          <div style={flexGroupStyle}>
            <input value={newShopName} onChange={(e) => setNewShopName(e.target.value)} placeholder="店舗名" style={inputStyle} />
            <input value={newShopKana} onChange={(e) => setNewShopKana(e.target.value)} placeholder="店舗 ふりがな" style={inputStyle} />
          </div>
          <select value={newBusinessType} onChange={(e) => setNewBusinessType(e.target.value)} style={inputStyle}>
            <option value="">-- 業種を選択 --</option>
            <option value="美容室・理容室">美容室・理容室</option>
            <option value="その他">その他</option>
          </select>
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="メールアドレス" style={inputStyle} />
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="電話番号" style={inputStyle} />
          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>💬 LINE通知設定 (任意)</label>
            <input value={newLineToken} onChange={(e) => setNewLineToken(e.target.value)} placeholder="Access Token" style={{ ...inputStyle, marginTop: '5px' }} />
            <input value={newLineAdminId} onChange={(e) => setNewLineAdminId(e.target.value)} placeholder="Admin User ID (U...)" style={{ ...inputStyle, marginTop: '5px' }} />
          </div>
          <button onClick={createNewShop} style={{ padding: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '1rem' }}>店舗を発行する</button>
        </div>
      </div>

      {/* 並べ替え */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>並べ替え:</span>
        {['number_desc', 'number_asc', 'kana'].map((type) => (
          <button key={type} onClick={() => setSortType(type)} style={{ padding: '8px 15px', fontSize: '0.75rem', borderRadius: '20px', border: '1px solid #2563eb', background: sortType === type ? '#2563eb' : '#fff', color: sortType === type ? '#fff' : '#2563eb', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {type === 'number_desc' ? '新しい順' : type === 'number_asc' ? '古い順' : '名前順'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {getSortedShops().map(shop => (
          <div key={shop.id} style={{ ...cardStyle, opacity: shop.is_suspended ? 0.7 : 1 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 'bold' }}>No.{shop.displayNumber}</div>
                {editingShopId === shop.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <div style={flexGroupStyle}>
                      <input value={editOwnerName} onChange={(e) => setEditOwnerName(e.target.value)} style={inputStyle} placeholder="氏名" />
                      <input value={editOwnerNameKana} onChange={(e) => setEditOwnerNameKana(e.target.value)} style={inputStyle} placeholder="かな" />
                    </div>
                    <div style={flexGroupStyle}>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} placeholder="店舗名" />
                      <input value={editKana} onChange={(e) => setEditKana(e.target.value)} style={inputStyle} placeholder="かな" />
                    </div>
                    <input value={editEmail} onChange={(e) => setEditEmail(target.value)} style={inputStyle} placeholder="メール" />
                    <input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} style={inputStyle} placeholder="店舗画像URL" />
                    <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>管理用パスワード</label>
                        <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} style={{ ...inputStyle, border: '1px solid #d97706' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={() => updateShopInfo(shop.id)} style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>保存</button>
                      <button onClick={() => setEditingShopId(null)} style={{ flex: 1, padding: '12px', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>取消</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 style={{ margin: '5px 0', fontSize: '1.3rem', color: '#1e293b' }}>
                      {shop.is_suspended && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '4px', verticalAlign: 'middle', marginRight: '6px' }}>中止中</span>}
                      {shop.business_name}
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{shop.business_name_kana} / {shop.owner_name}</div>
                    <div style={{ marginTop: '8px' }}><span style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>PW: {shop.admin_password}</span></div>
                  </>
                )}
              </div>
              {!editingShopId && (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => { setEditingShopId(shop.id); setEditName(shop.business_name); setEditKana(shop.business_name_kana); setEditOwnerName(shop.owner_name); setEditOwnerNameKana(shop.owner_name_kana); setEditEmail(shop.email_contact); setEditPhone(shop.phone); setEditPassword(shop.admin_password); setEditImageUrl(shop.image_url || ''); }} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem' }}>編集</button>
                  <button onClick={() => deleteShop(shop)} style={{ padding: '6px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', fontSize: '0.75rem', color: '#ef4444' }}>消去</button>
                </div>
              )}
            </div>

            {!editingShopId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <UrlBox label="🔑 管理用URL" url={`${window.location.origin}/admin/${shop.id}`} color="#2563eb" copy={() => copyToClipboard(`${window.location.origin}/admin/${shop.id}`)} />
                <UrlBox label="💬 LINEメニュー用URL" url={`${window.location.origin}/shop/${shop.id}/reserve?openExternalBrowser=1`} color="#00b900" copy={() => copyToClipboard(`${window.location.origin}/shop/${shopId}/reserve?openExternalBrowser=1`)} />
                <UrlBox label="📅 お客様予約用URL" url={`${window.location.origin}/shop/${shop.id}/reserve`} color="#059669" copy={() => copyToClipboard(`${window.location.origin}/shop/${shop.id}/reserve`)} />
                <button onClick={() => toggleSuspension(shop)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', background: shop.is_suspended ? '#10b981' : '#fee2e2', color: shop.is_suspended ? '#fff' : '#ef4444', fontSize: '0.85rem' }}>
                  {shop.is_suspended ? 'ページ公開を再開する' : 'ページ公開を中止する'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 💡 URL表示・コピー用のサブコンポーネント
const UrlBox = ({ label, url, color, copy }) => (
  <div style={{ width: '100%' }}>
    <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>{label}</label>
    <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
      <input readOnly value={url} style={{ flex: 1, padding: '10px', fontSize: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
      <button onClick={copy} style={{ padding: '8px 12px', background: '#fff', border: `1px solid ${color}`, color, borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem' }}>コピー</button>
      <a href={url} target="_blank" rel="noreferrer" style={{ padding: '8px 12px', background: color, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>確認</a>
    </div>
  </div>
);

export default SuperAdmin;