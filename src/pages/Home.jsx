import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Home() {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 100);

    const fetchShops = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_suspended', false)
        .not('business_name', 'is', null)
        .order('business_name_kana', { ascending: true });
      
      if (data) {
        const sortedShops = [...data].sort((a, b) => {
          if (a.business_name === '美容室SnipSnap') return -1;
          if (b.business_name === '美容室SnipSnap') return 1;
          return (a.business_name_kana || "").localeCompare(b.business_name_kana || "", 'ja');
        });
        setShops(sortedShops);
      }
    };

    fetchShops();
    return () => clearTimeout(scrollTimer);
  }, []);

  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: '"Hiragino Sans", "Meiryo", sans-serif', color: '#333' }}>
      
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '2px solid #e60012', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <h1 style={{ color: '#e60012', fontSize: '1.6rem', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>ソロプレ（Solopreneur）</h1>
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

                <div style={{ display: 'flex', padding: '10px', gap: '8px', background: '#fafafa' }}>
                  {shop.line_official_url ? (
                    <a href={shop.line_official_url} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                      <div style={{ background: '#00b900', color: '#fff', textAlign: 'center', padding: '10px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>💬 LINE予約</div>
                    </a>
                  ) : (
                    <div style={{ flex: 1, background: '#e2e8f0', color: '#94a3b8', textAlign: 'center', padding: '10px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'not-allowed' }}>💬 LINE予約</div>
                  )}

                  <Link to={`/shop/${shop.id}/reserve`} style={{ flex: 1, textDecoration: 'none' }}>
                    <div style={{ background: '#2563eb', color: '#fff', textAlign: 'center', padding: '10px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>✉️ メール予約</div>
                  </Link>

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

        <div style={{ 
          marginTop: '60px', 
          padding: '40px 20px', 
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', 
          borderRadius: '20px', 
          textAlign: 'center', 
          color: '#fff',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)'
        }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', fontWeight: '900' }}>🚀 店舗オーナー様へ</h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '25px', lineHeight: '1.6' }}>
            ソロプレで、あなたの店舗専用の予約システムを作りませんか？<br />
            今ならベータ版を無料で全機能お試しいただけます。
          </p>
          <Link to="/trial-registration" style={{ 
            display: 'inline-block',
            background: '#fff', 
            color: '#2563eb', 
            padding: '14px 35px', 
            borderRadius: '50px', 
            textDecoration: 'none', 
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            ベータ版はこちら
          </Link>
          <p style={{ fontSize: '0.7rem', marginTop: '15px', opacity: 0.7 }}>
            ※正式リリース後に自動的に課金されることはありません。
          </p>
        </div>

      </div>

      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999', fontSize: '0.7rem' }}>
        {/* 🆕 隠しリンク：開発中のOnePlayポータルへ */}
        <Link to="/oneplay-portal" style={{ color: '#999', textDecoration: 'none' }}>
          © 2026 ソロプレ 予約ポータル
        </Link>
      </div>
    </div>
  );
}

export default Home;