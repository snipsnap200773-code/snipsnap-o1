import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Save, Tag, Users, Clipboard, UserPlus, Menu as MenuIcon, X } from 'lucide-react';

function AdminManagement() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  // --- 状態管理 ---
  const [activeMenu, setActiveMenu] = useState('work'); // デフォルトを日常業務に
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayReservations, setTodayReservations] = useState([]);

  // 施術商品管理用
  const [services, setServices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const todayStr = new Date().toLocaleDateString('sv-SE');

  useEffect(() => {
    fetchInitialData();
  }, [shopId, activeMenu]);

  const fetchInitialData = async () => {
    setLoading(true);
    // 1. 店舗情報
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (profile) setShop(profile);

    // 2. 本日の予約リスト（日常業務用）
    if (activeMenu === 'work') {
      const { data: resData } = await supabase
        .from('reservations')
        .select('*')
        .eq('shop_id', shopId)
        .eq('res_type', 'normal')
        .gte('start_time', `${todayStr}T00:00:00`)
        .lte('start_time', `${todayStr}T23:59:59`)
        .order('start_time', { ascending: true });
      setTodayReservations(resData || []);
    }

    // 3. 施術メニュー（施術商品用）
    if (activeMenu === 'master_tech') {
      const { data: svData } = await supabase.from('services').select('*').eq('shop_id', shopId).order('category_name', { ascending: true });
      setServices(svData || []);
    }
    setLoading(false);
  };

  const handleUpdateService = (id, field, value) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const saveServices = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('services').upsert(services);
    if (error) alert('保存に失敗しました');
    else alert('更新しました！');
    setIsSaving(false);
  };

  // --- スタイル定義 ---
  const outerWrapperStyle = {
    width: '100vw',
    minHeight: '100vh',
    background: '#b19cd9',
    display: 'flex',
    justifyContent: 'center', // 🆕 全体をセンターへ
    alignItems: 'flex-start',
    padding: '20px 0',
    overflowX: 'hidden'
  };

  const containerStyle = {
    display: 'flex',
    width: '1200px', // 🆕 横幅を固定して安定させる
    height: '850px',
    background: '#e0d7f7',
    border: '3px double #fff',
    borderRadius: '10px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    overflow: 'hidden'
  };

  const sidebarStyle = {
    width: '280px',
    background: '#e0d7f7',
    borderRight: '2px solid #4b2c85',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const contentAreaStyle = {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff' // コンテンツ内側は白背景で見やすく
  };

  const btnStyle = (id, color) => ({
    width: '100%', padding: '12px', background: activeMenu === id ? '#fff' : color,
    color: activeMenu === id ? '#000' : '#fff', border: '1px solid #000', borderRadius: '2px',
    fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
    boxShadow: activeMenu === id ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : '2px 2px 0px rgba(0,0,0,0.5)',
    textAlign: 'center', marginBottom: '4px'
  });

  // 受付帳のテーブルスタイル
  const workTableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' };
  const workThStyle = { background: '#f3f0ff', border: '1px solid #4b2c85', padding: '8px', textAlign: 'center' };
  const workTdStyle = (isAlt) => ({ 
    border: '1px solid #e2e8f0', padding: '10px', 
    background: isAlt ? '#fff0f5' : '#fff', // 🆕 画像のような1行おきのピンク色
    textAlign: 'center'
  });

  return (
    <div style={outerWrapperStyle}>
      <div style={containerStyle}>
        
        {/* ⬅️ 左カラム：メニュー */}
        <div style={sidebarStyle}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontStyle: 'italic', margin: 0 }}>Beauty Advanced</h2>
            <p style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>SnipSnap Edition</p>
          </div>
          <button style={btnStyle('work', '#d34817')} onClick={() => setActiveMenu('work')}>日常業務</button>
          <button style={btnStyle('sales', '#f4b400')} onClick={() => setActiveMenu('sales')}>売上集計</button>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4b2c85', marginTop: '15px', textAlign: 'center' }}>初期設定MENU</div>
          <button style={btnStyle('master_tech', '#4285f4')} onClick={() => setActiveMenu('master_tech')}>施術商品</button>
          <button style={btnStyle('master_item', '#4285f4')} onClick={() => setActiveMenu('master_item')}>店販商品</button>
          <button style={btnStyle('master_staff', '#4285f4')} onClick={() => setActiveMenu('master_staff')}>スタッフ</button>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button style={btnStyle('home', '#9370db')} onClick={() => setActiveMenu('home')}>TOPページへ</button>
            <button style={btnStyle('exit', '#ff1493')} onClick={() => navigate(`/admin/${shopId}/reservations`)}>業 務 終 了</button>
          </div>
        </div>

        {/* ➡️ 右カラム：反映エリア */}
        <div style={contentAreaStyle}>
          
          {/* 日常業務 [受付台帳] */}
          {activeMenu === 'work' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#d34817', padding: '10px 15px', borderRadius: '4px 4px 0 0', color: '#fff' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontStyle: 'italic' }}>Beauty Advanced - 受付 -</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ padding: '5px 15px', background: '#008000', color: '#fff', border: '1px solid #fff', cursor: 'pointer', borderRadius: '3px' }}>カルテ</button>
                  <button style={{ padding: '5px 15px', background: '#008000', color: '#fff', border: '1px solid #fff', cursor: 'pointer', borderRadius: '3px' }}>新規客</button>
                  <button style={{ padding: '5px 15px', background: '#9370db', color: '#fff', border: '1px solid #fff', cursor: 'pointer', borderRadius: '3px' }}>MENU</button>
                </div>
              </div>

              {/* 日付操作バー */}
              <div style={{ display: 'flex', gap: '5px', padding: '10px', background: '#fdf2f0', borderBottom: '2px solid #d34817' }}>
                <div style={{ background: '#fff', padding: '5px 15px', border: '1px solid #d34817', fontWeight: 'bold' }}>{todayStr.replace(/-/g, '/')}</div>
                <button style={{ padding: '5px 10px', background: '#d34817', color: '#fff', border: 'none' }}>前日</button>
                <button style={{ padding: '5px 10px', background: '#d34817', color: '#fff', border: 'none' }}>次日</button>
                <button style={{ padding: '5px 10px', background: '#d34817', color: '#fff', border: 'none' }}>本日</button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                  <input type="text" placeholder="客検索" style={{ padding: '5px', border: '1px solid #ddd' }} />
                  <button style={{ padding: '5px 15px', background: '#d34817', color: '#fff', border: 'none' }}>検索</button>
                </div>
              </div>

              {/* メインテーブル */}
              <div style={{ flex: 1, overflowY: 'auto', marginTop: '10px' }}>
                <table style={workTableStyle}>
                  <thead>
                    <tr>
                      <th style={workThStyle}>状況</th>
                      <th style={workThStyle}>予約</th>
                      <th style={workThStyle}>お客様</th>
                      <th style={workThStyle}>メイン担当者</th>
                      <th style={workThStyle}>受付メモ(メニュー)</th>
                      <th style={workThStyle}>お会計</th>
                      <th style={workThStyle}>施術</th>
                      <th style={workThStyle}>店販</th>
                      <th style={workThStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayReservations.map((res, idx) => (
                      <tr key={res.id}>
                        <td style={workTdStyle(idx % 2)}><span style={{ color: '#e11d48', fontWeight: 'bold' }}>予約</span></td>
                        <td style={workTdStyle(idx % 2)}>{new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ ...workTdStyle(idx % 2), background: '#008000', color: '#fff', fontWeight: 'bold' }}>{res.customer_name}</td>
                        <td style={workTdStyle(idx % 2)}>{shop?.owner_name}</td>
                        <td style={{ ...workTdStyle(idx % 2), textAlign: 'left' }}>
                          {res.options?.people?.[0]?.services?.map(s => s.name).join(', ') || '---'}
                        </td>
                        <td style={{ ...workTdStyle(idx % 2), fontWeight: 'bold', textAlign: 'right' }}>0</td>
                        <td style={{ ...workTdStyle(idx % 2), background: '#1e3a8a', color: '#fff' }}>1</td>
                        <td style={{ ...workTdStyle(idx % 2), background: '#1e3a8a', color: '#fff' }}>0</td>
                        <td style={workTdStyle(idx % 2)}><button style={{ background: '#d34817', color: '#fff', border: 'none', cursor: 'pointer' }}>×</button></td>
                      </tr>
                    ))}
                    {/* 空行の埋め合わせ */}
                    {[...Array(Math.max(0, 10 - todayReservations.length))].map((_, i) => (
                      <tr key={`empty-${i}`}>
                        {[...Array(9)].map((_, j) => (
                          <td key={j} style={workTdStyle((todayReservations.length + i) % 2)}>&nbsp;</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 🆕 フッター集計バー */}
              <div style={{ display: 'flex', gap: '1px', background: '#d34817', padding: '5px', marginTop: '10px' }}>
                <div style={footerLabelStyle}>客数</div>
                <div style={footerValueStyle}>{todayReservations.length}</div>
                <div style={footerLabelStyle}>お会計累計</div>
                <div style={footerValueStyle}>0</div>
                <div style={footerLabelStyle}>客単価</div>
                <div style={footerValueStyle}>0</div>
              </div>
            </div>
          )}

          {/* 施術商品エリア (第1弾の内容を維持) */}
          {activeMenu === 'master_tech' && (
            <div>
              <h2 style={{ color: '#4285f4', borderBottom: '2px solid #4285f4', paddingBottom: '10px' }}>初期設定 [施術商品マスター]</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <tr style={{ background: '#f3f0ff' }}>
                  <th style={tableThStyle}>メニュー名</th>
                  <th style={tableThStyle}>価格 (税抜)</th>
                </tr>
                {services.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tableTdStyle}>{s.name}</td>
                    <td style={tableTdStyle}>¥ <input type="number" value={s.price || 0} onChange={(e) => handleUpdateService(s.id, 'price', parseInt(e.target.value))} style={priceInputStyle} /></td>
                  </tr>
                ))}
              </table>
              <button onClick={saveServices} style={{ marginTop: '20px', padding: '10px 30px', background: '#008000', color: '#fff', border: 'none', cursor: 'pointer' }}>一括保存</button>
            </div>
          )}

          {/* TOPページ */}
          {activeMenu === 'home' && (
            <div style={{ background: 'rgba(255,255,255,0.4)', padding: '30px', borderRadius: '10px', border: '3px double #4b2c85' }}>
              <h3>ライセンス取得ユーザー情報</h3>
              <p><strong>店舗名:</strong> {shop?.business_name}</p>
              <p><strong>担当者:</strong> {shop?.owner_name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 共通スタイル
const tableThStyle = { padding: '12px', textAlign: 'left', borderBottom: '2px solid #4b2c85' };
const tableTdStyle = { padding: '12px' };
const priceInputStyle = { width: '80px', padding: '5px' };
const footerLabelStyle = { background: '#f3f0ff', padding: '5px 15px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #d34817' };
const footerValueStyle = { background: '#fff', padding: '5px 20px', fontSize: '1rem', fontWeight: '900', border: '1px solid #d34817', minWidth: '80px', textAlign: 'right', marginRight: '10px' };

export default AdminManagement;