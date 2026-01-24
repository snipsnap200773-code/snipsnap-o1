import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Save, Clipboard, Calendar, FolderPlus, PlusCircle, Trash2, 
  Tag, ChevronDown, RefreshCw, ChevronLeft, ChevronRight, Settings, Users, Percent, Plus, Minus
} from 'lucide-react';

function AdminManagement() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const cleanShopId = shopId?.trim();

  const [activeMenu, setActiveMenu] = useState('work');
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- 統合マスターデータ ---
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]); 
  const [adminAdjustments, setAdminAdjustments] = useState([]);
  
  // 削除予定のIDを記録する箱
  const [deletedAdjIds, setDeletedAdjIds] = useState([]);

  // 日常業務(予約)用
  const [todayReservations, setTodayReservations] = useState([]);
  const todayStr = new Date().toLocaleDateString('sv-SE');

  useEffect(() => {
    if (cleanShopId) {
      fetchInitialData();
    }
  }, [cleanShopId, activeMenu]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const shopRes = await supabase.from('profiles').select('*').eq('id', cleanShopId).single();
      if (shopRes.data) setShop(shopRes.data);

      if (activeMenu === 'work') {
        const { data: resData } = await supabase
          .from('reservations')
          .select('*')
          .eq('shop_id', cleanShopId)
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`)
          .order('start_time', { ascending: true });
        setTodayReservations(resData || []);
      }

      if (activeMenu === 'master_tech') {
        const [catRes, servRes, optRes, adjRes] = await Promise.all([
          supabase.from('service_categories').select('*').eq('shop_id', cleanShopId).order('sort_order'),
          supabase.from('services').select('*').eq('shop_id', cleanShopId).order('sort_order'),
          supabase.from('service_options').select('*'),
          supabase.from('admin_adjustments').select('*')
        ]);

        setCategories(catRes.data || []);
        setServices(servRes.data || []);
        setServiceOptions(optRes.data || []);
        setAdminAdjustments(adjRes.data || []);
        setDeletedAdjIds([]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveAllMasters = async () => {
    setIsSaving(true);
    try {
      const formattedServices = services.map(svc => ({
        id: svc.id, shop_id: cleanShopId, name: svc.name, price: svc.price || 0,
        category: svc.category, sort_order: svc.sort_order || 0
      }));

      const formattedOptions = serviceOptions.map(opt => ({
        id: opt.id, service_id: opt.service_id, group_name: opt.group_name,
        option_name: opt.option_name, additional_price: opt.additional_price || 0
      }));

      const formattedAdjustments = adminAdjustments.map(adj => ({
        id: adj.id, service_id: adj.service_id, name: adj.name, price: adj.price || 0,
        is_percent: adj.is_percent || false, is_minus: adj.is_minus || false
      }));

      const promises = [
        supabase.from('services').upsert(formattedServices),
        supabase.from('service_options').upsert(formattedOptions),
        supabase.from('admin_adjustments').upsert(formattedAdjustments)
      ];

      if (deletedAdjIds.length > 0) {
        promises.push(supabase.from('admin_adjustments').delete().in('id', deletedAdjIds));
      }

      const results = await Promise.all(promises);
      results.forEach(res => { if (res.error) throw res.error; });

      alert("すべての設定と削除を同期しました！");
      setDeletedAdjIds([]);
      fetchInitialData();
    } catch (err) {
      alert("保存失敗: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addAdjustment = (svcId = null) => {
    const name = prompt("管理用メニュー名を入力（例：薬剤50g、10%OFF、シニア割 等）");
    if (name) {
      setAdminAdjustments([...adminAdjustments, { 
        id: crypto.randomUUID(), service_id: svcId, name: name, price: 0, 
        is_percent: false, is_minus: false 
      }]);
    }
  };

  const handleRemoveAdj = (id) => {
    setAdminAdjustments(adminAdjustments.filter(a => a.id !== id));
    if (id.includes('-')) setDeletedAdjIds([...deletedAdjIds, id]);
  };

  // 🆕 ＋・－・％ の切り替えロジック
  const cycleAdjType = (id) => {
    setAdminAdjustments(adminAdjustments.map(a => {
      if (a.id !== id) return a;
      if (!a.is_percent && !a.is_minus) return { ...a, is_minus: true, is_percent: false }; // ＋ → －
      if (a.is_minus) return { ...a, is_minus: false, is_percent: true }; // － → ％
      return { ...a, is_minus: false, is_percent: false }; // ％ → ＋
    }));
  };

  const fullPageWrapper = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', background: '#fff', zIndex: 9999, overflow: 'hidden' };
  const sidebarStyle = { width: '260px', background: '#e0d7f7', borderRight: '2px solid #4b2c85', padding: '20px', display: 'flex', flexDirection: 'column', flexShrink: 0 };
  const navBtnStyle = (active, color) => ({ width: '100%', padding: '12px', background: active ? '#fff' : color, color: active ? '#000' : '#fff', border: '1px solid #000', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '6px', boxShadow: active ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : '2px 2px 0px rgba(0,0,0,0.5)' });

  return (
    <div style={fullPageWrapper}>
      {/* ⬅️ サイドバー */}
      <div style={sidebarStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: '900', color: '#4b2c85', margin: 0 }}>SOLO</h2>
          <p style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>MANAGEMENT</p>
        </div>
        <button style={navBtnStyle(activeMenu === 'work', '#d34817')} onClick={() => setActiveMenu('work')}>日常業務</button>
        <button style={navBtnStyle(activeMenu === 'master_tech', '#4285f4')} onClick={() => setActiveMenu('master_tech')}>施術商品</button>
        <div style={{ marginTop: 'auto' }}>
          <button style={navBtnStyle(false, '#ff1493')} onClick={() => navigate(`/admin/${cleanShopId}/reservations`)}>業 務 終 了</button>
        </div>
      </div>

      {/* ➡️ メインエリア */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* ✅ 日常業務 (受付台帳) 完全復旧版 */}
        {activeMenu === 'work' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ background: '#d34817', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontStyle: 'italic', fontSize: '1.4rem' }}>SOLO - 受付台帳 -</h2>
              <div style={{ background: '#fff', color: '#d34817', padding: '5px 15px', fontWeight: 'bold' }}>{todayStr}</div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f0ff', borderBottom: '2px solid #4b2c85' }}>
                    <th style={thStyle}>時間</th><th style={thStyle}>お客様名</th><th style={thStyle}>メニュー(予定)</th><th style={thStyle}>お会計</th><th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {todayReservations.length > 0 ? todayReservations.map((res) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>{new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ ...tdStyle, background: '#008000', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>{res.customer_name}</td>
                      <td style={tdStyle}>{res.options?.people?.[0]?.services?.map(s => s.name).join(', ') || '---'}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>¥ 0</td>
                      <td style={tdStyle}><button style={{ color: '#d34817', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" style={{ padding: '50px', textAlign: 'center', color: '#999' }}>本日の予約はありません。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', background: '#d34817', padding: '10px 25px', gap: '5px' }}>
              <div style={footerLabelStyle}>客数</div><div style={footerValueStyle}>{todayReservations.length}</div>
              <div style={footerLabelStyle}>お会計累計</div><div style={footerValueStyle}>0</div>
            </div>
          </div>
        )}

        {/* ✅ 施術商品マスター (＋－％完全版) */}
        {activeMenu === 'master_tech' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
            <div style={{ background: '#4285f4', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontStyle: 'italic' }}>SOLO - 施術マスター (完全同期) -</h2>
              <button onClick={saveAllMasters} disabled={isSaving} style={{ padding: '8px 30px', background: '#008000', color: '#fff', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' }}>一括保存</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              {categories.map(cat => (
                <div key={cat.id} style={cardStyle}>
                  <div style={catHeaderStyle}><span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4b2c85' }}>📁 {cat.name}</span></div>
                  {services.filter(s => s.category === cat.name).map(svc => (
                    <div key={svc.id} style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <div style={svcRowStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                          <Tag size={16} color="#4285f4" />
                          <span style={{ fontWeight: 'bold', minWidth: '180px', fontSize: '1.1rem' }}>{svc.name}</span>
                          <span style={{ fontSize: '0.8rem' }}>基本料金:</span>
                          <input type="number" value={svc.price || 0} onChange={(e) => setServices(services.map(s => s.id === svc.id ? {...s, price: parseInt(e.target.value)} : s))} style={priceInputStyle} />
                        </div>
                        <button onClick={() => addAdjustment(svc.id)} style={optAddBtnStyle}>＋ 個別調整を追加</button>
                      </div>

                      <div style={{ padding: '0 20px 20px 50px' }}>
                        <div style={{ marginBottom: '10px' }}>
                          <p style={{ fontSize: '0.75rem', color: '#4285f4', fontWeight: 'bold' }}><Users size={14} /> 予約オプション料金設定</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                            {serviceOptions.filter(o => o.service_id === svc.id).map(opt => (
                              <div key={opt.id} style={pubChipStyle}>
                                <span style={{ fontSize: '0.8rem' }}>{opt.option_name}</span>
                                <span style={{ fontSize: '0.8rem' }}>+¥</span>
                                <input type="number" value={opt.additional_price || 0} onChange={(e) => setServiceOptions(serviceOptions.map(o => o.id === opt.id ? {...o, additional_price: parseInt(e.target.value)} : o))} style={miniPriceInput} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}><Settings size={14} /> メニュー個別調整 (＋－％対応)</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                            {adminAdjustments.filter(a => a.service_id === svc.id).map(adj => (
                              <div key={adj.id} style={adjChipStyle}>
                                <input value={adj.name} onChange={(e) => setAdminAdjustments(adminAdjustments.map(a => a.id === adj.id ? {...a, name: e.target.value} : a))} style={optInputStyle} />
                                <button onClick={() => cycleAdjType(adj.id)} style={typeBtnStyle}>
                                  {adj.is_percent ? <Percent size={14} /> : adj.is_minus ? <Minus size={14} /> : <Plus size={14} />}
                                </button>
                                <input type="number" value={adj.price || 0} onChange={(e) => setAdminAdjustments(adminAdjustments.map(a => a.id === adj.id ? {...a, price: parseInt(e.target.value)} : a))} style={optPriceStyle} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{adj.is_percent ? '%' : '円'}</span>
                                <button onClick={() => handleRemoveAdj(adj.id)} style={{ border: 'none', background: 'none', color: '#ff1493' }}>✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* 🆕 最下部：プロの微調整 (管理専用・全体調整) */}
              <div style={{ ...cardStyle, border: '3px solid #ef4444' }}>
                <div style={{ ...catHeaderStyle, background: '#fff5f5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>⚙️ 全体調整・割引マスター (＋－％)</span>
                    <button onClick={() => addAdjustment(null)} style={{ ...optAddBtnStyle, borderColor: '#ef4444', color: '#ef4444' }}>＋ 全体調整項目を追加</button>
                  </div>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  {adminAdjustments.filter(a => a.service_id === null).map(adj => (
                    <div key={adj.id} style={{ ...adjChipStyle, padding: '10px 20px' }}>
                      <input value={adj.name} onChange={(e) => setAdminAdjustments(adminAdjustments.map(a => a.id === adj.id ? {...a, name: e.target.value} : a))} style={{ ...optInputStyle, width: '150px' }} />
                      <button onClick={() => cycleAdjType(adj.id)} style={typeBtnStyle}>
                        {adj.is_percent ? <Percent size={18} /> : adj.is_minus ? <Minus size={18} /> : <Plus size={18} />}
                      </button>
                      <input type="number" value={adj.price || 0} onChange={(e) => setAdminAdjustments(adminAdjustments.map(a => a.id === adj.id ? {...a, price: parseInt(e.target.value)} : a))} style={{ ...optPriceStyle, width: '80px' }} />
                      <span style={{ fontWeight: 'bold' }}>{adj.is_percent ? '%' : '円'}</span>
                      <button onClick={() => handleRemoveAdj(adj.id)} style={{ color: '#ff1493', background: 'none', border: 'none' }}><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- スタイルパーツ (1ミリも省略せず) ---
const cardStyle = { background: '#fff', border: '2px solid #4b2c85', borderRadius: '8px', marginBottom: '30px', overflow: 'hidden' };
const catHeaderStyle = { background: '#f3f0ff', padding: '15px 20px', borderBottom: '2px solid #4b2c85' };
const svcRowStyle = { padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' };
const thStyle = { padding: '12px', border: '1px solid #4b2c85', textAlign: 'center' };
const tdStyle = { padding: '12px', border: '1px solid #eee', textAlign: 'center' };
const priceInputStyle = { border: '1px solid #ddd', padding: '5px', width: '100px', textAlign: 'right', fontWeight: '900', color: '#d34817', fontSize: '1.1rem' };
const miniPriceInput = { border: 'none', background: '#e0f2fe', width: '60px', textAlign: 'right', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' };
const pubChipStyle = { background: '#f0f9ff', border: '1px solid #bae6fd', padding: '4px 12px', borderRadius: '4px', display: 'flex', gap: '5px', alignItems: 'center' };
const adjChipStyle = { background: '#fff5f5', border: '1px solid #feb2b2', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '20px' };
const optInputStyle = { background: 'transparent', border: 'none', fontSize: '0.9rem', width: '110px', fontWeight: 'bold' };
const optPriceStyle = { border: 'none', background: '#fff', width: '70px', textAlign: 'right', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' };
const optAddBtnStyle = { background: '#fff', border: '1px dashed #4285f4', color: '#4285f4', padding: '5px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' };
const typeBtnStyle = { border: '1px solid #ef4444', background: '#fff', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ef4444' };
const footerLabelStyle = { background: '#f3f0ff', padding: '8px 20px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #d34817' };
const footerValueStyle = { background: '#fff', padding: '8px 25px', fontSize: '1.2rem', fontWeight: '900', minWidth: '100px', textAlign: 'right' };

export default AdminManagement;