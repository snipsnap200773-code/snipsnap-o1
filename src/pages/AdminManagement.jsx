import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Save, Clipboard, Search, ChevronLeft, ChevronRight, Calendar, 
  FolderPlus, PlusCircle, Trash2, Tag, ChevronDown, Layers
} from 'lucide-react';

function AdminManagement() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  // 🆕 IDの末尾欠けや空白によるエラー(400)を完全に防ぐガード
  const cleanShopId = shopId?.trim();

  const [activeMenu, setActiveMenu] = useState('work');
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 3階層データ用
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [options, setOptions] = useState([]);
  
  // 日常業務用
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
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', cleanShopId).maybeSingle();
      if (profile) setShop(profile);

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

      if (activeMenu === 'master_tech') {
        const [catRes, svcRes, optRes] = await Promise.all([
          supabase.from('service_categories').select('*').eq('shop_id', cleanShopId).order('id', { ascending: true }),
          supabase.from('services').select('*').eq('shop_id', cleanShopId).order('id', { ascending: true }),
          supabase.from('service_options').select('*').eq('shop_id', cleanShopId).order('id', { ascending: true })
        ]);

        setCategories(catRes.data || []);
        setServices(svcRes.data || []);
        setOptions(optRes.data || []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 3階層操作ロジック ---
  const addCategory = () => {
    const name = prompt("新しいカテゴリー（例：カット、カラー）");
    if (name) setCategories([...categories, { id: crypto.randomUUID(), shop_id: cleanShopId, name }]);
  };

  const addService = (catId) => {
    const name = prompt("基本メニュー名（例：カット基本、カラー基本）");
    if (name) setServices([...services, { id: crypto.randomUUID(), shop_id: cleanShopId, category_id: catId, name, price: 0 }]);
  };

  const addOption = (svcId) => {
    const name = prompt("枝分かれ詳細（例：メンズ、レディース、シニア）");
    if (name) setOptions([...options, { id: crypto.randomUUID(), shop_id: cleanShopId, service_id: svcId, name, price: 0 }]);
  };

  const deleteItem = (type, id) => {
    if (!window.confirm("削除しますか？")) return;
    if (type === 'cat') setCategories(categories.filter(c => c.id !== id));
    if (type === 'svc') setServices(services.filter(s => s.id !== id));
    if (type === 'opt') setOptions(options.filter(o => o.id !== id));
  };

  const saveAllMasters = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        supabase.from('service_categories').upsert(categories),
        supabase.from('services').upsert(services),
        supabase.from('service_options').upsert(options)
      ]);
      alert("全構成を保存しました！");
    } catch (err) {
      alert("保存エラー: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- スタイル定義 (ワイド独自レイアウト) ---
  const fullPageWrapper = {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    display: 'flex', background: '#fff', zIndex: 9999, overflow: 'hidden'
  };

  const sidebarStyle = {
    width: '260px', background: '#e0d7f7', borderRight: '2px solid #4b2c85',
    padding: '20px', display: 'flex', flexDirection: 'column', flexShrink: 0
  };

  return (
    <div style={fullPageWrapper}>
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* 日常業務 */}
        {activeMenu === 'work' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ background: '#d34817', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontStyle: 'italic' }}>SOLO - 受付台帳 -</h2>
              <div style={{ background: '#fff', color: '#d34817', padding: '5px 15px', fontWeight: 'bold' }}>{todayStr}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f0ff' }}>
                    <th style={thStyle}>状況</th><th style={thStyle}>予約時間</th><th style={thStyle}>お客様名</th><th style={thStyle}>メニュー</th><th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {todayReservations.map((res) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>予約</td>
                      <td style={tdStyle}>{new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ ...tdStyle, background: '#008000', color: '#fff', fontWeight: 'bold' }}>{res.customer_name}</td>
                      <td style={tdStyle}>{res.options?.people?.[0]?.services?.map(s => s.name).join(', ') || '---'}</td>
                      <td style={tdStyle}><button style={{ color: '#d34817' }}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🆕 施術商品 (基本料金 ＋ 詳細枝分かれ設定) */}
        {activeMenu === 'master_tech' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
            <div style={{ background: '#4285f4', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontStyle: 'italic' }}>SOLO - 施術3階層マスター(基本＋詳細設定) -</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addCategory} style={actionBtnStyle}><FolderPlus size={18} /> カテゴリー追加</button>
                <button onClick={saveAllMasters} disabled={isSaving} style={{ ...actionBtnStyle, background: '#008000' }}><Save size={18} /> 一括保存</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              {categories.map(cat => (
                <div key={cat.id} style={cardStyle}>
                  {/* 第1階層: カテゴリー */}
                  <div style={catHeaderStyle}>
                    <input 
                      value={cat.name} 
                      onChange={(e) => setCategories(categories.map(c => c.id === cat.id ? {...c, name: e.target.value} : c))}
                      style={catInputStyle}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => addService(cat.id)} style={plusBtnStyle}><PlusCircle size={14} /> メニュー追加</button>
                      <button onClick={() => deleteItem('cat', cat.id)} style={{ color: '#ff1493', background: 'none', border: 'none' }}><Trash2 size={18} /></button>
                    </div>
                  </div>

                  {/* 第2階層: メニュー(基本料金) */}
                  {services.filter(s => s.category_id === cat.id).map(svc => (
                    <div key={svc.id} style={{ borderBottom: '1px solid #eee' }}>
                      <div style={svcRowStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                          <Tag size={16} color="#4285f4" />
                          <input 
                            value={svc.name} 
                            onChange={(e) => setServices(services.map(s => s.id === svc.id ? {...s, name: e.target.value} : s))}
                            style={svcInputStyle}
                          />
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>基本料金:</span>
                          <input 
                            type="number" value={svc.price} 
                            onChange={(e) => setServices(services.map(s => s.id === svc.id ? {...s, price: parseInt(e.target.value)} : s))}
                            style={priceInputStyle}
                          /> 円
                        </div>
                        <button onClick={() => addOption(svc.id)} style={optAddBtnStyle}>＋ 詳細・枝分かれ</button>
                        <button onClick={() => deleteItem('svc', svc.id)} style={{ color: '#999', border: 'none', background: 'none' }}><Trash2 size={16} /></button>
                      </div>

                      {/* 第3階層: 枝分かれ(詳細価格) */}
                      <div style={optWrapperStyle}>
                        {options.filter(o => o.service_id === svc.id).map(opt => (
                          <div key={opt.id} style={optChipStyle}>
                            <ChevronDown size={14} />
                            <input 
                              value={opt.name} 
                              onChange={(e) => setOptions(options.map(o => o.id === opt.id ? {...o, name: e.target.value} : o))}
                              style={optInputStyle}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>詳細単価:</span>
                            <input 
                              type="number" value={opt.price} 
                              onChange={(e) => setOptions(options.map(o => o.id === opt.id ? {...o, price: parseInt(e.target.value)} : o))}
                              style={optPriceStyle}
                            /> 円
                            <button onClick={() => deleteItem('opt', opt.id)} style={{ border: 'none', background: 'none', color: '#ff1493' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- スタイルパーツ ---
const navBtnStyle = (active, color) => ({
  width: '100%', padding: '12px', background: active ? '#fff' : color,
  color: active ? '#000' : '#fff', border: '1px solid #000', borderRadius: '2px',
  fontWeight: 'bold', cursor: 'pointer', marginBottom: '6px',
  boxShadow: active ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : '2px 2px 0px rgba(0,0,0,0.5)'
});

const actionBtnStyle = { background: '#fff', color: '#4285f4', border: 'none', padding: '8px 15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px' };
const cardStyle = { background: '#fff', border: '2px solid #4b2c85', borderRadius: '8px', marginBottom: '30px', boxShadow: '5px 5px 0px rgba(75, 44, 133, 0.1)', overflow: 'hidden' };
const catHeaderStyle = { background: '#f3f0ff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #4b2c85' };
const catInputStyle = { background: 'transparent', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', color: '#4b2c85', width: '50%' };
const svcRowStyle = { padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', background: '#fff' };
const svcInputStyle = { border: '1px solid #ddd', padding: '8px', width: '220px', fontWeight: 'bold' };
const priceInputStyle = { border: '1px solid #ddd', padding: '8px', width: '90px', textAlign: 'right', fontWeight: '900', color: '#d34817' };
const optWrapperStyle = { display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '0 20px 15px 50px' };
const optChipStyle = { background: '#f8fafc', border: '1px solid #cbd5e1', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '20px' };
const optInputStyle = { background: 'transparent', border: 'none', fontSize: '0.85rem', width: '100px', fontWeight: 'bold' };
const optPriceStyle = { border: 'none', background: '#e2e8f0', width: '70px', textAlign: 'right', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' };
const plusBtnStyle = { background: '#4285f4', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' };
const optAddBtnStyle = { background: '#fff', border: '1px dashed #4285f4', color: '#4285f4', padding: '5px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' };
const thStyle = { padding: '12px', border: '1px solid #4b2c85' };
const tdStyle = { padding: '12px', border: '1px solid #eee', textAlign: 'center' };

export default AdminManagement;