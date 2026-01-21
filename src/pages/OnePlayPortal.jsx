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

  // 💡 カテゴリリスト（グリッド用）
  const categoryList = [
    { id: 'beauty', name: '美容室・理容室', icon: '✂️', color: '#eff6ff' },
    { id: 'nail', name: 'ネイル・アイラッシュ', icon: '💅', color: '#fdf2f8' },
    { id: 'esthe', name: 'エステ・リラク', icon: '💆', color: '#f0fdf4' },
    { id: 'clinic', name: '整体・接骨院', icon: '🏥', color: '#fff7ed' },
    { id: 'gourmet', name: '飲食店・カフェ', icon: '🍽️', color: '#fff1f2' },
    { id: 'other', name: 'その他・ライフ', icon: '✨', color: '#f8fafc' },
  ];

  // 💡 スライダーに表示する画像と情報の定義
  const sliderImages = [
    { id: 1, url: 'https://images.unsplash.com/photo-1600880210836-8f8fe100a35c?auto=format&fit=crop&w=1200&q=80', title: '自分らしく、働く。', desc: 'ソロ起業家を支えるポータルサイト' },
    { id: 2, url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80', title: '次世代の予約管理', desc: 'SnipSnapでビジネスを加速させる' },
    { id: 3, url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', title: '新しい繋がりを。', desc: 'あなたのサービスを世界へ届けよう' },
  ];

  useEffect(() => {
    // 🆕 最強のスクロールリセット
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
        .not('business_name', 'is', null);
      
      if (data) {
        // 1. 【新着店舗用】登録日が新しい順に3件を抽出
        const latest = [...data]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3);
        setNewShops(latest);

        // 2. 全店舗
        setShops(data);
      }
    };

    fetchShops();
    return () => {
      clearTimeout(scrollTimer);
      clearInterval(sliderTimer); // タイマー解除
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh', fontFamily: '"Hiragino Sans", "Meiryo", sans-serif', color: '#333', width: '100%' }}>
      
      {/* 1. ヘッダーエリア */}
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ color: '#e60012', fontSize: '1.6rem', fontWeight: '900', margin: 0, letterSpacing: '-1.5px' }}>ソロプレ</h1>
            <div style={{ height: '20px', width: '1px', background: '#ccc', margin: '0 12px' }}></div>
            <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold' }}>Solopreneur Portal</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', cursor: 'pointer' }}>
            <div style={{ width: '22px', height: '2px', background: '#333' }}></div>
            <div style={{ width: '22px', height: '2px', background: '#333' }}></div>
            <div style={{ width: '22px', height: '2px', background: '#333' }}></div>
          </div>
        </div>
      </div>

      {/* 2. 自動カルーセルスライダー */}
      <div style={{ width: '100%', position: 'relative', height: '320px', overflow: 'hidden', background: '#000' }}>
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
            <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 10px 0', textShadow: '0 2px 15px rgba(0,0,0,0.6)', transform: index === currentSlide ? 'translateY(0)' : 'translateY(20px)', transition: '0.8s ease-out' }}>
              {slide.title}
            </h2>
            <p style={{ fontSize: '1rem', margin: 0, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
              {slide.desc}
            </p>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: '20px', width: '100%', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {sliderImages.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentSlide(i)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: '0.3s'
              }}
            ></div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        
        {/* 3. 最新トピック (NEWS) セクション */}
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

        {/* 🆕 4. Pick Up Solopreneur セクション（刷新版） */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px', color: '#1a1a1a' }}>Pick Up Solopreneur</h3>
            <span style={{ fontSize: '0.7rem', color: '#999' }}>注目のソロ起業家たち</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {newShops.map(shop => (
              <Link key={shop.id} to={`/shop/${shop.id}/detail`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* 画像エリア：1:1画像が綺麗に収まるように調整 */}
                  <div style={{ width: '100%', aspectRatio: '16 / 9', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
                    {shop.image_url ? (
                      <img src={shop.image_url} alt={shop.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '0.8rem' }}>NO IMAGE</div>
                    )}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(230,0,18,0.9)', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>PICK UP</div>
                  </div>
                  {/* 情報エリア */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#2563eb', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>{shop.business_type}</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1a1a1a', fontWeight: 'bold', lineHeight: '1.4' }}>{shop.business_name}</h4>
                    <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6' }}>
                      {shop.description || '一歩先ゆくソロ起業家のサービスを体験してみませんか。'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 5. カテゴリグリッドセクション */}
        <div style={{ marginBottom: '50px' }}>
          <div style={{ borderLeft: '4px solid #333', paddingLeft: '12px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>カテゴリーから探す</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#666' }}>目的のサービスをタップしてください</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {categoryList.map((cat) => (
              <Link key={cat.id} to={`/category/${cat.name}`} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  background: '#fff', 
                  borderRadius: '16px', 
                  padding: '20px 10px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  border: '1px solid #eee',
                  transition: 'transform 0.1s active',
                }}>
                  <span style={{ fontSize: '2.2rem', marginBottom: '10px' }}>{cat.icon}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#333', textAlign: 'center' }}>{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 6. トライアル登録への案内 */}
        <div style={{ marginTop: '20px', padding: '30px 20px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: '20px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h4 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>あなたのビジネスも掲載しませんか？</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.6', marginBottom: '20px' }}>ソロプレは個人で頑張る起業家を応援します。<br/>今ならベータ版につき、無料で登録可能です。</p>
          <Link to="/trial-registration" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#e60012', color: '#fff', padding: '12px 30px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: 'bold', display: 'inline-block', boxShadow: '0 4px 15px rgba(230,0,18,0.3)' }}>
              ベータ版はこちら 🚀
            </div>
          </Link>
        </div>

      </div>

      {/* 7. フッター */}
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', marginTop: '60px', borderTop: '1px solid #eee' }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>
           ← 本番のソロプレへ戻る
        </Link>
        <p style={{ margin: '20px 0 0 0', fontSize: '0.7rem', color: '#bbb' }}>© 2026 Solopreneur Portal SoloPre</p>
      </div>
    </div>
  );
}

export default OnePlayPortal;