import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, BarChart3, Search, ChevronRight, Save, ClipboardList, Wallet } from 'lucide-react';

function AdminManagement() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  // --- 状態管理 ---
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'sales'
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 顧客管理用
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerEditMemo, setCustomerEditMemo] = useState('');

  // 売上管理用
  const [sales, setSales] = useState([]);
  const [targetDate, setTargetDate] = useState(new Date().toLocaleDateString('sv-SE'));

  useEffect(() => { fetchInitialData(); }, [shopId, activeTab, targetDate]);

  const fetchInitialData = async () => {
    setLoading(true);
    // 1. 店舗情報
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (profile) setShop(profile);

    if (activeTab === 'customers') {
      // 2. 顧客リスト取得（来店回数順など）
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .order('last_visited_at', { ascending: false });
      setCustomers(custData || []);
    } else {
      // 3. 売上データ取得
      const { data: salesData } = await supabase
        .from('sales')
        .select('*, customers(name)')
        .eq('shop_id', shopId)
        .eq('sale_date', targetDate);
      setSales(salesData || []);
    }
    setLoading(false);
  };

  // 顧客検索フィルタ
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.includes(searchTerm) || (c.name_kana && c.name_kana.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  // 売上合計計算
  const totalDailySales = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.total_amount, 0);
  }, [sales]);

  const handleUpdateTechnicalMemo = async () => {
    if (!selectedCustomer) return;
    const { error } = await supabase
      .from('customers')
      .update({ technical_memo: customerEditMemo })
      .eq('id', selectedCustomer.id);
    
    if (!error) {
      alert('カルテを更新しました');
      fetchInitialData();
    }
  };

  if (loading && !shop) return <div style={{ textAlign: 'center', padding: '50px' }}>読み込み中...</div>;

  const themeColor = shop?.theme_color || '#2563eb';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', paddingBottom: '50px', fontFamily: 'sans-serif' }}>
      
      {/* ヘッダータブ */}
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>店舗運営管理</h1>
          <button onClick={() => navigate(`/admin/${shopId}/reservations`)} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>予約管理へ戻る</button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('customers')}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: activeTab === 'customers' ? themeColor : '#f1f5f9', color: activeTab === 'customers' ? '#fff' : '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Users size={18} /> 顧客・カルテ
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: activeTab === 'sales' ? themeColor : '#f1f5f9', color: activeTab === 'sales' ? '#fff' : '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <BarChart3 size={18} /> 売上分析
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* --- 👤 顧客管理セクション --- */}
        {activeTab === 'customers' && (
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '350px 1fr' : '1fr', gap: '20px' }}>
            {/* 顧客リスト */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '70vh' }}>
              <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="顧客名・かな検索" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredCustomers.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => { setSelectedCustomer(c); setCustomerEditMemo(c.technical_memo || ''); }}
                    style={{ padding: '15px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: selectedCustomer?.id === c.id ? `${themeColor}10` : 'transparent', borderLeft: selectedCustomer?.id === c.id ? `4px solid ${themeColor}` : '4px solid transparent' }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{c.name} 様</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>来店: {c.total_visits || 0}回 | 最終: {c.last_visited_at ? new Date(c.last_visited_at).toLocaleDateString() : '記録なし'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* カルテ詳細 */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '25px' }}>
              {selectedCustomer ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900' }}>{selectedCustomer.name} 様</h2>
                      <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{selectedCustomer.phone || '電話番号未登録'}</p>
                    </div>
                    <button onClick={handleUpdateTechnicalMemo} style={{ padding: '10px 20px', background: themeColor, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <Save size={18} /> 保存
                    </button>
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>
                      <ClipboardList size={16} /> 技術カルテ・基本メモ
                    </label>
                    <textarea 
                      value={customerEditMemo}
                      onChange={(e) => setCustomerEditMemo(e.target.value)}
                      placeholder="髪質、カラー配合、カットの好みなど..."
                      style={{ width: '100%', minHeight: '300px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', lineHeight: '1.6', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <Users size={48} style={{ marginBottom: '10px', opacity: 0.3 }} />
                  <p>左のリストから顧客を選択してください</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 💰 売上管理セクション --- */}
        {activeTab === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 2fr' : '1fr', gap: '20px' }}>
              
              {/* 売上サマリー */}
              <div style={{ background: themeColor, color: '#fff', borderRadius: '20px', padding: '30px', boxShadow: `0 10px 20px ${themeColor}30` }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '10px' }}>
                  <input 
                    type="date" 
                    value={targetDate} 
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none' }}
                  />
                  の売上合計
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>¥{totalDailySales.toLocaleString()}</div>
                <div style={{ marginTop: '20px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '10px' }}>
                  件数: {sales.length} 件 | 客単価: ¥{sales.length > 0 ? Math.round(totalDailySales / sales.length).toLocaleString() : 0}
                </div>
              </div>

              {/* 当日明細リスト */}
              <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '25px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={18} color={themeColor} /> 売上明細
                </h3>
                {sales.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sales.map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{s.customers?.name || '不明'} 様</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.payment_method} | {new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '1.1rem' }}>¥{s.total_amount.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>本日の売上データはまだありません</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManagement;