import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminManagement() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  // --- 状態管理 ---
  const [activeMenu, setActiveMenu] = useState('home'); // 現在表示中の機能
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', shopId).single();
      if (data) setShop(data);
      setLoading(false);
    };
    fetchShop();
  }, [shopId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', background: '#b19cd9', minHeight: '100vh' }}>読み込み中...</div>;

  // --- スタイル定義 ---
  const containerStyle = {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: '#b19cd9', // 基調となる紫
    fontFamily: '"MS PGothic", "Hiragino Kaku Gothic ProN", sans-serif',
    overflow: 'hidden'
  };

  // 左カラム（メニュー）
  const sidebarStyle = {
    width: '300px',
    background: '#e0d7f7',
    borderRight: '2px solid #4b2c85',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto'
  };

  // 右カラム（コンテンツ表示エリア）
  const contentAreaStyle = {
    flex: 1,
    padding: '30px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  };

  const btnStyle = (id, color) => ({
    width: '100%',
    padding: '15px',
    background: activeMenu === id ? '#fff' : color, // 選択中は白抜き
    color: activeMenu === id ? '#000' : '#fff',
    border: '1px solid #000',
    borderRadius: '2px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: activeMenu === id ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : '2px 2px 0px rgba(0,0,0,0.5)',
    textAlign: 'center',
    transition: '0.2s'
  });

  const sectionLabelStyle = {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#4b2c85',
    marginTop: '15px',
    marginBottom: '5px',
    textAlign: 'center',
    borderBottom: '1px solid #4b2c85'
  };

  return (
    <div style={containerStyle}>
      
      {/* ⬅️ 左カラム：メニュー */}
      <div style={sidebarStyle}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontStyle: 'italic', margin: 0 }}>Beauty Advanced</h2>
          <p style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>SnipSnap Edition</p>
        </div>

        <button style={btnStyle('work', '#d34817')} onClick={() => setActiveMenu('work')}>日常業務</button>
        <button style={btnStyle('sales', '#f4b400')} onClick={() => setActiveMenu('sales')}>売上集計</button>

        <div style={sectionLabelStyle}>初期設定MENU</div>
        <button style={btnStyle('master_tech', '#4285f4')} onClick={() => setActiveMenu('master_tech')}>施術商品</button>
        <button style={btnStyle('master_item', '#4285f4')} onClick={() => setActiveMenu('master_item')}>店販商品</button>
        <button style={btnStyle('master_staff', '#4285f4')} onClick={() => setActiveMenu('master_staff')}>スタッフ</button>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={btnStyle('home', '#9370db')} onClick={() => setActiveMenu('home')}>TOPページへ</button>
          <button style={btnStyle('#ff1493')} onClick={() => navigate(`/admin/${shopId}/reservations`)}>業 務 終 了</button>
        </div>
      </div>

      {/* ➡️ 右カラム：反映エリア */}
      <div style={contentAreaStyle}>
        
        {/* TOPページ（初期表示） */}
        {activeMenu === 'home' && (
          <div style={{ background: 'rgba(255,255,255,0.4)', padding: '30px', borderRadius: '10px', border: '3px double #fff' }}>
            <h3 style={{ borderBottom: '2px solid #4b2c85', paddingBottom: '10px' }}>ライセンス取得ユーザー情報</h3>
            <p><strong>店舗名:</strong> {shop?.business_name}</p>
            <p><strong>担当者:</strong> {shop?.owner_name}</p>
            <p><strong>TEL:</strong> {shop?.phone}</p>
            <p style={{ marginTop: '50px', textAlign: 'right', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '□')}□
            </p>
          </div>
        )}

        {/* 1. 日常業務エリア */}
        {activeMenu === 'work' && (
          <div>
            <h2 style={{ color: '#d34817', borderBottom: '2px solid #d34817' }}>日常業務 [受付/カルテ/伝票]</h2>
            <p style={{ color: '#666' }}>※ここに「受付・カルテ」のメイン画面を作成します。</p>
          </div>
        )}

        {/* 2. 売上集計エリア */}
        {activeMenu === 'sales' && (
          <div>
            <h2 style={{ color: '#f4b400', borderBottom: '2px solid #f4b400' }}>売上集計 [店舗/担当]</h2>
            <p style={{ color: '#666' }}>※ここに売上レポートのグラフや表を作成します。</p>
          </div>
        )}

        {/* 3. 施術商品エリア */}
        {activeMenu === 'master_tech' && (
          <div>
            <h2 style={{ color: '#4285f4', borderBottom: '2px solid #4285f4' }}>初期設定 [施術商品]</h2>
            <p style={{ color: '#666' }}>※ここにメニューの価格設定などを作成します。</p>
          </div>
        )}

        {/* 4. 店販商品エリア */}
        {activeMenu === 'master_item' && (
          <div>
            <h2 style={{ color: '#4285f4', borderBottom: '2px solid #4285f4' }}>初期設定 [店販商品]</h2>
            <p style={{ color: '#666' }}>※ここに物販（ワックス等）の管理画面を作成します。</p>
          </div>
        )}

        {/* 5. スタッフエリア */}
        {activeMenu === 'master_staff' && (
          <div>
            <h2 style={{ color: '#4285f4', borderBottom: '2px solid #4285f4' }}>初期設定 [スタッフ]</h2>
            <p style={{ color: '#666' }}>※ここにスタッフ登録画面を作成します。</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminManagement;