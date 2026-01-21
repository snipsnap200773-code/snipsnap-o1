import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  MapPin, Plus, Trash2, Save, Image as ImageIcon, Bell, Search, 
  Filter, Store, UserCheck, ShieldAlert, Copy, ExternalLink, 
  Edit2, PlusSquare, Settings, List
} from 'lucide-react';

function SuperAdmin() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPass, setInputPass] = useState('');

  const MASTER_PASSWORD = import.meta.env.VITE_SUPER_MASTER_PASSWORD; 
  const DELETE_PASSWORD = import.meta.env.VITE_SUPER_DELETE_PASSWORD;

  // --- 状態管理 ---
  const [createdShops, setCreatedShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('すべて');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // 🆕 スマホ用タブ管理 ('list', 'add', 'config')
  const [activeTab, setActiveTab] = useState('list');

  // --- フォームState (省略なし) ---
  const [newShopName, setNewShopName] = useState('');
  const [newShopKana, setNewShopKana] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerNameKana, setNewOwnerNameKana] = useState('');
  const [newBusinessType, setNewBusinessType] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLineToken, setNewLineToken] = useState('');
  const [newLineAdminId, setNewLineAdminId] = useState('');

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

  const [newsList, setNewsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [newNewsDate, setNewNewsDate] = useState('');
  const [newNewsCat, setNewNewsCat] = useState('お知らせ');
  const [newNewsTitle, setNewNewsTitle] = useState('');

  // 画面幅監視
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 1024;

  useEffect(() => { 
    if (isAuthorized) fetchAllData(); 
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

  const filteredShops = useMemo(() => {
    return createdShops.filter(shop => {
      const matchSearch = (shop.business_name || "").includes(searchTerm) || (shop.owner_name || "").includes(searchTerm) || (shop.phone || "").includes(searchTerm);
      const matchCat = activeCategory === 'すべて' || shop.business_type === activeCategory;
      return matchSearch && matchCat;
    });
  }, [createdShops, searchTerm, activeCategory]);

  const stats = useMemo(() => ({
    total: createdShops.length,
    active: createdShops.filter(s => !s.is_suspended).length,
    suspended: createdShops.filter(s => s.is_suspended).length
  }), [createdShops]);

  // --- 既存ロジック (完全維持) ---
  const createNewShop = async () => {
    if (!newShopName || !newShopKana || !newOwnerName) return alert('必須項目を入力してください');
    const newPass = Math.random().toString(36).slice(-8);
    const { error } = await supabase.from('profiles').insert([{ business_name: newShopName, business_name_kana: newShopKana, owner_name: newOwnerName, owner_name_kana: newOwnerNameKana, business_type: newBusinessType, email_contact: newEmail, phone: newPhone, admin_password: newPass, line_channel_access_token: newLineToken, line_admin_user_id: newLineAdminId, notify_line_enabled: true }]);
    if (!error) {
      alert(`「${newShopName}」作成完了！ PW: ${newPass}`);
      setNewShopName(''); fetchCreatedShops(); setActiveTab('list');
    }
  };

  const updateShopInfo = async (id) => {
    const { error } = await supabase.from('profiles').update({ business_name: editName, business_name_kana: editKana, owner_name: editOwnerName, owner_name_kana: editOwnerNameKana, business_type: editBusinessType, email_contact: editEmail, phone: editPhone, admin_password: editPassword }).eq('id', id);
    if (!error) { setEditingShopId(null); fetchCreatedShops(); alert('更新完了'); }
  };

  const toggleSuspension = async (shop) => {
    const { error } = await supabase.from('profiles').update({ is_suspended: !shop.is_suspended }).eq('id', shop.id);
    if (!error) fetchCreatedShops();
  };

  const deleteShop = async (shop) => {
    const input = window.prompt("削除パスワードを入力してください：");
    if (input === DELETE_PASSWORD) {
      const { error } = await supabase.from('profiles').delete().eq('id', shop.id);
      if (!error) { fetchCreatedShops(); alert('削除完了'); }
    }
  };

  const addNews = async () => {
    const { error } = await supabase.from('portal_news').insert([{ publish_date: newNewsDate, category: newNewsCat, title: newNewsTitle }]);
    if (!error) { setNewNewsDate(''); setNewNewsTitle(''); fetchPortalContent(); }
  };

  const deleteNews = async (id) => {
    if (window.confirm('削除しますか？')) {
      await supabase.from('portal_news').delete().eq('id', id);
      fetchPortalContent();
    }
  };

  const updateCategory = async (id, enName, imgUrl) => {
    await supabase.from('portal_categories').update({ en_name: enName, image_url: imgUrl }).eq('id', id);
    alert('更新完了');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('コピーしました');
  };

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', width: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#e60012', marginBottom: '20px', fontWeight: '900' }}>ソロプレ Admin</h2>
          <input type="password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} placeholder="PW" style={smallInput} autoFocus />
          <button type="submit" style={{ ...primaryBtn, marginTop: '15px' }}>ログイン</button>
        </form>
      </div>
    );
  }

  // 🆕 各種コンテンツレンダラー
  const renderShopList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={panelStyle}>
        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
          <input type="text" placeholder="店舗・代表者・電話で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...smallInput, paddingLeft: '40px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
          {['すべて', ...categoriesList.map(c => c.name)].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', background: activeCategory === cat ? '#1e293b' : '#f1f5f9', color: activeCategory === cat ? '#fff' : '#64748b' }}>{cat}</button>
          ))}
        </div>
      </div>
      {filteredShops.map((shop, index) => (
        <ShopCard key={shop.id} shop={shop} index={createdShops.length - createdShops.findIndex(s => s.id === shop.id)} editingShopId={editingShopId} setEditingShopId={setEditingShopId} editState={{ editName, setEditName, editKana, setEditKana, editOwnerName, setEditOwnerName, editOwnerNameKana, setEditOwnerNameKana, editBusinessType, setEditBusinessType, editEmail, setEditEmail, editPhone, setEditPhone, editPassword, setEditPassword }} onUpdate={updateShopInfo} onDelete={deleteShop} onToggleSuspension={toggleSuspension} onCopy={copyToClipboard} categories={categoriesList} />
      ))}
    </div>
  );

  const renderAddShop = () => (
    <div style={panelStyle}>
      <h3 style={panelTitle}><PlusSquare size={18} /> 新規店舗の発行</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder="代表者名" style={smallInput} />
        <input value={newShopName} onChange={(e) => setNewShopName(e.target.value)} placeholder="店舗名" style={smallInput} />
        <select value={newBusinessType} onChange={(e) => setNewBusinessType(e.target.value)} style={smallInput}>
          <option value="">-- 業種を選択 --</option>
          {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="メール" style={smallInput} />
        <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="電話" style={smallInput} />
        <button onClick={createNewShop} style={primaryBtn}>発行してリストへ戻る</button>
      </div>
    </div>
  );

  const renderPortalSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={panelStyle}>
        <h3 style={panelTitle}><Bell size={18} /> トピック管理</h3>
        <input value={newNewsTitle} onChange={(e) => setNewNewsTitle(e.target.value)} placeholder="タイトル内容" style={smallInput} />
        <button onClick={addNews} style={{ ...secondaryBtn, width: '100%', marginTop: '10px' }}>お知らせ追加</button>
        <div style={{ marginTop: '15px' }}>
          {newsList.map(n => <div key={n.id} style={newsItemStyle}><span>{n.title}</span><Trash2 size={14} onClick={() => deleteNews(n.id)} /></div>)}
        </div>
      </div>
      <div style={panelStyle}>
        <h3 style={panelTitle}><ImageIcon size={18} /> カテゴリデザイン</h3>
        {categoriesList.map(cat => <CategoryRow key={cat.id} cat={cat} onSave={updateCategory} />)}
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', paddingBottom: isMobile ? '100px' : '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '15px' }}>
        
        {/* 統計エリア */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto' }}>
          <div style={statsCard}>全 {stats.total}</div>
          <div style={{ ...statsCard, color: '#10b981' }}>公開 {stats.active}</div>
          <div style={{ ...statsCard, color: '#ef4444' }}>停止 {stats.suspended}</div>
        </div>

        {isMobile ? (
          // 📱 スマホ用表示
          <div>
            {activeTab === 'list' && renderShopList()}
            {activeTab === 'add' && renderAddShop()}
            {activeTab === 'config' && renderPortalSettings()}
            
            {/* ボトムナビゲーション */}
            <div style={bottomNavStyle}>
              <button onClick={() => setActiveTab('list')} style={activeTab === 'list' ? navBtnActive : navBtn}><List size={20} /><span>一覧</span></button>
              <button onClick={() => setActiveTab('add')} style={activeTab === 'add' ? navBtnActive : navBtn}><PlusSquare size={20} /><span>新規</span></button>
              <button onClick={() => setActiveTab('config')} style={activeTab === 'config' ? navBtnActive : navBtn}><Settings size={20} /><span>設定</span></button>
            </div>
          </div>
        ) : (
          // 💻 PC用表示
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {renderAddShop()}
              {renderPortalSettings()}
            </div>
            {renderShopList()}
          </div>
        )}
      </div>
    </div>
  );
}

// 店舗カード（スマホ対応版）
function ShopCard({ shop, index, editingShopId, setEditingShopId, editState, onUpdate, onDelete, onToggleSuspension, onCopy, categories }) {
  const isEditing = editingShopId === shop.id;
  const isSuspended = shop.is_suspended;

  return (
    <div style={{ background: '#fff', padding: '15px', borderRadius: '16px', border: isSuspended ? '2px solid #ef4444' : '1px solid #e2e8f0', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#94a3b8' }}>No.{index}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Edit2 size={16} color="#64748b" onClick={() => {
            setEditingShopId(shop.id);
            editState.setEditName(shop.business_name || "");
            editState.setEditOwnerName(shop.owner_name || "");
            editState.setEditBusinessType(shop.business_type || "");
            editState.setEditPassword(shop.admin_password || "");
          }} />
          <Trash2 size={16} color="#ef4444" onClick={() => onDelete(shop)} />
        </div>
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={editState.editOwnerName} onChange={(e) => editState.setEditOwnerName(e.target.value)} style={smallInput} placeholder="代表名" />
          <input value={editState.editName} onChange={(e) => editState.setEditName(e.target.value)} style={smallInput} placeholder="店舗名" />
          <input value={editState.editPassword} onChange={(e) => editState.setEditPassword(e.target.value)} style={smallInput} placeholder="PW" />
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => onUpdate(shop.id)} style={{ ...primaryBtn, background: '#10b981' }}>保存</button>
            <button onClick={() => setEditingShopId(null)} style={{ ...primaryBtn, background: '#94a3b8' }}>閉じる</button>
          </div>
        </div>
      ) : (
        <>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{shop.business_name}</h4>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '15px' }}>{shop.owner_name} / PW: <strong>{shop.admin_password}</strong></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <UrlBox label="🔑 管理" url={`${window.location.origin}/admin/${shop.id}`} onCopy={onCopy} />
            <UrlBox label="📅 予約" url={`${window.location.origin}/shop/${shop.id}/reserve`} onCopy={onCopy} />
          </div>
          <button onClick={() => onToggleSuspension(shop)} style={{ width: '100%', marginTop: '15px', padding: '8px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 'bold', background: isSuspended ? '#10b981' : '#fee2e2', color: isSuspended ? '#fff' : '#ef4444' }}>
            {isSuspended ? '公開を再開する' : '公開を一時停止する'}
          </button>
        </>
      )}
    </div>
  );
}

function UrlBox({ label, url, onCopy }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', minWidth: '35px' }}>{label}</span>
      <input readOnly value={url} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.65rem', color: '#64748b' }} />
      <Copy size={14} color="#2563eb" onClick={() => onCopy(url)} style={{ cursor: 'pointer' }} />
    </div>
  );
}

function CategoryRow({ cat, onSave }) {
  const [enName, setEnName] = useState(cat.en_name || "");
  const [imgUrl, setImgUrl] = useState(cat.image_url || "");
  return (
    <div style={{ paddingBottom: '10px', borderBottom: '1px solid #f0f0f0', marginBottom: '10px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{cat.name}</div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="Image URL" style={{ ...smallInput, flex: 1, fontSize: '0.7rem' }} />
        <button onClick={() => onSave(cat.id, enName, imgUrl)} style={{ background: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', padding: '5px 10px' }}><Save size={14}/></button>
      </div>
    </div>
  );
}

// スタイル定数 (省略なし)
const smallInput = { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' };
const panelStyle = { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const panelTitle = { marginTop: 0, fontSize: '0.95rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' };
const primaryBtn = { width: '100%', padding: '12px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' };
const secondaryBtn = { padding: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' };
const statsCard = { background: '#fff', padding: '10px 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const newsItemStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '5px 0', borderBottom: '1px dashed #eee' };
const bottomNavStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 1000 };
const navBtn = { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94a3b8', cursor: 'pointer' };
const navBtnActive = { ...navBtn, color: '#e60012' };

export default SuperAdmin;