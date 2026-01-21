import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MapPin, Phone, MessageCircle, ExternalLink, Mail, ChevronLeft, Info } from 'lucide-react';

function ShopDetail() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchShopDetail = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', shopId)
        .single();

      if (!error && data) {
        setShop(data);
      }
      setLoading(false);
    };
    fetchShopDetail();
  }, [shopId]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#999' }}>読み込み中...</div>;
  }

  if (!shop) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>店舗が見つかりませんでした。</div>;
  }

  const actionButtonStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15px 10px',
    borderRadius: '16px',
    textDecoration: 'none',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s',
    border: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh', paddingBottom: '100px', fontFamily: '"Hiragino Sans", "Meiryo", sans-serif' }}>
      
      {/* ヘッダー */}
      <div style={{ background: '#fff', padding: '15px 20px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '5px' }}>
          <ChevronLeft size={24} color="#333" />
        </button>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 auto 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shop.business_name}
        </h1>
      </div>

      {/* メイン画像エリア */}
      <div style={{ width: '100%', height: '300px', background: '#eee', backgroundImage: shop.image_url ? `url(${shop.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {!shop.image_url && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>NO IMAGE</div>}
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        
        {/* 基本情報 */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '25px', marginTop: '-40px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', position: 'relative' }}>
          <div style={{ background: '#2563eb', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' }}>
            {shop.business_type}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 15px 0', color: '#1a1a1a' }}>{shop.business_name}</h2>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
            {shop.description || '店舗の詳細情報は準備中です。'}
          </p>

          {/* 📞 住所・連絡先 */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.85rem', color: '#666' }}>
              <MapPin size={18} color="#2563eb" style={{ flexShrink: 0 }} />
              <span>{shop.address || '住所未登録'}</span>
            </div>
            {shop.phone && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.85rem', color: '#666' }}>
                <Phone size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>{shop.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* アクションパネル */}
        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '30px 0 15px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="#2563eb" /> お問い合わせ・ご予約
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {/* 電話 */}
          {shop.phone ? (
            <a href={`tel:${shop.phone}`} style={{ ...actionButtonStyle, background: '#fff', color: '#333' }}>
              <Phone size={24} color="#2563eb" />電話相談
            </a>
          ) : (
            <div style={{ ...actionButtonStyle, background: '#f1f5f9', color: '#ccc', cursor: 'not-allowed' }}>
              <Phone size={24} />電話不可
            </div>
          )}

          {/* LINE */}
          {shop.line_official_url ? (
            <a href={shop.line_official_url} target="_blank" rel="noreferrer" style={{ ...actionButtonStyle, background: '#06c755', color: '#fff' }}>
              <MessageCircle size={24} color="#fff" />LINE予約
            </a>
          ) : (
            <div style={{ ...actionButtonStyle, background: '#f1f5f9', color: '#ccc', cursor: 'not-allowed' }}>
              <MessageCircle size={24} />LINE未連携
            </div>
          )}

          {/* 公式サイト */}
          {shop.official_url ? (
            <a href={shop.official_url} target="_blank" rel="noreferrer" style={{ ...actionButtonStyle, background: '#475569', color: '#fff' }}>
              <ExternalLink size={24} color="#fff" />公式サイト
            </a>
          ) : (
            <div style={{ ...actionButtonStyle, background: '#f1f5f9', color: '#ccc', cursor: 'not-allowed' }}>
              <ExternalLink size={24} />サイトなし
            </div>
          )}
        </div>

        {/* 注意事項 */}
        {shop.notes && (
          <div style={{ marginTop: '30px', background: '#fff1f2', borderRadius: '16px', padding: '20px', border: '1px solid #fecdd3' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 'bold', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '5px' }}>
              ⚠️ ご予約に関する注意事項
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#9f1239', lineHeight: '1.6', margin: 0 }}>{shop.notes}</p>
          </div>
        )}
      </div>

      {/* 予約固定ボタン（フッター） */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '20px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid #eee', zIndex: 100, boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Link to={`/shop/${shop.id}/reserve`} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: '#fff', textAlign: 'center', padding: '16px', borderRadius: '16px', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 8px 20px rgba(37,99,235,0.3)' }}>
              ✉️ メール予約手続きへ進む
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}

export default ShopDetail;