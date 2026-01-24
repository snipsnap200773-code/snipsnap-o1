import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Save, Tag, Clipboard, Search, ChevronLeft, ChevronRight, Calendar, PlusCircle, Trash2, FolderPlus } from 'lucide-react';

function AdminManagement() {
  const { shopId } = useParams();
  const navigate = useNavigate();
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
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', cleanShopId).maybeSingle();
      if (profile) setShop(profile);

      // 2. 本日の予約リスト（日常業務用）
      if (activeMenu === 'work') {
        const { data: resData } = await supabase
          .from('reservations')
          .select('*')
          .eq('shop_id', cleanShopId)
          .eq('res_type', 'normal')
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`)
          .order('start_time', { ascending: true });
        setTodayReservations(resData || []);
      }

      // 3. 施術メニュー（親子構造すべて取得）
      if (activeMenu === 'master_tech') {
        const { data: svData } = await supabase
          .from('services')
          .select('*')
          .eq('shop_id', cleanShopId)
          .order('created_at', { ascending: true });
        setServices(svData || []);
      }
    } catch (err) {
      console.error("System Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // サービス更新用
  const handleUpdateService = (id, field, value) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // サービス保存（親子構造を一括保存）
  const saveServices = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('services').upsert(services);
      if (error) throw error;
      alert('施術商品の構成を保存しました！');
    } catch (err) {
      alert('保存エラー: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- スタイル定義（完全ワイド・独自レイアウト） ---
  const fullPageWrapper = {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    display: 'flex', background: '#fff', zIndex: 9999, overflow: 'hidden', fontFamily: 'sans-serif'
  };

  const sidebarStyle = {
    width: '260px', height: '100%', background: '#e0d7f7', borderRight: '2px solid #4b2c85',
    padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', flexShrink: 0
  };

  const mainAreaStyle = { flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 };

  const btnStyle = (id, color) => ({
    width: '100%', padding: '12px', background: activeMenu === id ? '#fff' : color,
    color: activeMenu === id ? '#000' : '#fff', border: '1px solid #000', borderRadius: '2px',
    fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
    boxShadow: activeMenu === id ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : '2px 2px 0px rgba(0,0,0,0.5)',
    textAlign: 'center', marginBottom: '6px'
  });

  return (
    <div style={fullPageWrapper}>
      {/* ⬅️ 左メニュー */}
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

      {/* ➡️ 右コンテンツ */}
      <div style={mainAreaStyle}>
        
        {/* 日常業務エリア（既存ロジック維持） */}
        {activeMenu === 'work' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ background: '#d34817', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontStyle: 'italic' }}>SOLO - 受付台帳 -</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={headerBtnStyle}>カルテ</button>
                <button style={headerBtnStyle}>新規客</button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 25px', background: '#fdf2f0', borderBottom: '2px solid #d34817' }}>
              <div style={{ background: '#fff', padding: '8px 20px', border: '1px solid #d34817', fontWeight: '900', fontSize: '1.2rem' }}>{todayStr.replace(/-/g, '/')}</div>
              <div style={{ marginLeft: 'auto', display: 'flex', border: '1px solid #ddd', background: '#fff' }}>
                <input type="text" placeholder="客検索" style={{ padding: '8px 15px', border: 'none', width: '250px' }} />
                <button style={{ padding: '8px 20px', background: '#d34817', color: '#fff', border: 'none' }}>検索</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>状況</th><th style={thStyle}>予約</th><th style={thStyle}>お客様</th>
                    <th style={thStyle}>メイン担当者</th><th style={thStyle}>受付メモ</th><th style={thStyle}>お会計</th>
                    <th style={thStyle}>施術</th><th style={thStyle}>店販</th><th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {todayReservations.map((res, idx) => (
                    <tr key={res.id}>
                      <td style={tdStyle(idx % 2)}><span style={{ color: '#e11d48', fontWeight: 'bold' }}>予約</span></td>
                      <td style={tdStyle(idx % 2)}>{new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ ...tdStyle(idx % 2), background: '#008000', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>{res.customer_name}</td>
                      <td style={tdStyle(idx % 2)}>{shop?.owner_name}</td>
                      <td style={{ ...tdStyle(idx % 2), textAlign: 'left' }}>{res.options?.people?.[0]?.services?.map(s => s.name).join(', ') || '---'}</td>
                      <td style={tdStyle(idx % 2)}>0</td><td style={tdStyle(idx % 2)}>1</td><td style={tdStyle(idx % 2)}>0</td>
                      <td style={tdStyle(idx % 2)}><button style={{ color: '#d34817' }}>✕</button></td>
                    </tr>
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <tr key={`empty-${i}`}>{[...Array(9)].map((_, j) => (<td key={j} style={tdStyle((todayReservations.length + i) % 2)}>&nbsp;</td>))}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', background: '#d34817', padding: '10px 25px', gap: '5px' }}>
              <div style={footerLabelStyle}>客数</div><div style={footerValueStyle}>{todayReservations.length}</div>
              <div style={footerLabelStyle}>お会計累計</div><div style={footerValueStyle}>0</div>
            </div>
          </div>
        )}

        {/* 🆕 施術商品エリア：親子ツリー構造マスター */}
        {activeMenu === 'master_tech' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
            <div style={{ background: '#4285f4', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontStyle: 'italic' }}>初期設定 [施術商品マスター]</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    const name = prompt('新しいカテゴリー名を入力（例：カット、カラー）');
                    if (name) {
                      const newParent = { id: crypto.randomUUID(), shop_id: cleanShopId, name: name, price: 0, duration_min: 30, category_name: name, is_parent: true, created_at: new Date().toISOString() };
                      setServices([...services, newParent]);
                    }
                  }}
                  style={{ padding: '8px 20px', background: '#fff', color: '#4285f4', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <FolderPlus size={18} /> カテゴリー追加
                </button>
                <button onClick={saveServices} disabled={isSaving} style={{ padding: '8px 30px', background: '#008000', color: '#fff', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' }}>一括保存</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '30px' }}>
                {services.filter(s => s.is_parent || !s.parent_id).map(parent => (
                  <div key={parent.id} style={{ background: '#fff', border: '2px solid #4285f4', borderRadius: '8px', boxShadow: '5px 5px 0px rgba(66, 133, 244, 0.1)' }}>
                    <div style={{ background: '#f3f0ff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4285f4' }}>
                      <input 
                        type="text" 
                        value={parent.name} 
                        onChange={(e) => handleUpdateService(parent.id, 'name', e.target.value)}
                        style={{ background: 'transparent', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', color: '#4b2c85', width: '60%' }}
                      />
                      <button 
                        onClick={() => {
                          const name = prompt(`${parent.name} に追加する詳細メニュー名（メンズ、レディース等）`);
                          if (name) {
                            const newChild = { id: crypto.randomUUID(), shop_id: cleanShopId, name: name, price: 0, parent_id: parent.id, category_name: parent.name, created_at: new Date().toISOString() };
                            setServices([...services, newChild]);
                          }
                        }}
                        style={{ padding: '5px 12px', background: '#4285f4', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        ＋ 詳細メニュー
                      </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody style={{ fontSize: '0.9rem' }}>
                        {services.filter(child => child.parent_id === parent.id).map(child => (
                          <tr key={child.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px 20px' }}>
                              <input 
                                type="text" 
                                value={child.name} 
                                onChange={(e) => handleUpdateService(child.id, 'name', e.target.value)}
                                style={{ width: '100%', border: 'none', background: '#f8fafc', padding: '5px' }}
                              />
                            </td>
                            <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                              ¥ <input 
                                type="number" 
                                value={child.price} 
                                onChange={(e) => handleUpdateService(child.id, 'price', parseInt(e.target.value))}
                                style={{ width: '100px', textAlign: 'right', border: '1px solid #ddd', padding: '5px', fontWeight: 'bold' }}
                              />
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <button onClick={() => setServices(services.filter(s => s.id !== child.id))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '10px', textAlign: 'right' }}>
                      <button onClick={() => setServices(services.filter(s => s.id !== parent.id))} style={{ fontSize: '0.7rem', color: '#999', border: 'none', background: 'none', cursor: 'pointer' }}>カテゴリーごと削除</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TOPページ */}
        {activeMenu === 'home' && (
          <div style={{ padding: '50px' }}>
            <div style={{ maxWidth: '600px', background: '#fff', padding: '40px', border: '3px double #4b2c85' }}>
              <h3 style={{ borderBottom: '2px solid #4b2c85', paddingBottom: '15px' }}>SOLO システム情報</h3>
              <p><strong>ライセンス店舗:</strong> {shop?.business_name}</p>
              <p><strong>代表者:</strong> {shop?.owner_name}</p>
              <p style={{ marginTop: '50px', fontSize: '1.5rem', fontWeight: 'bold' }}>{todayStr.replace(/-/g, '/')}□</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 共通パーツ
const headerBtnStyle = { padding: '8px 20px', background: '#008000', color: '#fff', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' };
const toolBtnStyle = { padding: '8px 15px', background: '#d34817', color: '#fff', border: '1px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };
const thStyle = { background: '#f3f0ff', border: '1px solid #4b2c85', padding: '12px', fontWeight: 'bold', color: '#4b2c85', textAlign: 'center' };
const tdStyle = (isAlt) => ({ border: '1px solid #e2e8f0', padding: '12px', background: isAlt ? '#fff0f5' : '#fff', textAlign: 'center' });
const footerLabelStyle = { background: '#f3f0ff', padding: '8px 20px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #d34817' };
const footerValueStyle = { background: '#fff', padding: '8px 25px', fontSize: '1.2rem', fontWeight: '900', minWidth: '100px', textAlign: 'right' };

export default AdminManagement;