import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Home() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabaseから店舗一覧を読み込む
    const fetchShops = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error('データ取得エラー:', error);
      } else {
        setShops(data);
      }
      setLoading(false);
    };

    fetchShops();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2563eb', fontSize: '2.5rem' }}>総合予約ポータル</h1>
      <p style={{ color: '#4b5563' }}>美容室・ネイル・接骨院の予約を、もっとスマートに。</p>
      
      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', justifyContent: 'center', maxWidth: '1000px', margin: '40px auto' }}>
        {shops.map((shop) => (
          <div key={shop.id} style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '12px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.8rem', background: '#e5e7eb', padding: '2px 8px', borderRadius: '12px' }}>{shop.category}</span>
            <h3 style={{ margin: '10px 0' }}>{shop.business_name}</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', minHeight: '3em' }}>{shop.description}</p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              {/* ここで Link を使って予約ページへ飛ばします */}
              <Link 
                to={`/admin/${shop.id}`} 
                style={{ flex: 1, textDecoration: 'none', background: '#2563eb', color: 'white', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}
              >
                予約ページへ
              </Link>
            </div>
          </div>
        ))}

        {shops.length === 0 && <p>登録されている店舗がありません。SupabaseでRunしましたか？</p>}
      </div>
    </div>
  );
}

export default Home;