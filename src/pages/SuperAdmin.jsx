import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function SuperAdmin() {
  const [newShopName, setNewShopName] = useState('');
  const [newShopKana, setNewShopKana] = useState('');
  const [createdShops, setCreatedShops] = useState([]);
  const [sortType, setSortType] = useState('number_desc');
  
  // 編集用のState
  const [editingShopId, setEditingShopId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editKana, setEditKana] = useState('');

  const DELETE_PASSWORD = "1212";

  useEffect(() => {
    fetchCreatedShops();
  }, []);

  const fetchCreatedShops = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (data) setCreatedShops(data);
  };

  const createNewShop = async () => {
    if (!newShopName || !newShopKana) return alert('店舗名とふりがなを入力してください');
    const { error } = await supabase
      .from('profiles')
      .insert([{ business_name: newShopName, business_name_kana: newShopKana }]);

    if (error) {
      alert('作成に失敗しました');
    } else {
      setNewShopName(''); setNewShopKana('');
      fetchCreatedShops();
      alert(`「${newShopName}」を作成しました！`);
    }
  };

  const updateShopInfo = async (id) => {
    if (!editName || !editKana) return alert('店舗名とふりがなを入力してください');
    
    const { error } = await supabase
      .from('profiles')
      .update({ business_name: editName, business_name_kana: editKana })
      .eq('id', id);

    if (!error) {
      setEditingShopId(null);
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
      
      {/* 新規作成エリア */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: '#1e293b', marginBottom: '15px' }}>🆕 新規店舗の発行</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={newShopName} onChange={(e) => setNewShopName(e.target.value)} placeholder="店舗名" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
          <input value={newShopKana} onChange={(e) => setNewShopKana(e.target.value)} placeholder="ふりがな" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
          <button onClick={createNewShop} style={{ padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>店舗を発行する</button>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                    {/* ここがエラーの修正箇所：valueに空文字ガードを入れました */}
                    <input value={editName || ""} onChange={(e) => setEditName(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2563eb', fontSize: '1rem' }} placeholder="店舗名" />
                    <input value={editKana || ""} onChange={(e) => setEditKana(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2563eb', fontSize: '1rem' }} placeholder="ふりがな" />
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
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{shop.business_name_kana}</div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => { setEditingShopId(shop.id); setEditName(shop.business_name || ""); setEditKana(shop.business_name_kana || ""); }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px' }}>編集</button>
                <button onClick={() => deleteShop(shop)} style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px' }}>消去</button>
              </div>
            </div>

            {/* URLコピー・リンクボタン */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>🔑 店舗主用設定</label>
                <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                  <input readOnly value={`${window.location.origin}/admin/${shop.id}`} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  <button onClick={() => copyToClipboard(`${window.location.origin}/admin/${shop.id}`)} style={{ padding: '8px 10px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #2563eb', color: '#2563eb', background: '#fff' }}>コピー</button>
                  <a href={`${window.location.origin}/admin/${shop.id}`} target="_blank" rel="noreferrer" style={{ padding: '8px 10px', fontSize: '0.7rem', borderRadius: '6px', background: '#2563eb', color: '#fff', textDecoration: 'none', textAlign: 'center' }}>開く</a>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>📅 お客様用予約</label>
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

export default SuperAdmin;