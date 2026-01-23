import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Save, Tag, Users, Clipboard, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

function AdminManagement() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  const [activeMenu, setActiveMenu] = useState('work');
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayReservations, setTodayReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const todayStr = new Date().toLocaleDateString('sv-SE');

  useEffect(() => {
    fetchInitialData();
  }, [shopId, activeMenu]);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (profile) setShop(profile);

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

  // --- スタイル定義（横幅贅沢バージョン） ---
  const containerStyle = {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    background: '#fff',
    overflow: 'hidden'
  };

  const sidebarStyle = {
    width: '260px', // サイドバーは固定幅
    background: '#e0d7f7',
    borderRight: '2px solid #4b2c85',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0 // 縮まないように固定
  };

  const contentAreaStyle = {
    flex: 1, // 🆕 残りの全幅を使用
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    padding: '0' // 内側のパーツで調整
  };

  const btnStyle = (id, color) => ({
    width: '100%', padding: '12px', background: activeMenu === id ? '#fff' : color,
    color: activeMenu === id ? '#000' : '#fff', border: '1px solid #000', borderRadius: '2px',
    fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
    boxShadow: activeMenu === id ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : '2px 2px 0px rgba(0,0,0,0.5)',
    textAlign: 'center', marginBottom: '4px'
  });

  const workTableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
  const workThStyle = { background: '#f3f0ff', border: '1px solid #4b2c85', padding: '12px', textAlign: 'center', color: '#4b2c85', fontWeight: 'bold' };
  const workTdStyle = (isAlt) => ({ 
    border: '1px solid #e2e8f0', padding: '12px', 
    background: isAlt ? '#fff0f5' : '#fff',
    textAlign: 'center'
  });

  return (
    <div style={containerStyle}>
      
      {/* ⬅️ 左カラム（固定幅） */}
      <div style={sidebarStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: '900', margin: 0, color: '#4b2c85' }}>SOLO</h2>
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

      {/* ➡️ 右カラム（全幅贅沢使い） */}
      <div style={contentAreaStyle}>
        {activeMenu === 'work' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* ヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#d34817', padding: '15px 25px', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Clipboard size={24} />
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontStyle: 'italic', fontWeight: 'bold' }}>SOLO - 受付台帳 -</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ padding: '8px 20px', background: '#008000', color: '#fff', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' }}>カルテ</button>
                <button style={{ padding: '8px 20px', background: '#008000', color: '#fff', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' }}>新規客</button>
                <button style={{ padding: '8px 20px', background: '#9370db', color: '#fff', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' }}>MENU</button>
              </div>
            </div>

            {/* 操作ツールバー */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 25px', background: '#fdf2f0', borderBottom: '2px solid #d34817' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '8px 20px', border: '1px solid #d34817', fontWeight: '900', fontSize: '1.2rem' }}>
                <Calendar size={20} color="#d34817" /> {todayStr.replace(/-/g, '/')} (金)
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button style={toolBtnStyle}><ChevronLeft size={16} /> 前日</button>
                <button style={toolBtnStyle}><ChevronRight size={16} /> 次日</button>
                <button style={{ ...toolBtnStyle, width: '80px' }}>本日</button>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: '#eee' }}><Search size={18} /></div>
                <input type="text" placeholder="お客様名で検索..." style={{ padding: '8px 15px', border: 'none', width: '300px', fontSize: '1rem' }} />
                <button style={{ padding: '8px 20px', background: '#d34817', color: '#fff', border: 'none', fontWeight: 'bold' }}>検索</button>
              </div>
            </div>

            {/* メインタブ（贅沢な横幅） */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
              <table style={workTableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...workThStyle, width: '80px' }}>状況</th>
                    <th style={{ ...workThStyle, width: '100px' }}>予約</th>
                    <th style={{ ...workThStyle, width: '250px' }}>お客様</th>
                    <th style={{ ...workThStyle, width: '200px' }}>メイン担当者</th>
                    <th style={workThStyle}>受付メモ(メニュー)</th>
                    <th style={{ ...workThStyle, width: '150px' }}>お会計</th>
                    <th style={{ ...workThStyle, width: '80px' }}>施術</th>
                    <th style={{ ...workThStyle, width: '80px' }}>店販</th>
                    <th style={{ ...workThStyle, width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {todayReservations.map((res, idx) => (
                    <tr key={res.id}>
                      <td style={workTdStyle(idx % 2)}><span style={{ color: '#e11d48', fontWeight: 'bold' }}>予約</span></td>
                      <td style={workTdStyle(idx % 2)}>{new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ ...workTdStyle(idx % 2), background: '#008000', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{res.customer_name}</td>
                      <td style={workTdStyle(idx % 2)}>{shop?.owner_name}</td>
                      <td style={{ ...workTdStyle(idx % 2), textAlign: 'left' }}>
                        {res.options?.people?.[0]?.services?.map(s => s.name).join(', ') || '---'}
                      </td>
                      <td style={{ ...workTdStyle(idx % 2), fontWeight: '900', textAlign: 'right', fontSize: '1.1rem' }}>0</td>
                      <td style={{ ...workTdStyle(idx % 2), background: '#1e3a8a', color: '#fff', fontWeight: 'bold' }}>1</td>
                      <td style={{ ...workTdStyle(idx % 2), background: '#1e3a8a', color: '#fff', fontWeight: 'bold' }}>0</td>
                      <td style={workTdStyle(idx % 2)}><button style={{ background: '#d34817', color: '#fff', border: 'none', cursor: 'pointer', padding: '5px' }}>×</button></td>
                    </tr>
                  ))}
                  {[...Array(Math.max(0, 15 - todayReservations.length))].map((_, i) => (
                    <tr key={`empty-${i}`}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j} style={workTdStyle((todayReservations.length + i) % 2)}>&nbsp;</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* フッター集計バー */}
            <div style={{ display: 'flex', gap: '2px', background: '#d34817', padding: '10px 25px', alignItems: 'center' }}>
              <div style={footerLabelStyle}>客数</div>
              <div style={footerValueStyle}>{todayReservations.length}</div>
              <div style={footerLabelStyle}>お会計累計</div>
              <div style={footerValueStyle}>0</div>
              <div style={footerLabelStyle}>客単価</div>
              <div style={footerValueStyle}>0</div>
              <div style={{ marginLeft: 'auto', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>消費税率：10%</div>
            </div>
          </div>
        )}

        {/* 施術商品（ワイド版） */}
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

const toolBtnStyle = { padding: '8px 15px', background: '#d34817', color: '#fff', border: '1px solid #fff', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' };
const tableThStyle = { padding: '15px', textAlign: 'left', borderBottom: '2px solid #4b2c85', color: '#4b2c85' };
const priceInputStyle = { width: '120px', padding: '8px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'right' };
const footerLabelStyle = { background: '#f3f0ff', padding: '8px 20px', fontSize: '0.9rem', fontWeight: 'bold', border: '1px solid #d34817' };
const footerValueStyle = { background: '#fff', padding: '8px 25px', fontSize: '1.3rem', fontWeight: '900', border: '1px solid #d34817', minWidth: '100px', textAlign: 'right', marginRight: '20px' };

export default AdminManagement;