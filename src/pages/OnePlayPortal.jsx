import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MapPin } from 'lucide-react'; 

function OnePlayPortal() {
  const [shops, setShops] = useState([]);
  const [newShops, setNewShops] = useState([]); 
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // 🆕 DBから取得するデータを保持するState
  const [topics, setTopics] = useState([]);
  const [categoryList, setCategoryList] = useState([]);

  // 💡 スライダー画像は今のところ固定（必要ならここもDB化できます）
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

    // 🆕 データを一括で取得する関数
    const fetchPortalData = async () => {
      // 1. 店舗データの取得（既存ロジック）
      const shopRes = await supabase
        .from('profiles')
        .select('*')
        .eq('is_suspended', false)
        .not('business_name', 'is', null);
      
      if (shopRes.data) {
        const latest = [...shopRes.data]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3);
        setNewShops(latest);
        setShops(shopRes.data);
      }

      // 2. 🆕 ニュース（最新トピック）の取得
      const newsRes = await supabase
        .from('portal_news')
        .select('*')
        .order('sort_order', { ascending: true });
      if (newsRes.data) setTopics(newsRes.data);

      // 3. 🆕 カテゴリデータの取得
      const catRes = await supabase
        .from('portal_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (catRes.data) setCategoryList(catRes.data);
    };

    fetchPortalData();
    return () => {
      clearTimeout(scrollTimer);
      clearInterval(sliderTimer);
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
        {topics.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '15px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#e60012' }}>●</span> 最新トピック
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {topics.map((topic, idx) => (
                <div key={topic.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: idx === topics.length - 1 ? 'none' : '1px solid #f0f0f0', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#999', minWidth: '75px' }}>{topic.publish_date}</span>
                  <span style={{ fontSize: '0.6rem', background: topic.category === '重要' ? '#fee2e2' : '#f1f5f9', color: topic.category === '重要' ? '#ef4444' : '#64748b', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold' }}>{topic.category}</span>
                  <span style={{ fontSize: '0.85rem', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>{topic.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Pick Up Solopreneur セクション */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px', color: '#1a1a1a' }}>Pick Up Solopreneur</h3>
            <span style={{ fontSize: '0.7rem', color: '#999' }}>注目のソロ起業家たち</span>
          </div>
          <div style={{ display: 'grid', gap: '15px' }}>
            {newShops.map(shop => (
              <div key={shop.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', height: '120px' }}>
                <Link to={`/shop/${shop.id}/detail`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%' }}>
                  <div style={{ width: '120px', minWidth: '120px', height: '120px', background: '#f0f0f0', backgroundImage: shop.image_url ? `url(${shop.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', flexShrink: 0 }}>
                    {!shop.image_url && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.6rem', color: '#ccc' }}>NO IMAGE</div>}
                    <div style={{ position: 'absolute', top: '0', left: '0', background: 'rgba(230,0,18,0.9)', color: '#fff', fontSize: '0.5rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '0 0 4px 0' }}>PICK UP</div>
                  </div>
                  <div style={{ padding: '12px 15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#2563eb', fontWeight: 'bold', marginBottom: '2px' }}>{shop.business_type}</div>
                    <h4 style={{ margin: '0 0 3px 0', fontSize: '1rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.business_name}</h4>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0, lineHeight: '1.4' }}>
                      {shop.description 
                        ? shop.description.split('/').map((line, idx) => (
                            <React.Fragment key={idx}>
                              {line}
                              {idx < shop.description.split('/').length - 1 && <br />}
                            </React.Fragment>
                          ))
                        : '店舗の詳細情報は準備中です。'
                      }
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* 5. カテゴリグリッドセクション - 🆕 DBからの画像・テキストを反映 */}
        <div style={{ marginBottom: '50px' }}>
          <div style={{ borderLeft: '4px solid #1e293b', paddingLeft: '15px', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: '#1e293b' }}>FIND YOUR SERVICE</h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>カテゴリーから探す</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {categoryList.map((cat) => (
              <Link key={cat.id} to={`/category/${cat.name}`} style={{ textDecoration: 'none', position: 'relative' }}>
                <div style={{ 
                  height: '140px',
                  borderRadius: '16px', 
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${cat.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  justifyContent: 'flex-end',
                  padding: '15px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.1)', backdropFilter: 'grayscale(0.2)' }}></div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 'bold', letterSpacing: '1px', opacity: 0.8, marginBottom: '2px' }}>{cat.en_name}</div>
                    <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '900', letterSpacing: '0.5px' }}>{cat.name}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 6. トライアル登録 */}
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

      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', marginTop: '60px', borderTop: '1px solid #eee' }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>← 本番のソロプレへ戻る</Link>
        <p style={{ margin: '20px 0 0 0', fontSize: '0.7rem', color: '#bbb' }}>© 2026 Solopreneur Portal SoloPre</p>
      </div>
    </div>
  );
}

export default OnePlayPortal;