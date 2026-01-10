import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Home() {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_suspended', false)
        .not('business_name', 'is', null)
        .order('business_name_kana', { ascending: true });
      
      if (data) setShops(data);
    };
    fetchShops();
  }, []);

  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: '"Hiragino Sans", "Meiryo", sans-serif', color: '#333' }}>
      
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '2px solid #e60012', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <h1 style={{ color: '#e60012', fontSize: '1.6rem', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>SnipSnap</h1>
          <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '10px', marginTop: '5px' }}>予約ポータルサイト</span>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        
        <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
          <p style={{ fontSize: '0.9rem', color: '#333', margin: 0 }}>
            現在掲載中の店舗：<b>{shops.length}</b> 件
          </p>
        </div>
        
        {shops.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', background: '#fff', borderRadius: '8px' }}>
            <p style={{ color: '#999' }}>掲載店舗を準備中です。</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {shops.map(shop => (
              <div key={shop.id} style={{ 
                background: '#fff', 
                border: '1px solid #ddd', 
                display: 'flex', 
                overflow: 'hidden',
                borderRadius: '8px',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
                  {/* 左側：店舗画像 */}
                  <div style={{ 
                    width: '120px', 
                    minWidth: '120px', 
                    background: '#eeeeee',
                    backgroundImage: shop.image_url ? `url(${shop.image_url})` : 'none', 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: '#ccc'
                  }}>
                    {!shop.image_url && 'NO IMAGE'}
                  </div>

                  {/* 右側：店舗情報 */}
                  <div style={{ padding: '15px', flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#333', fontWeight: 'bold' }}>
                      {shop.business_name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.5', marginBottom: '10px' }}>
                      {shop.description || '店舗の詳細情報は準備中です。'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>
                      📍 {shop.address || '住所未登録'}
                    </div>
                  </div>
                </div>

                {/* 💡 3つのボタンエリア */}
                <div style={{ display: 'flex', padding: '10px', gap: '8px', background: '#fafafa' }}>
                  
                  {/* LINEで予約ボタン */}
                  {shop.line_official_url ? (
                    <a href={shop.line_official_url} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                      <div style={{ background: '#00b900', color: '#fff', textAlign: 'center', padding: '10px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>💬 LINE予約</div>
                    </a>
                  ) : (
                    <div style={{ flex: 1, background: '#e2e8f0', color: '#94a3b8', textAlign: 'center', padding: '10px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'not-allowed' }}>💬 LINE予約</div>
                  )}

                  {/* メールで予約（SnipSnapシステム内） */}
                  <Link to={`/shop/${shop.id}/reserve`} style={{ flex: 1, textDecoration: 'none' }}>
                    <div style={{ background: '#2563eb', color: '#fff', textAlign: 'center', padding: '10px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>✉️ メール予約</div>
                  </Link>

                  {/* オフィシャルサイトボタン */}
                  {shop.official_url ? (
                    <a href={shop.official_url} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                      <div style={{ background: '#475569', color: '#fff', textAlign: 'center', padding: '10px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>🌐 公式サイト</div>
                    </a>
                  ) : (
                    <div style={{ flex: 1, background: '#e2e8f0', color: '#94a3b8', textAlign: 'center', padding: '10px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'not-allowed' }}>🌐 公式サイト</div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999', fontSize: '0.7rem' }}>
        © 2026 SnipSnap 予約ポータル
      </div>
    </div>
  );
}

export default Home;