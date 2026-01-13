import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function SuperAdmin() {
  // --- 新規作成用State ---
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
  
  // --- 編集用State (全項目追加) ---
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

    const { error } = await supabase
      .from('profiles')
      .insert([{ 
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
      setNewShopName(''); setNewShopKana('');
      setNewOwnerName(''); setNewOwnerNameKana('');
      setNewBusinessType(''); setNewEmail(''); setNewPhone('');
      setNewLineToken(''); setNewLineAdminId(''); 
      fetchCreatedShops();
      alert(`「${newShopName}」を作成しました！\n初期パスワードは 【 ${newPass} 】 です。`);
    }
  };

  const updateShopInfo = async (id) => {
    if (!editName || !editKana || !editPassword) return alert('全項目入力してください');
    
    const targetShop = createdShops.find(s => s.id === id);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        business_name: editName, 
        business_name_kana: editKana,
        owner_name: editOwnerName,
        owner_name_kana: editOwnerNameKana,
        business_type: editBusinessType,
        email_contact: editEmail,
        phone: editPhone,
        admin_password: editPassword,
        // 入力がある場合のみ上書き（セキュリティ維持）
        line_channel_access_token: editLineToken || targetShop.line_channel_access_token,
        line_admin_user_id: editLineAdminId || targetShop.line_admin_user_id
      })
      .eq('id', id);

    if (!error) {
      setEditingShopId(null);
      setEditLineToken('');
      setEditLineAdminId('');
      fetchCreatedShops();
      alert('店舗情報を更新しました');
    } else {
      alert('更新に失敗しました');
    }
  };

  const getSortedShops = () => {
    let listWithNumbers = [...createdShops].map((shop, index) => ({
      ...shop,
      displayNumber: index + 1
    }));
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

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#f4f7f9', minHeight: '100vh', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '1.5rem', borderLeft: '6px solid #2563eb', paddingLeft: '15px', marginBottom: '25px' }}>🛠 店舗統括管理</h1>
      
      {/* 🆕 新規店舗の発行エリア */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: '#1e293b', marginBottom: '15px' }}>🆕 新規店舗の発行</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder="代表者 氏名" style={{ ...smallInput, flex: 1 }} />
            <input value={newOwnerNameKana} onChange={(e) => setNewOwnerNameKana(e.target.value)} placeholder="氏名 ふりがな" style={{ ...smallInput, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input value={newShopName} onChange={(e) => setNewShopName(e.target.value)} placeholder="店舗名" style={{ ...smallInput, flex: 1 }} />
            <input value={newShopKana} onChange={(e) => setNewShopKana(e.target.value)} placeholder="店舗 ふりがな" style={{ ...smallInput, flex: 1 }} />
          </div>
          <select value={newBusinessType} onChange={(e) => setNewBusinessType(e.target.value)} style={smallInput}>
            <option value="">-- 業種を選択 --</option>
            <option value="美容室・理容室">美容室・理容室</option>
            <option value="ネイル・アイラッシュ">ネイル・アイラッシュ</option>
            <option value="エステ・リラク">エステ・リラク</option>
            <option value="整体・接骨院">整体・接骨院</option>
            <option value="飲食店">飲食店</option>
            <option value="その他">その他</option>
          </select>
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="メールアドレス" style={smallInput} />
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="電話番号" style={smallInput} />
          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>💬 個別LINE通知設定 (任意)</label>
            <input value={newLineToken} onChange={(e) => setNewLineToken(e.target.value)} placeholder="LINE Channel Access Token" style={{ width: '100%', marginTop: '5px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
            <input value={newLineAdminId} onChange={(e) => setNewLineAdminId(e.target.value)} placeholder="店長 LINE User ID (U...)" style={{ width: '100%', marginTop: '5px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
          </div>
          <button onClick={createNewShop} style={{ padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>店舗を発行する</button>
        </div>
      </div>

      {/* 並べ替え */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>並べ替え:</span>
        {['number_desc', 'number_asc', 'kana'].map((type) => (
          <button key={type} onClick={() => setSortType(type)} style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px', border: '1px solid #2563eb', background: sortType === type ? '#2563eb' : '#fff', color: sortType === type ? '#fff' : '#2563eb', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {type === 'number_desc' ? '新しい順' : type === 'number_asc' ? '古い順' : 'あいうえお順'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {getSortedShops().map(shop => (
          <div key={shop.id} style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', opacity: shop.is_suspended ? 0.7 : 1 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 'bold' }}>No.{shop.displayNumber}</div>
                {editingShopId === shop.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input value={editOwnerName} onChange={(e) => setEditOwnerName(e.target.value)} style={{ ...smallInput, flex: 1 }} placeholder="代表者氏名" />
                      <input value={editOwnerNameKana} onChange={(e) => setEditOwnerNameKana(e.target.value)} style={{ ...smallInput, flex: 1 }} placeholder="氏名かな" />
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...smallInput, flex: 1 }} placeholder="店舗名" />
                      <input value={editKana} onChange={(e) => setEditKana(e.target.value)} style={{ ...smallInput, flex: 1 }} placeholder="店舗かな" />
                    </div>
                    <select value={editBusinessType} onChange={(e) => setEditBusinessType(e.target.value)} style={smallInput}>
                      <option value="">-- 業種を選択 --</option>
                      <option value="美容室・理容室">美容室・理容室</option>
                      <option value="ネイル・アイラッシュ">ネイル・アイラッシュ</option>
                      <option value="エステ・リラク">エステ・リラク</option>
                      <option value="整体・接骨院">整体・接骨院</option>
                      <option value="飲食店">飲食店</option>
                      <option value="その他">その他</option>
                    </select>
                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={smallInput} placeholder="メール" />
                    <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={smallInput} placeholder="電話番号" />
                    <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '6px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block' }}>管理画面パスワード</label>
                        <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #d97706', borderRadius: '4px', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', color: '#166534' }}>LINE通知キー設定</label>
                        <input value={editLineToken} onChange={(e) => setEditLineToken(e.target.value)} style={{ width: '100%', marginTop: '4px', padding: '5px', border: '1px solid #16a34a', borderRadius: '4px', fontSize: '0.75rem' }} placeholder={shop.line_channel_access_token ? "設定済み（上書き時のみ入力）" : "Access Token"} />
                        <input value={editLineAdminId} onChange={(e) => setEditLineAdminId(e.target.value)} style={{ width: '100%', marginTop: '4px', padding: '5px', border: '1px solid #16a34a', borderRadius: '4px', fontSize: '0.75rem' }} placeholder={shop.line_admin_user_id ? "ユーザーID変更時入力" : "Admin User ID"} />
                    </div>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                      <button onClick={() => updateShopInfo(shop.id)} style={{ padding: '6px 15px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>保存</button>
                      <button onClick={() => setEditingShopId(null)} style={{ padding: '6px 15px', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>取消</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                      {shop.is_suspended && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '4px', verticalAlign: 'middle', marginRight: '6px' }}>中止中</span>}
                      {shop.business_name}
                    </h2>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{shop.business_name_kana} / {shop.owner_name || '店主名未登録'}</div>
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                            PW: <strong>{shop.admin_password || '未設定'}</strong>
                        </span>
                        {shop.line_channel_access_token && (
                          <span style={{ fontSize: '0.6rem', color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                            LINE通知連携済み
                          </span>
                        )}
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => { 
                  setEditingShopId(shop.id); 
                  setEditName(shop.business_name || ""); 
                  setEditKana(shop.business_name_kana || ""); 
                  setEditOwnerName(shop.owner_name || "");
                  setEditOwnerNameKana(shop.owner_name_kana || "");
                  setEditBusinessType(shop.business_type || "");
                  setEditEmail(shop.email_contact || "");
                  setEditPhone(shop.phone || "");
                  setEditPassword(shop.admin_password || ""); 
                  setEditLineToken("");
                  setEditLineAdminId("");
                }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px' }}>編集</button>
                <button onClick={() => deleteShop(shop)} style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px' }}>消去</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* 各種URLセクション (維持) */}
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>🔑 店舗主用設定 (PW: {shop.admin_password})</label>
                <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                  <input readOnly value={`${window.location.origin}/admin/${shop.id}`} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  <button onClick={() => copyToClipboard(`${window.location.origin}/admin/${shop.id}`)} style={{ padding: '8px 10px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #2563eb', color: '#2563eb', background: '#fff' }}>コピー</button>
                  <a href={`${window.location.origin}/admin/${shop.id}`} target="_blank" rel="noreferrer" style={{ padding: '8px 10px', fontSize: '0.7rem', borderRadius: '6px', background: '#2563eb', color: '#fff', textDecoration: 'none', textAlign: 'center' }}>開く</a>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#00b900', fontWeight: 'bold' }}>💬 LINEリッチメニュー用URL</label>
                <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                  <input readOnly value={`${window.location.origin}/shop/${shop.id}/reserve?source=line`} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }} />
                  <button onClick={() => copyToClipboard(`${window.location.origin}/shop/${shop.id}/reserve?source=line`)} style={{ padding: '8px 10px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #00b900', color: '#00b900', background: '#fff' }}>コピー</button>
                  <a href={`${window.location.origin}/shop/${shop.id}/reserve?source=line`} target="_blank" rel="noreferrer" style={{ padding: '8px 10px', fontSize: '0.7rem', borderRadius: '6px', background: '#00b900', color: '#fff', textDecoration: 'none', textAlign: 'center' }}>開く</a>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>📅 お客様用予約（一般Web用）</label>
                <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                  <input readOnly value={`${window.location.origin}/shop/${shop.id}/reserve`} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  <button onClick={() => copyToClipboard(`${window.location.origin}/shop/${shop.id}/reserve`)} style={{ padding: '8px 10px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #059669', color: '#059669', background: '#fff' }}>コピー</button>
                  <a href={`${window.location.origin}/shop/${shop.id}/reserve`} target="_blank" rel="noreferrer" style={{ padding: '8px 10px', fontSize: '0.7rem', borderRadius: '6px', background: '#059669', color: '#fff', textDecoration: 'none', textAlign: 'center' }}>開く</a>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => toggleSuspension(shop)} style={{ padding: '7px 15px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: shop.is_suspended ? '#10b981' : '#fee2e2', color: shop.is_suspended ? '#fff' : '#ef4444', fontSize: '0.8rem' }}>
                {shop.is_suspended ? 'ページを再開する' : 'ページ公開を中止する'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const smallInput = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' };

export default SuperAdmin;