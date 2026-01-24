import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Save, Tag, Clipboard, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

function AdminManagement() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  // 🆕 オンラインでの 400 Bad Request 対策（空白除去）
  const cleanShopId = shopId?.trim();

  const [activeMenu, setActiveMenu] = useState('work');
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayReservations, setTodayReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const todayStr = new Date().toLocaleDateString('sv-SE');

  useEffect(() => {
    if (cleanShopId) {
      fetchInitialData();
    }
  }, [cleanShopId, activeMenu]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // 1. 店舗情報取得
      const { data: profile, error: shopError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', cleanShopId)
        .maybeSingle();
      
      if (shopError) console.error("Profiles API Error:", shopError);
      if (profile) setShop(profile);

      // 2. 本日の予約リスト
      if (activeMenu === 'work') {
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*')
          .eq('shop_id', cleanShopId)
          .eq('res_type', 'normal')
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`)
          .order('start_time', { ascending: true });
        
        if (resError) console.error("Reservations API Error:", resError);
        setTodayReservations(resData || []);
      }

      // 3. 施術メニュー
      if (activeMenu === 'master_tech') {
        const { data: svData } = await supabase
          .from('services')
          .select('*')
          .eq('shop_id', cleanShopId)
          .order('category_name', { ascending: true });
        setServices(svData || []);
      }
    } catch (err) {
      console.error("System Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveServices = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('services').upsert(services);
    if (error) alert('保存に失敗しました');
    else alert('更新しました！');
    setIsSaving(false);
  };

  // ==========================================
  // 🆕 独自レイアウト：ブラウザ全体の支配
  // (index.cssの中央寄せを無視させる設定)
  // ==========================================
  const fullPageWrapper = {
    position: 'fixed', // ブラウザに対して固定
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    display: 'flex',
    background: '#fff',
    zIndex: 9999,      // 最前面へ
    overflow: 'hidden',
    fontFamily: 'sans-serif'
  };

  const sidebarStyle = {
    width: '260px',
    height: '100%',
    background: '#e0d7f7',
    borderRight: '2px solid #4b2c85',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    flexShrink: 0
  };

  const mainAreaStyle = {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0
  };

  const btnStyle = (id, color) => ({
    width: '100%', padding: '12px', background: activeMenu === id ? '#fff' : color,
    color: activeMenu === id ? '#000' : '#fff', border: '1px solid #000', borderRadius: '2px',
    fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
    boxShadow: activeMenu === id ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : '2px 2px 0px rgba(0,0,0,0.5)',
    textAlign: 'center', marginBottom: '6px'
  });

  return (
    <div style={fullPageWrapper}>
      {/* ⬅️ 左メニュー：SOLOブランド */}
      <div style={sidebarStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: '900', margin: 0, color: '#4b2c85' }}>SOLO</h2>
          <p style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '2px' }}>MANAGEMENT SYSTEM</p>
        </div>
        <button style={btnStyle('work', '#d34817')} onClick={() => setActiveMenu('work')}>日常業務</button>
        <button style={btnStyle('sales', '#f4b400')} onClick={() => setActiveMenu('sales')}>売上集計</button>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4b2c85', marginTop: '15px', textAlign: 'center', borderBottom: '1px solid #4b2c85' }}>初期設定MENU</div>
        <button style={btnStyle('master_tech', '#4285f4')} onClick={() => setActiveMenu('master_tech')}>施術商品</button>
        <button style={btnStyle('master_item', '#4285f4')} onClick={() => setActiveMenu('master_item')}>店販商品</button>
        <button style={btnStyle('master_staff', '#4285f4')} onClick={() => setActiveMenu('master_staff')}>スタッフ</button>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button style={btnStyle('home', '#9370db')} onClick={() => setActiveMenu('home')}>TOPページへ</button>
          <button style={btnStyle('exit', '#ff1493')} onClick={() => navigate(`/admin/${shopId}/reservations`)}>業 務 終 了</button>
        </div>
      </div>

      {/* ➡️ 右コンテンツ：全幅で贅沢に表示 */}
      <div style={mainAreaStyle}>
        {activeMenu === 'work' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* ヘッダー */}
            <div style={{ background: '#d34817', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Clipboard size={24} />
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontStyle: 'italic', fontWeight: 'bold' }}>SOLO - 受付台帳 -</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={headerBtnStyle}>カルテ</button>
                <button style={headerBtnStyle}>新規客</button>
                <button style={{ ...headerBtnStyle, background: '#9370db' }}>MENU</button>
              </div>
            </div>

            {/* ツールバー */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 25px', background: '#fdf2f0', borderBottom: '2px solid #d34817' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '8px 20px', border: '1px solid #d34817', fontWeight: '900', fontSize: '1.2rem' }}>
                <Calendar size={20} color="#d34817" /> {todayStr.replace(/-/g, '/')}
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button style={toolBtnStyle}><ChevronLeft size={16} /> 前日</button>
                <button style={toolBtnStyle}><ChevronRight size={16} /> 次日</button>
                <button style={{ ...toolBtnStyle, width: '80px' }}>本日</button>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', border: '1px solid #ddd', background: '#fff' }}>
                <input type="text" placeholder="お客様名で検索..." style={{ padding: '8px 15px', border: 'none', width: '300px' }} />
                <button style={{ padding: '8px 20px', background: '#d34817', color: '#fff', border: 'none', fontWeight: 'bold' }}>検索</button>
              </div>
            </div>

            {/* 一覧テーブル */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>状況</th><th style={thStyle}>予約</th><th style={thStyle}>お客様</th>
                    <th style={thStyle}>メイン担当者</th><th style={thStyle}>受付メモ(メニュー)</th>
                    <th style={thStyle}>お会計</th><th style={thStyle}>施術</th><th style={thStyle}>店販</th><th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {todayReservations.length > 0 ? todayReservations.map((res, idx) => (
                    <tr key={res.id}>
                      <td style={tdStyle(idx % 2)}><span style={{ color: '#e11d48', fontWeight: 'bold' }}>予約</span></td>
                      <td style={tdStyle(idx % 2)}>{new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ ...tdStyle(idx % 2), background: '#008000', color: '#fff', fontWeight: 'bold' }}>{res.customer_name}</td>
                      <td style={tdStyle(idx % 2)}>{shop?.owner_name || '店主'}</td>
                      <td style={{ ...tdStyle(idx % 2), textAlign: 'left' }}>{res.options?.people?.[0]?.services?.map(s => s.name).join(', ') || '---'}</td>
                      <td style={{ ...tdStyle(idx % 2), fontWeight: '900' }}>0</td>
                      <td style={{ ...tdStyle(idx % 2), background: '#1e3a8a', color: '#fff' }}>1</td>
                      <td style={{ ...tdStyle(idx % 2), background: '#1e3a8a', color: '#fff' }}>0</td>
                      <td style={tdStyle(idx % 2)}><button style={{ color: '#d34817', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>本日の予約はありません。</td></tr>
                  )}
                  {/* 空行の埋め合わせ */}
                  {[...Array(15)].map((_, i) => (
                    <tr key={`empty-${i}`}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j} style={tdStyle((todayReservations.length + i) % 2)}>&nbsp;</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* フッター */}
            <div style={{ display: 'flex', background: '#d34817', padding: '10px 25px', gap: '5px' }}>
              <div style={footerLabelStyle}>客数</div><div style={footerValueStyle}>{todayReservations.length}</div>
              <div style={footerLabelStyle}>お会計累計</div><div style={footerValueStyle}>0</div>
              <div style={footerLabelStyle}>客単価</div><div style={footerValueStyle}>0</div>
            </div>
          </div>
        )}

        {activeMenu === 'master_tech' && (
          <div style={{ padding: '40px', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '3px solid #4285f4', paddingBottom: '15px' }}>
              <h2 style={{ color: '#4285f4', margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>初期設定 [施術商品マスター]</h2>
              <button onClick={saveServices} disabled={isSaving} style={{ padding: '12px 40px', background: '#008000', color: '#fff', border: '1px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>一括保存</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
              <thead>
                <tr style={{ background: '#f3f0ff' }}>
                  <th style={tableThStyle}>メニュー名</th>
                  <th style={tableThStyle}>標準価格 (税抜)</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{s.name}</td>
                    <td style={{ padding: '15px' }}>¥ <input type="number" value={s.price || 0} onChange={(e) => handleUpdateService(s.id, 'price', parseInt(e.target.value))} style={priceInputStyle} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const headerBtnStyle = { padding: '8px 20px', background: '#008000', color: '#fff', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' };
const toolBtnStyle = { padding: '8px 15px', background: '#d34817', color: '#fff', border: '1px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };
const thStyle = { background: '#f3f0ff', border: '1px solid #4b2c85', padding: '12px', fontWeight: 'bold', color: '#4b2c85' };
const tdStyle = (isAlt) => ({ border: '1px solid #e2e8f0', padding: '12px', background: isAlt ? '#fff0f5' : '#fff', textAlign: 'center' });
const footerLabelStyle = { background: '#f3f0ff', padding: '8px 20px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #d34817' };
const footerValueStyle = { background: '#fff', padding: '8px 25px', fontSize: '1.2rem', fontWeight: '900', minWidth: '100px', textAlign: 'right' };
const tableThStyle = { padding: '15px', textAlign: 'left', borderBottom: '2px solid #4b2c85', color: '#4b2c85' };
const priceInputStyle = { width: '120px', padding: '8px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'right' };

export default AdminManagement;