import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function OnePlayPortal() {
  const [shops, setShops] = useState([]);
  const [newShops, setNewShops] = useState([]); // 新着店舗用
  const [currentSlide, setCurrentSlide] = useState(0);

  // 💡 最新トピック（ニュース）のデータ
  const topics = [
    { id: 1, date: '2026.01.21', category: '重要', title: '【重要】なりすましメールにご注意ください' },
    { id: 2, date: '2026.01.20', category: '新機能', title: '「リマインドLINE」の深夜送信停止機能を追加しました' },
    { id: 3, date: '2026.01.15', category: 'お知らせ', title: 'ソロプレ・ベータ版の店舗登録数が30件を突破！' },
  ];

  const sliderImages = [
    { id: 1, url: 'https://images.unsplash.com/photo-1600880210836-8f8fe100a35c?auto=format&fit=crop&w=1200&q=80', title: '自分らしく、働く。', desc: 'ソロ起業家を支えるポータルサイト' },
    { id: 2, url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80', title: '次世代の予約管理', desc: 'SnipSnapでビジネスを加速させる' },
    { id: 3, url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', title: '新しい繋がりを。', desc: 'あなたのサービスを世界へ届けよう' },
  ];

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 100);

    const sliderTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
    }, 5000);

    const fetchShops = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_suspended', false)
        .not('business_name', 'is', null);
      
      if (data) {
        // 1. 【新着店舗用】純粋に登録日が新しい順に3件
        const latest = [...data]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3);
        setNewShops(latest);

        // 2. 【店舗一覧用】SnipSnapトップ + あいうえお順
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
      clearInterval(sliderTimer);
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh', fontFamily: '"Hiragino Sans", "Meiryo", sans-serif', color: '#333', width: '100%' }}>
      
      {/* --- 1. ヘッダーエリア --- */}
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ color: '#e60012', fontSize: '1.6rem', fontWeight: '900', margin: 0, letterSpacing: '-1.5px' }}>ソロプレ</h1>
            <div style={{ height: '20px', width: '1px', background: '#ccc', margin: '0 12px' }}></div>
            <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold' }}>Solopreneur Portal</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ width: '22px', height: '2px', background: '#333' }}></div>
            <div style={{ width: '22px', height: '2px', background: '#333' }}></div>
            <div style={{ width: '22px', height: '2px', background: '#333' }}></div>
          </div>
        </div>
      </div>

      {/* --- 2. 自動カルーセルスライダー --- */}
      <div style={{ width: '100%', position: 'relative', height: '320px', overflow: 'hidden', background: '#000' }}>
        {sliderImages.map((slide, index) => (
          <div key={slide.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url(${slide.url})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: index === currentSlide ? 1 : 0, transition: 'opacity 1.5s ease-in-out', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 10px 0', textShadow: '0 2px 15px rgba(0,0,0,0.6)', transform: index === currentSlide ? 'translateY(0)' : 'translateY(20px)', transition: '0.8s ease-out' }}>{slide.title}</h2>
            <p style={{ fontSize: '1rem', margin: 0, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{slide.desc}</p>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: '20px', width: '100%', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {sliderImages.map((_, i) => (
            <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: '0.3s' }}></div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        
        {/* --- 3. 最新トピック (NEWS) --- */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#e60012' }}>●</span> 最新トピック
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {topics.map((topic, idx) => (
              <div key={topic.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: idx === topics.length - 1 ? 'none' : '1px solid #f0f0f0', gap: '15px' }}>
                <span style={{ fontSize: '0.8rem', color: '#999', minWidth: '80px' }}>{topic.date}</span>
                <span style={{ fontSize: '0.65rem', background: topic.category === '重要' ? '#fee2e2' : '#f1f5f9', color: topic.category === '重要' ? '#ef4444' : '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{topic.category}</span>
                <span style={{ fontSize: '0.9rem', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>{topic.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- 4. 新着店舗 (NEW OPEN) --- */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px' }}>NEW OPEN</h3>
            <span style={{ fontSize: '0.7rem', color: '#999' }}>新しく仲間入りしたソロ起業家</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
            {newShops.map(shop => (
              <Link key={shop.id} to={`/shop/${shop.id}/reserve`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}>
                  <div style={{ width: '100%', height: '160px', background: '#eee', backgroundImage: shop.image_url ? `url(${shop.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#e60012', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>NEW</div>
                  </div>
                  <div style={{ padding: '15px' }}>
                    <span style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 'bold' }}>{shop.business_type}</span>
                    <h4 style={{ margin: '5px 0 0 0', fontSize: '1rem', color: '#333', fontWeight: 'bold' }}>{shop.business_name}</h4>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* --- 5. 掲載店舗一覧 (MAIN LIST) --- */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>🏪 掲載店舗一覧</h3>
            <span style={{ fontSize: '0.85rem', color: '#666' }}><b>{shops.length}</b> 件の店舗</span>
          </div>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            {shops.map(shop => (
              <div key={shop.id} style={{ background: '#fff', border: '1px solid #eee', display: 'flex', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '110px', minWidth: '110px', background: '#f0f0f0', backgroundImage: shop.image_url ? `url(${shop.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#1a1a1a' }}>{shop.business_name}</h4>
                  <div style={{ fontSize: '0.75rem', color: '#666', lineHeight: '1.4', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{shop.description || '詳細情報は準備中です。'}</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to={`/shop/${shop.id}/reserve`} style={{ flex: 1, textDecoration: 'none' }}>
                      <div style={{ background: '#2563eb', color: '#fff', textAlign: 'center', padding: '8px 0', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>予約</div>
                    </Link>
                    <div style={{ flex: 1, background: '#f1f5f9', color: '#475569', textAlign: 'center', padding: '8px 0', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>詳細</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- 6. フッター --- */}
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', marginTop: '40px', borderTop: '1px solid #eee' }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>← 本番のソロプレへ戻る</Link>
        <p style={{ margin: '20px 0 0 0', fontSize: '0.7rem', color: '#bbb' }}>© 2026 Solopreneur Portal SoloPre</p>
      </div>
    </div>
  );
}

export default OnePlayPortal;