import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ConfirmReservation() {
  const { shopId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 前の画面から引き継いだデータ
  const { selectedServices, selectedOptions, totalSlotsNeeded, date, time, adminDate, adminTime, lineUser } = location.state || {};
  const isAdminEntry = !!adminDate; 

  const [shop, setShop] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🆕 顧客連動用State
  const [suggestedCustomers, setSuggestedCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  useEffect(() => {
    if (!date && !adminDate) {
      navigate(`/shop/${shopId}/reserve`); 
      return;
    }
    if (lineUser && lineUser.displayName) {
      setCustomerName(lineUser.displayName);
    }
    fetchShop();
  }, []);

  const fetchShop = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (data) setShop(data);
  };

  // 🆕 名前入力時のリアルタイム検索ロジック
  useEffect(() => {
    const searchCustomers = async () => {
      if (!customerName || customerName.length < 1 || selectedCustomerId) {
        setSuggestedCustomers([]);
        return;
      }
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .ilike('name', `%${customerName}%`)
        .limit(5);
      setSuggestedCustomers(data || []);
    };
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [customerName, selectedCustomerId]);

  // 🆕 候補から顧客を選択した時の処理
  const handleSelectCustomer = (c) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerEmail(c.email || '');
    setSelectedCustomerId(c.id);
    setSuggestedCustomers([]);
  };

  const handleReserve = async () => {
    // --- 💡 1. バリデーション ---
    if (!customerName) {
      alert('お客様名を入力してください');
      return;
    }
    if (!isAdminEntry) {
      if (!customerPhone || !customerEmail) {
        alert('電話番号とメールアドレスを入力してください');
        return;
      }
    }

    setIsSubmitting(true);

    // --- 💡 2. 日時・時間の計算 ---
    const targetDate = adminDate || date;
    const targetTime = adminTime || time;
    const startDateTime = new Date(`${targetDate}T${targetTime}`);
    const interval = shop.slot_interval_min || 15;
    const buffer = shop.buffer_preparation_min || 0;
    const totalMinutes = (totalSlotsNeeded * interval) + buffer;
    const endDateTime = new Date(startDateTime.getTime() + totalMinutes * 60000);

    const cancelToken = crypto.randomUUID();
    const cancelUrl = `${window.location.origin}/cancel?token=${cancelToken}`;

    try {
      // --- 🆕 💡 3. 顧客テーブル (customers) の自動更新・登録 ---
      // 名前と電話番号（またはLINE ID）で既存客を特定
      const { data: existingCust } = await supabase
        .from('customers')
        .select('id, total_visits')
        .eq('shop_id', shopId)
        .eq('name', customerName)
        .maybeSingle();

      if (existingCust) {
        // 既存客なら来店回数と最終来店日を更新
        await supabase
          .from('customers')
          .update({
            phone: customerPhone || undefined,
            email: customerEmail || undefined,
            total_visits: (existingCust.total_visits || 0) + 1,
            last_arrival_at: startDateTime.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCust.id);
      } else {
        // 新規客なら名簿に登録
        await supabase
          .from('customers')
          .insert([{
            shop_id: shopId,
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            total_visits: 1,
            last_arrival_at: startDateTime.toISOString()
          }]);
      }

      // --- 💡 4. 予約データをテーブルに保存 ---
      const { error: dbError } = await supabase.from('reservations').insert([
        {
          shop_id: shopId,
          customer_name: customerName, // 死守：(店舗受付)は付けない
          customer_phone: customerPhone || '---',
          customer_email: customerEmail || 'admin@example.com',
          start_at: startDateTime.toISOString(),
          end_at: endDateTime.toISOString(),
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(), 
          total_slots: totalSlotsNeeded,
          res_type: 'normal',
          line_user_id: lineUser?.userId || null,
          cancel_token: cancelToken,
          options: { services: selectedServices, options: selectedOptions }
        }
      ]);

      if (dbError) throw dbError;

      // --- 💡 5. 通知処理 ---
      if (!isAdminEntry) {
        const menuLabel = selectedServices.map(s => s.name).join(', ');
        await supabase.functions.invoke('send-reservation-email', {
          body: {
            shopId, customerEmail, customerName, shopName: shop.business_name,
            shopEmail: shop.email_contact, startTime: `${targetDate.replace(/-/g, '/')} ${targetTime}`,
            services: menuLabel, cancelUrl, lineUserId: lineUser?.userId || null,
            notifyLineEnabled: shop.notify_line_enabled
          }
        });
      }

      alert(isAdminEntry ? '爆速ねじ込み完了！名簿も更新しました。' : '予約が完了しました！');
      navigate(isAdminEntry ? `/admin/${shopId}/reservations` : '/');

    } catch (err) {
      console.error(err);
      alert(`エラーが発生しました: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shop) return null;

  const displayDate = (adminDate || date).replace(/-/g, '/');
  const displayTime = adminTime || time;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', border: 'none', background: 'none', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>← 戻る</button>
      
      <h2 style={{ borderLeft: isAdminEntry ? '4px solid #e11d48' : '4px solid #2563eb', paddingLeft: '10px', fontSize: '1.2rem', marginBottom: '25px' }}>
        {isAdminEntry ? '⚡ 店舗ねじ込み予約（入力短縮）' : '予約内容の確認'}
      </h2>

      {/* LINEプロフィール表示 */}
      {lineUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <img src={lineUser.pictureUrl} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="LINE" />
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#166534' }}>LINE連携：{lineUser.displayName} 様</div>
        </div>
      )}

      {/* 予約内容カード */}
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
        <p style={{ margin: '0 0 12px 0' }}>📅 <b>日時：</b> {displayDate} {displayTime} 〜</p>
        <p style={{ margin: '0 0 8px 0' }}>📋 <b>選択メニュー：</b></p>
        <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem' }}>
          {selectedServices.map(s => <div key={s.id}>・{s.name}</div>)}
        </div>
      </div>

      {/* 入力フォーム */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>お客様名 (必須)</label>
          <input 
            type="text" 
            value={customerName} 
            onChange={(e) => { setCustomerName(e.target.value); setSelectedCustomerId(null); }} 
            placeholder="お名前を入力" 
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '1rem' }} 
          />
          {/* 🆕 顧客サジェスト表示 */}
          {suggestedCustomers.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '10px', zIndex: 100, border: '1px solid #eee' }}>
              {suggestedCustomers.map(c => (
                <div key={c.id} onClick={() => handleSelectCustomer(c)} style={{ padding: '12px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <b>{c.name} 様</b> <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({c.phone || '電話なし'})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isAdminEntry && (
          <>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>メールアドレス</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>電話番号</label>
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
          </>
        )}

        <button onClick={handleReserve} disabled={isSubmitting} 
          style={{ 
            marginTop: '10px', padding: '18px', 
            background: isSubmitting ? '#94a3b8' : (isAdminEntry ? '#e11d48' : '#2563eb'), 
            color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer'
          }}>
          {isSubmitting ? '処理中...' : (isAdminEntry ? '🚀 ねじ込んで名簿登録' : '予約を確定する')}
        </button>
      </div>
    </div>
  );
}

export default ConfirmReservation;