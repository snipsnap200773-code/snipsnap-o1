import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ConfirmReservation() {
  const { shopId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 前の画面から引き継いだデータ
  // 💡 adminDate / adminTime があれば「管理者のねじ込み」と判定
  const { selectedServices, selectedOptions, totalSlotsNeeded, date, time, adminDate, adminTime } = location.state || {};
  const isAdminEntry = !!adminDate; 

  const [shop, setShop] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 日付または管理用日付のどちらもなければリダイレクト
    if (!date && !adminDate) {
      navigate(`/shop/${shopId}/reserve`); 
      return;
    }
    fetchShop();
  }, []);

  const fetchShop = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', shopId).single();
    if (data) setShop(data);
  };

  const handleReserve = async () => {
    // 💡 爆速判定：ねじ込みなら名前だけでOK、一般予約なら全項目チェック
    if (isAdminEntry) {
      if (!customerName) {
        alert('お客様名を入力してください');
        return;
      }
    } else {
      if (!customerName || !customerPhone || !customerEmail) {
        alert('お名前、電話番号、メールアドレスをすべて入力してください');
        return;
      }
      if (!customerEmail.includes('@')) {
        alert('有効なメールアドレスを入力してください');
        return;
      }
    }

    setIsSubmitting(true);

    // 💡 日時は adminDate があればそちらを優先
    const targetDate = adminDate || date;
    const targetTime = adminTime || time;

    const startDateTime = new Date(`${targetDate}T${targetTime}`);
    const interval = shop.slot_interval_min || 15;
    
    // ✅ 内部計算：施術時間に「準備時間」を足して終了時間を決める
    const buffer = shop.buffer_preparation_min || 0;
    const totalMinutes = (totalSlotsNeeded * interval) + buffer;
    
    const endDateTime = new Date(startDateTime.getTime() + totalMinutes * 60000);

    // 1. 予約データをテーブルに保存
    const { data: resData, error: dbError } = await supabase.from('reservations').insert([
      {
        shop_id: shopId,
        // ねじ込みの場合は名前に印をつける（任意）
        customer_name: isAdminEntry ? `${customerName} (店舗受付)` : customerName,
        customer_phone: customerPhone || '---',
        customer_email: customerEmail || 'admin@example.com',
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(), // ✅ インターバル込みで保存
        total_slots: totalSlotsNeeded,
        res_type: isAdminEntry ? 'normal' : 'normal', // 必要なら種別を分ける
        options: {
          services: selectedServices,
          options: selectedOptions
        }
      }
    ]).select();

    if (dbError) {
      console.error("Database Error:", dbError);
      alert(`予約に失敗しました。理由: ${dbError.message}`);
      setIsSubmitting(false);
      return;
    }

    // 2. 成功したらメール送信（💡 ねじ込みモードなら送信自体をスキップ！）
    if (!isAdminEntry) {
      try {
        const { error: funcError } = await supabase.functions.invoke('send-reservation-email', {
          body: {
            reservationId: resData[0].id,
            customerEmail: customerEmail,
            customerName: customerName,
            shopName: shop.business_name,
            shopEmail: shop.email_contact,
            startTime: `${targetDate.replace(/-/g, '/')} ${targetTime}`,
            services: selectedServices.map(s => s.name).join(', ')
          }
        });

        if (funcError) {
          console.error("Mail Function Error:", funcError);
          alert('予約は完了しましたが、確認メールの送信のみ失敗しました。');
        }
      } catch (err) {
        console.error("Function Call Error:", err);
      }
    }

    alert(isAdminEntry ? '爆速ねじ込み完了！' : '予約が完了しました！');
    
    // 💡 完了後の戻り先：ねじ込みなら管理画面へ、一般ならトップへ
    if (isAdminEntry) {
      navigate(`/admin/${shopId}/reservations`);
    } else {
      navigate('/'); 
    }
    setIsSubmitting(false);
  };

  if (!shop) return null;

  // 表示用の変数
  const displayDate = (adminDate || date).replace(/-/g, '/');
  const displayTime = adminTime || time;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', border: 'none', background: 'none', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>← 戻る</button>
      
      <h2 style={{ borderLeft: isAdminEntry ? '4px solid #e11d48' : '4px solid #2563eb', paddingLeft: '10px', fontSize: '1.2rem', marginBottom: '25px' }}>
        {isAdminEntry ? '⚡ 店舗ねじ込み予約（入力短縮）' : '予約内容の確認'}
      </h2>

      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', marginBottom: '25px', fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
        <p style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>📅</span> <b>日時：</b> {displayDate} {displayTime} 〜
        </p>
        <p style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>📋</span> <b>選択メニュー：</b>
        </p>
        <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
          {selectedServices.map(s => (
            <div key={s.id} style={{ marginBottom: '4px', fontSize: '0.85rem' }}>・{s.name}</div>
          ))}
        </div>
        <p style={{ marginTop: '15px', color: '#2563eb', fontWeight: 'bold', textAlign: 'right' }}>
          ⏳ 所要時間目安: {totalSlotsNeeded * (shop.slot_interval_min || 15)}分
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>お客様名 (必須)</label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="三土手 功真" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '1rem' }} />
        </div>

        {/* 💡 ねじ込みモードならメールと電話の入力を隠す */}
        {!isAdminEntry && (
          <>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>メールアドレス</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="example@mail.com" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>電話番号</label>
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="09012345678" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>
          </>
        )}

        <button onClick={handleReserve} disabled={isSubmitting} 
          style={{ 
            marginTop: '10px', padding: '18px', 
            background: isSubmitting ? '#94a3b8' : (isAdminEntry ? '#e11d48' : '#2563eb'), 
            color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
          }}>
          {isSubmitting ? '予約処理中...' : (isAdminEntry ? '🚀 この内容でねじ込む' : 'この内容で予約を確定する')}
        </button>
      </div>
    </div>
  );
}

export default ConfirmReservation;