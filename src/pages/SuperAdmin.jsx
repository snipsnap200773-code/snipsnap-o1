import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { MapPin, Plus, Trash2, Save, Image as ImageIcon, Bell, Search, Filter, Store, UserCheck, ShieldAlert, Copy, ExternalLink, Edit2 } from 'lucide-react';

function SuperAdmin() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPass, setInputPass] = useState('');

  const MASTER_PASSWORD = import.meta.env.VITE_SUPER_MASTER_PASSWORD; 
  const DELETE_PASSWORD = import.meta.env.VITE_SUPER_DELETE_PASSWORD;

  // --- 店舗データ関連 ---
  const [createdShops, setCreatedShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 🆕 検索・フィルタリング用State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('すべて');

  // --- 新規店舗State ---
  const [newShopName, setNewShopName] = useState('');
  const [newShopKana, setNewShopKana] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerNameKana, setNewOwnerNameKana] = useState('');
  const [newBusinessType, setNewBusinessType] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLineToken, setNewLineToken] = useState('');
  const [newLineAdminId, setNewLineAdminId] = useState('');

  // --- 編集用State ---
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

  // --- ポータルコンテンツState ---
  const [newsList, setNewsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [newNewsDate, setNewNewsDate] = useState('');
  const [newNewsCat, setNewNewsCat] = useState('お知らせ');
  const [newNewsTitle, setNewNewsTitle] = useState('');

  useEffect(() => { 
    if (isAuthorized) {
      fetchAllData(); 
    }
  }, [isAuthorized]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchCreatedShops(), fetchPortalContent()]);
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPass === MASTER_PASSWORD) setIsAuthorized(true);
    else alert('パスワードが違います');
  };

  const fetchCreatedShops = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setCreatedShops(data);
  };

  const fetchPortalContent = async () => {
    const { data: news } = await supabase.from('portal_news').select('*').order('publish_date', { ascending: false });
    if (news) setNewsList(news);
    const { data: cats } = await supabase.from('portal_categories').select('*').order('sort_order', { ascending: true });
    if (cats) setCategoriesList(cats);
  };

  // 🆕 検索 & カテゴリフィルタリングの計算
  const filteredShops = useMemo(() => {
    return createdShops.filter(shop => {
      const matchSearch = 
        (shop.business_name || "").includes(searchTerm) || 
        (shop.owner_name || "").includes(searchTerm) ||
        (shop.phone || "").includes(searchTerm);
      const matchCat = activeCategory === 'すべて' || shop.business_type === activeCategory;
      return matchSearch && matchCat;
    });
  }, [createdShops, searchTerm, activeCategory]);

  // 🆕 統計データの計算
  const stats = useMemo(() => ({
    total: createdShops.length,
    active: createdShops.filter(s => !s.is_suspended).length,
    suspended: createdShops.filter(s => s.is_suspended).length
  }), [createdShops]);

  // --- 以下、既存のロジック群（1ミリも変えずに維持） ---
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
    const { error } = await supabase.from('profiles').update({ 
      business_name: editName, business_name_kana: editKana, owner_name: editOwnerName, owner_name_kana: editOwnerNameKana, business_type: editBusinessType, email_contact: editEmail, phone: editPhone, admin_password: editPassword, line_channel_access_token: editLineToken || targetShop.line_channel_access_token, line_admin_user_id: editLineAdminId || targetShop.line_admin_user_id 
    }).eq('id', id);
    if (!error) { setEditingShopId(null); setEditLineToken(''); setEditLineAdminId(''); fetchCreatedShops(); alert('店舗情報を更新しました'); } else { alert('更新に失敗しました'); }
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
      const inputPassForDelete = window.prompt("削除用パスワードを入力してください：");
      if (inputPassForDelete === DELETE_PASSWORD) {
        const { error } = await supabase.from('profiles').delete().eq('id', shop.id);
        if (!error) { fetchCreatedShops(); alert('店舗を削除しました。'); }
        else alert(`削除に失敗しました。\n理由: ${error.message}`);
      } else if (inputPassForDelete !== null) alert('パスワードが違います。');
    }
  };

  const addNews = async () => {
    if (!newNewsDate || !newNewsTitle) return alert('日付とタイトルを入力してください');
    const { error } = await supabase.from('portal_news').insert([{ publish_date: newNewsDate, category: newNewsCat, title: newNewsTitle }]);
    if (!error) { setNewNewsDate(''); setNewNewsTitle(''); fetchPortalContent(); }
  };

  const deleteNews = async (id) => {
    if (window.confirm('このお知らせを削除しますか？')) {
      await supabase.from('portal_news').delete().eq('id', id);
      fetchPortalContent();
    }
  };

  const updateCategory = async (id, enName, imgUrl) => {
    const { error } = await supabase.from('portal_categories').update({ en_name: enName, image_url: imgUrl }).eq('id', id);
    if (!error) alert('カテゴリ設定を更新しました');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('コピーしました！');
  };

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f9' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '320px' }}>
          <h2 style={{ color: '#e60012', marginBottom: '20px', fontSize: '1.4rem', fontWeight: '900' }}>ソロプレ Admin</h2>
          <input type="password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} placeholder="パスワード" style={{ ...smallInput, textAlign: 'center', marginBottom: '20px' }} autoFocus />
          <button type="submit" style={{ width: '100%', padding: '14px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>ログイン</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* --- 🆕 統計ダッシュボード --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
          <div style={statsCard}><Store size={20} color="#2563eb" /> <div><label style={statsLabel}>全登録店舗</label><div style={statsValue}>{stats.total}</div></div></div>
          <div style={statsCard}><UserCheck size={20} color="#10b981" /> <div><label style={statsLabel}>公開中</label><div style={statsValue}>{stats.active}</div></div></div>
          <div style={statsCard}><ShieldAlert size={20} color="#ef4444" /> <div><label style={statsLabel}>停止中</label><div style={statsValue}>{stats.suspended}</div></div></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isPC ? '350px 1fr' : '1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* 左カラム：管理設定系 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* 新規発行 */}
            <div style={panelStyle}>
              <h3 style={panelTitle}><Plus size={18} /> 新規店舗の発行</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder="代表者名" style={smallInput} />
                  <input value={newOwnerNameKana} onChange={(e) => setNewOwnerNameKana(e.target.value)} placeholder="かな" style={smallInput} />
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input value={newShopName} onChange={(e) => setNewShopName(e.target.value)} placeholder="店舗名" style={smallInput} />
                  <input value={newShopKana} onChange={(e) => setNewShopKana(e.target.value)} placeholder="店舗かな" style={smallInput} />
                </div>
                <select value={newBusinessType} onChange={(e) => setNewBusinessType(e.target.value)} style={smallInput}>
                  <option value="">-- 業種を選択 --</option>
                  {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="メール" style={smallInput} />
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="電話" style={smallInput} />
                <button onClick={createNewShop} style={primaryBtn}>店舗を発行する</button>
              </div>
            </div>

            {/* お知らせ管理 */}
            <div style={panelStyle}>
              <h3 style={panelTitle}><Bell size={18} /> トピック管理</h3>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <input value={newNewsDate} onChange={(e) => setNewNewsDate(e.target.value)} placeholder="2026.01.21" style={{...smallInput, flex:1}} />
                <select value={newNewsCat} onChange={(e) => setNewNewsCat(e.target.value)} style={{...smallInput, flex:1}}>
                  <option value="お知らせ">お知らせ</option>
                  <option value="重要">重要</option>
                  <option value="新機能">新機能</option>
                </select>
              </div>
              <textarea value={newNewsTitle} onChange={(e) => setNewNewsTitle(e.target.value)} placeholder="タイトル内容" style={{...smallInput, height:'50px', marginBottom:'10px'}} />
              <button onClick={addNews} style={secondaryBtn}>追加</button>
              <div style={{ marginTop: '15px', maxHeight: '150px', overflowY: 'auto', borderTop: '1px solid #eee' }}>
                {newsList.map(n => (
                  <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #eee', fontSize: '0.75rem' }}>
                    <span>{n.publish_date} {n.title}</span>
                    <Trash2 size={14} color="#ef4444" onClick={() => deleteNews(n.id)} style={{cursor:'pointer'}} />
                  </div>
                ))}
              </div>
            </div>

            {/* カテゴリ管理 */}
            <div style={panelStyle}>
              <h3 style={panelTitle}><ImageIcon size={18} /> カテゴリデザイン</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {categoriesList.map(cat => (
                  <CategoryRow key={cat.id} cat={cat} onSave={updateCategory} />
                ))}
              </div>
            </div>
          </div>

          {/* 右カラム：店舗リスト（スマート検索・フィルタ付き） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 🆕 検索 & フィルタバー */}
            <div style={{ ...panelStyle, position: 'sticky', top: '10px', zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}>
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                <input 
                  type="text" 
                  placeholder="店舗名、代表者名、電話番号で検索..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{ ...smallInput, paddingLeft: '40px', fontSize: '1rem' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
                {['すべて', ...categoriesList.map(c => c.name)].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '6px 15px', borderRadius: '20px', border: 'none', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap',
                      background: activeCategory === cat ? '#1e293b' : '#fff',
                      color: activeCategory === cat ? '#fff' : '#64748b',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* リスト表示 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredShops.length > 0 ? filteredShops.map((shop, index) => (
                <ShopCard 
                  key={shop.id} 
                  shop={shop} 
                  index={createdShops.length - createdShops.findIndex(s => s.id === shop.id)}
                  editingShopId={editingShopId}
                  setEditingShopId={setEditingShopId}
                  editState={{
                    editName, setEditName, editKana, setEditKana, editOwnerName, setEditOwnerName,
                    editOwnerNameKana, setEditOwnerNameKana, editBusinessType, setEditBusinessType,
                    editEmail, setEditEmail, editPhone, setEditPhone, editPassword, setEditPassword,
                    editLineToken, setEditLineToken, editLineAdminId, setEditLineAdminId
                  }}
                  onUpdate={updateShopInfo}
                  onDelete={deleteShop}
                  onToggleSuspension={toggleSuspension}
                  onCopy={copyToClipboard}
                  categories={categoriesList}
                />
              )) : (
                <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '16px', color: '#94a3b8' }}>条件に一致する店舗はありません</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// 🆕 店舗カードコンポーネント（コードを整理）
function ShopCard({ shop, index, editingShopId, setEditingShopId, editState, onUpdate, onDelete, onToggleSuspension, onCopy, categories }) {
  const isEditing = editingShopId === shop.id;
  const isSuspended = shop.is_suspended;

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: isSuspended ? '2px solid #ef4444' : '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', opacity: isSuspended ? 0.8 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div>
          <span style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#64748b' }}>No.{index}</span>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
               <div style={{ display: 'flex', gap: '5px' }}>
                <input value={editState.editOwnerName} onChange={(e) => editState.setEditOwnerName(e.target.value)} style={smallInput} placeholder="代表者名" />
                <input value={editState.editOwnerNameKana} onChange={(e) => editState.setEditOwnerNameKana(e.target.value)} style={smallInput} placeholder="かな" />
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input value={editState.editName} onChange={(e) => editState.setEditName(e.target.value)} style={smallInput} placeholder="店舗名" />
                <input value={editState.editKana} onChange={(e) => editState.setEditKana(e.target.value)} style={smallInput} placeholder="店舗かな" />
              </div>
              <select value={editState.editBusinessType} onChange={(e) => editState.setEditBusinessType(e.target.value)} style={smallInput}>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <input value={editState.editEmail} onChange={(e) => editState.setEditEmail(e.target.value)} style={smallInput} placeholder="メール" />
              <input value={editState.editPhone} onChange={(e) => editState.setEditPhone(e.target.value)} style={smallInput} placeholder="電話" />
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px' }}>
                <label style={{ fontSize: '0.6rem', color: '#d97706', fontWeight: 'bold' }}>ログインパスワード</label>
                <input value={editState.editPassword} onChange={(e) => editState.setEditPassword(e.target.value)} style={{...smallInput, border:'none', background:'transparent'}} />
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => onUpdate(shop.id)} style={{...primaryBtn, flex:1, background:'#10b981'}}>保存</button>
                <button onClick={() => setEditingShopId(null)} style={{...primaryBtn, flex:1, background:'#94a3b8'}}>キャンセル</button>
              </div>
            </div>
          ) : (
            <>
              <h2 style={{ margin: '5px 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{shop.business_name} <span style={{fontSize:'0.7rem', color:'#94a3b8', fontWeight:'normal'}}>{shop.business_type}</span></h2>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>代表: {shop.owner_name} / PW: <strong style={{color:'#2563eb'}}>{shop.admin_password}</strong></div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {!isEditing && <button onClick={() => {
            setEditingShopId(shop.id);
            editState.setEditName(shop.business_name || "");
            editState.setEditKana(shop.business_name_kana || "");
            editState.setEditOwnerName(shop.owner_name || "");
            editState.setEditOwnerNameKana(shop.owner_name_kana || "");
            editState.setEditBusinessType(shop.business_type || "");
            editState.setEditEmail(shop.email_contact || "");
            editState.setEditPhone(shop.phone || "");
            editState.setEditPassword(shop.admin_password || "");
          }} style={iconActionBtn}><Edit2 size={14}/></button>}
          <button onClick={() => onDelete(shop)} style={{...iconActionBtn, color:'#ef4444'}}><Trash2 size={14}/></button>
        </div>
      </div>

      {!isEditing && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
          <UrlBox label="🔑 管理URL" url={`${window.location.origin}/admin/${shop.id}`} color="#2563eb" onCopy={onCopy} />
          <UrlBox label="📅 予約URL" url={`${window.location.origin}/shop/${shop.id}/reserve`} color="#059669" onCopy={onCopy} />
        </div>
      )}

      <button onClick={() => onToggleSuspension(shop)} style={{ width: '100%', marginTop: '15px', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', background: isSuspended ? '#10b981' : '#fee2e2', color: isSuspended ? '#fff' : '#ef4444' }}>
        {isSuspended ? '公開を再開する' : '公開を一時停止する'}
      </button>
    </div>
  );
}

function UrlBox({ label, url, color, onCopy }) {
  return (
    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <label style={{ fontSize: '0.65rem', color, fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{label}</label>
      <div style={{ display: 'flex', gap: '5px' }}>
        <input readOnly value={url} style={{ flex: 1, padding: '5px', fontSize: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }} />
        <button onClick={() => onCopy(url)} style={miniIconBtn}><Copy size={12}/></button>
        <a href={url} target="_blank" rel="noreferrer" style={{...miniIconBtn, background: color, color: '#fff', border: 'none'}}><ExternalLink size={12}/></a>
      </div>
    </div>
  );
}

function CategoryRow({ cat, onSave }) {
  const [enName, setEnName] = useState(cat.en_name || "");
  const [imgUrl, setImgUrl] = useState(cat.image_url || "");
  return (
    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #eee' }}>
      <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '5px' }}>{cat.name}</div>
      <input value={enName} onChange={(e) => setEnName(e.target.value)} placeholder="EN Name" style={{...smallInput, marginBottom:'5px', fontSize:'0.75rem'}} />
      <div style={{ display: 'flex', gap: '5px' }}>
        <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="Image URL" style={{...smallInput, flex:1, fontSize:'0.75rem'}} />
        <button onClick={() => onSave(cat.id, enName, imgUrl)} style={{...miniIconBtn, background:'#10b981', color:'#fff', border:'none'}}><Save size={14}/></button>
      </div>
    </div>
  );
}

// --- Styles ---
const isPC = window.innerWidth > 1024;
const smallInput = { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', background: '#fff' };
const panelStyle = { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const panelTitle = { marginTop: 0, fontSize: '1rem', color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };
const primaryBtn = { width: '100%', padding: '14px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const secondaryBtn = { width: '100%', padding: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' };
const statsCard = { background: '#fff', padding: '15px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' };
const statsLabel = { fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' };
const statsValue = { fontSize: '1.4rem', fontWeight: '900', color: '#1e293b' };
const iconActionBtn = { padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b' };
const miniIconBtn = { padding: '6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default SuperAdmin;