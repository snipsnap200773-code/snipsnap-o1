import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ReservationForm() {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [availableOptions, setAvailableOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({}); // { 'グループ名': オプションオブジェクト }

  useEffect(() => {
    const fetchData = async () => {
      const shopRes = await supabase.from('profiles').select('*').eq('id', shopId).single();
      const servicesRes = await supabase.from('services').select('*').eq('shop_id', shopId).order('sort_order');
      if (shopRes.data) setShop(shopRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
    };
    fetchData();
  }, [shopId]);

  // メニュー選択時にオプションを取得
  const handleServiceSelect = async (service) => {
    setSelectedService(service);
    setSelectedOptions({});
    const { data } = await supabase.from('service_options').select('*').eq('service_id', service.id);
    setAvailableOptions(data || []);
  };

  // 合計時間を計算
  const calculateTotalSlots = () => {
    let total = selectedService ? selectedService.slots : 0;
    Object.values(selectedOptions).forEach(opt => {
      total += opt.additional_slots;
    });
    return total;
  };

  // オプションをグループごとにまとめる
  const groupedOptions = availableOptions.reduce((acc, opt) => {
    if (!acc[opt.group_name]) acc[opt.group_name] = [];
    acc[opt.group_name].push(opt);
    return acc;
  }, {});

  if (!shop) return <div style={{ textAlign: 'center', padding: '50px' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <Link to="/" style={{ color: '#666', fontSize: '0.8rem' }}>← 戻る</Link>
      
      <h2 style={{ textAlign: 'center' }}>{shop.business_name}</h2>

      {/* ステップ1: メニュー選択 */}
      {!selectedService && (
        <div>
          <h3>1. メニュー選択</h3>
          {services.map(s => (
            <button key={s.id} onClick={() => handleServiceSelect(s)} style={{ width: '100%', padding: '15px', marginBottom: '10px', borderRadius: '12px', border: '1px solid #ddd', background: 'white', textAlign: 'left' }}>
              <b>{s.name}</b> ({s.slots * 30}分)
            </button>
          ))}
        </div>
      )}

      {/* ステップ2: 枝分かれ質問 (オプション選択) */}
      {selectedService && (
        <div>
          <div style={{ background: '#eef2ff', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <b>選択中: {selectedService.name}</b> ({calculateTotalSlots() * 30}分)
            <button onClick={() => setSelectedService(null)} style={{ float: 'right', color: '#2563eb', border: 'none', background: 'none' }}>変更</button>
          </div>

          {Object.keys(groupedOptions).map(groupName => (
            <div key={groupName} style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>{groupName}を選んでください</h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                {groupedOptions[groupName].map(opt => (
                  <button 
                    key={opt.id} 
                    onClick={() => setSelectedOptions({...selectedOptions, [groupName]: opt})}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: selectedOptions[groupName]?.id === opt.id ? '2px solid #2563eb' : '1px solid #ddd',
                      background: selectedOptions[groupName]?.id === opt.id ? '#eff6ff' : 'white'
                    }}
                  >
                    {opt.option_name} (+{opt.additional_slots * 30}分)
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* 全ての必須オプションが選ばれたら時間を表示 */}
          {Object.keys(groupedOptions).every(name => selectedOptions[name]) && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ borderLeft: '4px solid #2563eb', paddingLeft: '10px' }}>3. 日時を選択</h3>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>合計 {calculateTotalSlots() * 30} 分の空き枠を表示中</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {['09:00', '10:00', '11:00'].map(time => (
                  <button key={time} style={{ padding: '15px', border: '1px solid #2563eb', borderRadius: '8px', background: 'white', color: '#2563eb' }}>{time}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReservationForm;