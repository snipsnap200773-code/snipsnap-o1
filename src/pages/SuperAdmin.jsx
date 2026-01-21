import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
// 🆕 アイコンを追加
import { MapPin, Plus, Trash2, Save, Image as ImageIcon, Bell } from 'lucide-react';

function SuperAdmin() {
  // 🆕 管理者ログイン用の追加State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPass, setInputPass] = useState('');

  // 💡 修正箇所：Vercelの設定名（MASTER / DELETE）に合わせました
  const MASTER_PASSWORD = import.meta.env.VITE_SUPER_MASTER_PASSWORD; 
  const DELETE_PASSWORD = import.meta.env.VITE_SUPER_DELETE_PASSWORD;

  // --- 既存の店舗管理State群 ---
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

  // 🆕 ポータルコンテンツ管理用のState
  const [newsList, setNewsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  // お知らせ新規作成用
  const [newNewsDate, setNewNewsDate] = useState('');
  const [newNewsCat, setNewNewsCat] = useState('お知らせ');
  const [newNewsTitle, setNewNewsTitle] = useState('');

  // ログイン済みの場合のみデータを取得
  useEffect(() => { 
    if (isAuthorized) {
      fetchCreatedShops(); 
      fetchPortalContent(); // 🆕 ポータル用データの取得
    }
  }, [isAuthorized]);

  // 🆕 ポータルコンテンツ取得
  const fetchPortalContent = async () => {
    const { data: news } = await supabase.from('portal_news').select('*').order('publish_date', { ascending: false });
    if (news) setNewsList(news);
    const { data: cats } = await supabase.from('portal_categories').select('*').order('sort_order', { ascending: true });
    if (cats) setCategoriesList(cats);
  };

  // 🆕 パスワードチェック関数
  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPass === MASTER_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert('パスワードが違います');
    }
  };

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
    const { error } = await supabase.from('profiles').update({ 
      business_name: editName, 
      business_name_kana: editKana, 
      owner_name: editOwnerName, 
      owner_name_kana: editOwnerNameKana, 
      business_type: editBusinessType, 
      email_contact: editEmail, 
      phone: editPhone, 
      admin_password: editPassword, 
      line_channel_access_token: editLineToken || targetShop.line_channel_access_token, 
      line_admin_user_id: editLineAdminId || targetShop.line_admin_user_id 
    }).eq('id', id);
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
      const inputPassForDelete = window.prompt("削除用パスワードを入力してください：");
      if (inputPassForDelete === DELETE_PASSWORD) {
        const { error } = await supabase.from('profiles').delete().eq('id', shop.id);
        if (!error) { 
          fetchCreatedShops(); 
          alert('店舗を削除しました。'); 
        } else {
          alert(`削除に失敗しました。\n理由: ${error.message}`);
        }
      } else if (inputPassForDelete !== null) { 
        alert('パスワードが違います。'); 
      }
    }
  };

  // 🆕 お知らせ追加
  const addNews = async () => {
    if (!newNewsDate || !newNewsTitle) return alert('日付とタイトルを入力してください');
    const { error } = await supabase.from('portal_news').insert([{ 
      publish_date: newNewsDate, 
      category: newNewsCat, 
      title: newNewsTitle 
    }]);
    if (!error) {
      setNewNewsDate(''); setNewNewsTitle(''); fetchPortalContent();
    }
  };

  // 🆕 お知らせ削除
  const deleteNews = async (id) => {
    if (window.confirm('このお知らせを削除しますか？')) {
      await supabase.from('portal_news').delete().eq('id', id);
      fetchPortalContent();
    }
  };

  // 🆕 カテゴリ更新
  const updateCategory = async (id, enName, imgUrl) => {
    const { error } = await supabase.from('portal_categories').update({ 
      en_name: enName, 
      image_url: imgUrl 
    }).eq('id', id);
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
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px' }}>統括管理パスワードを入力してください</p>
          <input 
            type="password" 
            value={inputPass} 
            onChange={(e) => setInputPass(e.target.value)} 
            placeholder="パスワード" 
            style={{ ...smallInput, textAlign: 'center', marginBottom: '20px' }}
            autoFocus
          />
          <button type="submit" style={{ width: '100%', padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            ログイン
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', borderLeft: '6px solid #e60012', paddingLeft: '15px', marginBottom: '25px', color: '#1e293b' }}>🛠 ソロプレ統括管理</h1>

        {/* --- 🆕 セクション 1: 最新トピック管理 --- */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#e60012" /> 最新トピックの管理
          </h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <input value={newNewsDate} onChange={(e) => setNewNewsDate(e.target.value)} placeholder="日付 (2026.01.21)" style={{ ...smallInput, flex: 1 }} />
            <select value={newNewsCat} onChange={(e) => setNewNewsCat(e.target.value)} style={{ ...smallInput, flex: 1 }}>
              <option value="お知らせ">お知らせ</option>
              <option value="重要">重要</option>
              <option value="新機能">新機能</option>
              <option value="キャンペーン">キャンペーン</option>
            </select>
          </div>
          <textarea value={newNewsTitle} onChange={(e) => setNewNewsTitle(e.target.value)} placeholder="トピックのタイトル内容" style={{ ...smallInput, height: '60px', marginBottom: '10px' }} />
          <button onClick={addNews} style={{ width: '100%', padding: '12px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <Plus size={18} /> トピックを追加
          </button>
          
          <div style={{ marginTop: '20px', maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
            {newsList.map(n => (
              <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                <div style={{ fontSize: '0.75rem' }}>
                  <span style={{ color: '#999', marginRight: '8px' }}>{n.publish_date}</span>
                  <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', marginRight: '8px' }}>{n.category}</span>
                  <span style={{ color: '#333' }}>{n.title}</span>
                </div>
                <button onClick={() => deleteNews(n.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* --- 🆕 セクション 2: カテゴリ画像・英語名管理 --- */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ImageIcon size={18} color="#2563eb" /> カテゴリデザイン管理
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {categoriesList.map(cat => (
              <CategoryRow key={cat.id} cat={cat} onSave={updateCategory} />
            ))}
          </div>
        </div>

        {/* --- 既存の店舗管理セクション --- */}
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
              <option value="ネイル・アイラッシュ">ネイル・アイラッシュ</option>
              <option value="エステ・リラク">エステ・リラク</option>
              <option value="整体・接骨院・針灸">整体・接骨院・針灸</option>
              <option value="飲食店・カフェ">飲食店・カフェ</option>
              <option value="その他・ライフ">その他・ライフ</option>
            </select>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="メールアドレス" style={smallInput} />
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="電話番号" style={smallInput} />
            <button onClick={createNewShop} style={{ padding: '14px', background: '#e60012', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>店舗を発行する</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {getSortedShops().map(shop => (
            <div key={shop.id} style={{ background: '#fff', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 'bold' }}>No.{shop.displayNumber}</div>
                  {editingShopId === shop.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input value={editOwnerName} onChange={(e) => setEditOwnerName(e.target.value)} style={smallInput} placeholder="代表者名" />
                        <input value={editOwnerNameKana} onChange={(e) => setEditOwnerNameKana(e.target.value)} style={smallInput} placeholder="氏名かな" />
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} style={smallInput} placeholder="店舗名" />
                        <input value={editKana} onChange={(e) => setEditKana(e.target.value)} style={smallInput} placeholder="店舗かな" />
                      </div>
                      <select value={editBusinessType} onChange={(e) => setEditBusinessType(e.target.value)} style={smallInput}>
                        <option value="">-- 業種を選択 --</option>
                        <option value="美容室・理容室">美容室・理容室</option>
                        <option value="ネイル・アイラッシュ">ネイル・アイラッシュ</option>
                        <option value="エステ・リラク">エステ・リラク</option>
                        <option value="整体・接骨院・針灸">整体・接骨院・針灸</option>
                        <option value="飲食店・カフェ">飲食店・カフェ</option>
                        <option value="その他・ライフ">その他・ライフ</option>
                      </select>
                      <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={smallInput} placeholder="メールアドレス" />
                      <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={smallInput} placeholder="電話番号" />
                      <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '6px' }}>
                        <label style={{ fontSize: '0.6rem', color: '#d97706', fontWeight: 'bold' }}>PW設定</label>
                        <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} style={{ ...smallInput, border: '1px solid #fcd34d' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <button onClick={() => updateShopInfo(shop.id)} style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>保存</button>
                        <button onClick={() => setEditingShopId(null)} style={{ flex: 1, padding: '12px', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{shop.business_name}</h2>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{shop.owner_name} / PW: <strong>{shop.admin_password}</strong></div>
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
                  }} style={actionBtnStyle}>編集</button>
                  <button onClick={() => deleteShop(shop)} style={{ ...actionBtnStyle, color: '#ef4444' }}>消去</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {[
                  { label: '🔑 店舗主用設定', url: `${window.location.origin}/admin/${shop.id}`, color: '#2563eb' },
                  { label: '💬 LINEメニュー用', url: `${window.location.origin}/shop/${shop.id}/reserve?openExternalBrowser=1`, color: '#00b900' },
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

// 🆕 カテゴリ編集用の個別コンポーネント（管理を楽にするため）
function CategoryRow({ cat, onSave }) {
  const [enName, setEnName] = useState(cat.en_name || "");
  const [imgUrl, setImgUrl] = useState(cat.image_url || "");

  return (
    <div style={{ border: '1px solid #f0f0f0', padding: '12px', borderRadius: '10px', background: '#fcfcfc' }}>
      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', color: '#1e293b' }}>{cat.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input value={enName} onChange={(e) => setEnName(e.target.value)} placeholder="英語名 (例: HAIR & BEAUTY)" style={{ ...smallInput, padding: '6px 10px', fontSize: '0.75rem' }} />
        <div style={{ display: 'flex', gap: '5px' }}>
          <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="背景画像URL (Unsplash等)" style={{ ...smallInput, padding: '6px 10px', fontSize: '0.75rem', flex: 1 }} />
          <button onClick={() => onSave(cat.id, enName, imgUrl)} style={{ ...openBtnStyle, background: '#10b981', padding: '6px 12px' }}><Save size={14} /></button>
        </div>
      </div>
    </div>
  );
}

const smallInput = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' };
const actionBtnStyle = { background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontSize: '0.65rem', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' };
const iconBtnStyle = { padding: '8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' };
const openBtnStyle = { padding: '8px 12px', fontSize: '0.7rem', borderRadius: '6px', background: '#2563eb', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer', border: 'none' };

export default SuperAdmin;