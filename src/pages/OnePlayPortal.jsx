import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function OnePlayPortal() {
  const [shops, setShops] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 💡 スライダーに表示する画像と情報の定義
  const sliderImages = [
    { id: 1, url: 'https://images.unsplash.com/photo-1600880210836-8f8fe100a35c?auto=format&fit=crop&w=1200&q=80', title: '自分らしく、働く。', desc: 'ソロ起業家を支えるポータルサイト' },
    { id: 2, url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80', title: '次世代の予約管理', desc: 'SnipSnapでビジネスを加速させる' },
    { id: 3, url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', title: '新しい繋がりを。', desc: 'あなたのサービスを世界へ届けよう' },
  ];

  useEffect(() => {
    // 🆕 スクロールリセット
    const scrollTimer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 100);

    // 🆕 自動スライダーのタイマー設定（5秒ごとに切り替え）
    const sliderTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
    }, 5000);

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
    return () => {
      clearTimeout(scrollTimer);
      clearInterval(sliderTimer); // タイマー解除（メモリリーク防止）
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: '"Hiragino Sans", "Meiryo", sans-serif', color: '#333', width: '100%' }}>
      
      {/* 1. ヘッダーエリア */}
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ color: '#e60012', fontSize: '1.6rem', fontWeight: '900', margin: 0, letterSpacing: '-1.5px' }}>ソロプレ</h1>
            <div style={{ height: '20px', width: '1px', background: '#ccc', margin: '0 12px' }}></div>
            <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold' }}>Solopreneur Portal</span>
          </div>
          {/* ETC風のハンバーガーメニュー（見た目だけ） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', cursor: 'pointer' }}>
            <div style={{ width: '25px', height: '2px', background: '#333' }}></div>
            <div style={{ width: '25px', height: '2px', background: '#333' }}></div>
            <div style={{ width: '25px', height: '2px', background: '#333' }}></div>
          </div>
        </div>
      </div>

      {/* 2. 🆕 自動カルーセルスライダー（ETCポータル風） */}
      <div style={{ width: '100%', position: 'relative', height: '280px', overflow: 'hidden', background: '#000' }}>
        {sliderImages.map((slide, index) => (
          <div
            key={slide.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url(${slide.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 10px 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)', transform: index === currentSlide ? 'translateY(0)' : 'translateY(20px)', transition: '0.8s ease-out' }}>
              {slide.title}
            </h2>
            <p style={{ fontSize: '0.9rem', margin: 0, textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
              {slide.desc}
            </p>
          </div>
        ))}
        
        {/* インジケーター（下のドット） */}
        <div style={{ position: 'absolute', bottom: '15px', width: '100%', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {sliderImages.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentSlide(i)}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: '0.3s'
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* 3. メインコンテンツ */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '25px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#333', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>SHOP</span>
            掲載中の店舗
          </h3>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            合計 <b>{shops.length}</b> 件
          </span>
        </div>
        
        {shops.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#999' }}>掲載店舗を準備中です。</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {shops.map(shop => (
              <div key={shop.id} style={{ 
                background: '#fff', 
                border: '1px solid #eee', 
                display: 'flex', 
                overflow: 'hidden',
                borderRadius: '16px',
                flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #f8f8f8' }}>
                  {/* 左側：店舗画像 */}
                  <div style={{ 
                    width: '140px', 
                    minWidth: '140px', 
                    height: '140px',
                    background: '#f0f0f0',
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
                  <div style={{ padding: '20px', flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', color: '#1a1a1a', fontWeight: 'bold' }}>
                      {shop.business_name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.6', marginBottom: '12px' }}>
                      {shop.description || '店舗の詳細情報は準備中です。'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      📍 {shop.address || '住所未登録'}
                    </div>
                  </div>
                </div>

                {/* ボタンエリア */}
                <div style={{ display: 'flex', padding: '15px', gap: '10px', background: '#fff' }}>
                  <Link to={`/shop/${shop.id}/reserve`} style={{ flex: 1.2, textDecoration: 'none' }}>
                    <div style={{ background: '#2563eb', color: '#fff', textAlign: 'center', padding: '12px 0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}>✉️ 予約手続きへ</div>
                  </Link>
                  <div style={{ flex: 1, background: '#f1f5f9', color: '#475569', textAlign: 'center', padding: '12px 0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>🌐 詳細・地図</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', marginTop: '40px', borderTop: '1px solid #eee' }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>
           ← 本番のソロプレへ戻る
        </Link>
        <p style={{ margin: '20px 0 0 0', fontSize: '0.7rem', color: '#bbb' }}>© 2026 Solopreneur Portal SoloPre</p>
      </div>
    </div>
  );
}

export default OnePlayPortal;