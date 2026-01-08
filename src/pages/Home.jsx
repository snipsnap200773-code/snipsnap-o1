import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Home() {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      // business_nameが設定されており、かつ is_suspended が false（中止されていない）店舗を取得
      // 並び替えは「ふりがな順」
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '50px' }}>
      <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '20px', borderBottom: '2px solid #2563eb', paddingBottom: '10px' }}>
        SnipSnap 総合ポータル
      </h2>
      
      {shops.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', marginTop: '50px' }}>現在、予約可能な店舗はありません。</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {shops.map(shop => (
            <Link key={shop.id} to={`/shop/${shop.id}/reserve`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ 
                border: '1px solid #e2e8f0', 
                padding: '20px', 
                borderRadius: '16px', 
                background: 'white',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
              >
                {/* 店舗名 */}
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.2rem', fontWeight: 'bold' }}>{shop.business_name}</h3>
                
                {/* 店舗説明（メッセージ） */}
                {shop.description && (
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: '#64748b', 
                    margin: '0 0 15px 0', 
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2, // 2行以上は「...」で省略
                    overflow: 'hidden'
                  }}>
                    {shop.description}
                  </p>
                )}

                {/* 店舗詳細情報 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  {shop.address && (
                    <p style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '8px', margin: 0 }}>
                      <span style={{ fontSize: '1rem' }}>📍</span> 
                      <span>{shop.address}</span>
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    <p style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <span style={{ fontSize: '1rem' }}>📞</span> {shop.phone || '未設定'}
                    </p>
                  </div>
                </div>

                {/* 予約ボタン風ラベル */}
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    background: '#2563eb', 
                    color: '#fff', 
                    padding: '6px 16px', 
                    borderRadius: '20px', 
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                  }}>
                    空き状況を確認・予約 →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;