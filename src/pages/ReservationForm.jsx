import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; // useLocationを追加
import { supabase } from '../supabaseClient';

function ReservationForm() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // locationを取得
  
  // 管理者画面からの「ねじ込み予約」データを取得
  const isAdminMode = location.state?.adminDate && location.state?.adminTime;
  const adminDate = location.state?.adminDate;
  const adminTime = location.state?.adminTime;

  // 基本データState
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [options, setOptions] = useState([]);

  // ユーザー選択State
  const [selectedServices, setSelectedServices] = useState([]); 
  const [selectedOptions, setSelectedOptions] = useState({}); 
  
  const [loading, setLoading] = useState(true);

  const categoryRefs = useRef({});
  const serviceRefs = useRef({});

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
    setLoading(true);
    const shopRes = await supabase.from('profiles').select('*').eq('id', shopId).single();
    
    if (shopRes.data) {
      setShop(shopRes.data);
      if (!shopRes.data.is_suspended) {
        const catRes = await supabase.from('service_categories').select('*').eq('shop_id', shopId).order('sort_order');
        if (catRes.data) setCategories(catRes.data);
        const servRes = await supabase.from('services').select('*').eq('shop_id', shopId).order('sort_order');
        if (servRes.data) setServices(servRes.data);
        const optRes = await supabase.from('service_options').select('*');
        if (optRes.data) setOptions(optRes.data);
      }
    }
    setLoading(false);
  };

  // --- 計算ロジック：合計必要コマ数 ---
  const totalSlotsNeeded = selectedServices.reduce((sum, s) => sum + s.slots, 0) + 
    Object.values(selectedOptions).reduce((sum, opt) => sum + (opt.additional_slots || 0), 0);

  // --- 必須条件チェックロジック ---
  const checkRequiredMet = () => {
    return selectedServices.every(s => {
      const cat = categories.find(c => c.name === s.category);
      if (!cat?.required_categories) return true;
      
      const requiredNames = cat.required_categories.split(',').map(n => n.trim()).filter(n => n);
      if (requiredNames.length === 0) return true;

      return requiredNames.every(reqName => 
        selectedServices.some(ss => ss.category === reqName)
      );
    });
  };

  const isTotalTimeOk = totalSlotsNeeded > 0;
  const isRequiredMet = checkRequiredMet();

  // --- UI制御ロジック ---
  const disabledCategoryNames = selectedServices.reduce((acc, s) => {
    const cat = categories.find(c => c.name === s.category);
    if (cat?.disable_categories) return [...acc, ...cat.disable_categories.split(',').map(n => n.trim())];
    return acc;
  }, []);

  const scrollToNextValidCategory = (currentCatIdx) => {
    const nextValidCat = categories.slice(currentCatIdx + 1).find(cat => !disabledCategoryNames.includes(cat.name));
    if (nextValidCat && categoryRefs.current[nextValidCat.id]) {
      setTimeout(() => categoryRefs.current[nextValidCat.id].scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    }
  };

  const toggleService = (service, catIdx) => {
    if (disabledCategoryNames.includes(service.category)) return;
    const currentCategory = categories.find(c => c.name === service.category);
    const allowMultipleInCat = currentCategory?.allow_multiple_in_category;
    const hasOptions = options.some(o => o.service_id === service.id);

    if (!shop.allow_multiple_services) {
      setSelectedServices([service]);
      setSelectedOptions({});
      if (!hasOptions) scrollToNextValidCategory(catIdx);
      else scrollIntoService(service.id);
    } else {
      const isAlreadySelected = selectedServices.find(s => s.id === service.id);
      if (isAlreadySelected) {
        const newSelection = selectedServices.filter(s => s.id !== service.id);
        setSelectedServices(newSelection);
        const newOpts = { ...selectedOptions };
        Object.keys(newOpts).forEach(key => {
          if (key.startsWith(`${service.id}-`)) delete newOpts[key];
        });
        setSelectedOptions(newOpts);
      } else {
        let newSelection = allowMultipleInCat 
          ? [...selectedServices, service]
          : [...selectedServices.filter(s => s.category !== service.category), service];
        
        if (!allowMultipleInCat) {
          const newOpts = { ...selectedOptions };
          const oldServiceInCat = selectedServices.find(s => s.category === service.category);
          if (oldServiceInCat) {
            Object.keys(newOpts).forEach(key => {
              if (key.startsWith(`${oldServiceInCat.id}-`)) delete newOpts[key];
            });
          }
          setSelectedOptions(newOpts);
        }

        setSelectedServices(newSelection);
        if (!allowMultipleInCat && !hasOptions) scrollToNextValidCategory(catIdx);
        else if (hasOptions) scrollIntoService(service.id);
      }
    }
  };

  const scrollIntoService = (serviceId) => {
    setTimeout(() => { if (serviceRefs.current[serviceId]) serviceRefs.current[serviceId].scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  };

  const handleOptionSelect = (serviceId, groupName, opt, catIdx) => {
    const key = `${serviceId}-${groupName}`;
    const newOptions = { ...selectedOptions, [key]: opt };
    setSelectedOptions(newOptions);
    const grouped = getGroupedOptions(serviceId);
    if (Object.keys(grouped).every(gn => newOptions[`${serviceId}-${gn}`])) scrollToNextValidCategory(catIdx);
  };

  const handleNextStep = () => {
    window.scrollTo(0,0);
    if (isAdminMode) {
      // 💡 管理者モード（ねじ込み）なら日時選択を飛ばして直接確認画面へリレー
      navigate(`/shop/${shopId}/confirm`, { 
        state: { 
          selectedServices, 
          selectedOptions, 
          totalSlotsNeeded,
          date: adminDate,    // 管理画面から受け取った日付を渡す
          time: adminTime,    // 管理画面から受け取った時間を渡す
          adminDate,          // ✅ 重要：ConfirmReservationへバトンを繋ぐ
          adminTime           // ✅ 重要：ConfirmReservationへバトンを繋ぐ
        } 
      });
    } else {
      // 通常モードなら日時選択画面へ
      navigate(`/shop/${shopId}/reserve/time`, { 
        state: { selectedServices, selectedOptions, totalSlotsNeeded } 
      });
    }
  };

  const getGroupedOptions = (serviceId) => {
    return options.filter(o => o.service_id === serviceId).reduce((acc, opt) => {
      if (!acc[opt.group_name]) acc[opt.group_name] = [];
      acc[opt.group_name].push(opt);
      return acc;
    }, {});
  };

  const allOptionsSelected = selectedServices.every(s => {
    const grouped = getGroupedOptions(s.id);
    return Object.keys(grouped).every(groupName => selectedOptions[`${s.id}-${groupName}`]);
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: '#666' }}>読み込み中...</div>;
  if (shop?.is_suspended) return <div style={{ padding: '60px 20px', textAlign: 'center' }}><h2>現在、予約受付を停止しています</h2></div>;
  if (!shop) return <div style={{ textAlign: 'center', padding: '50px' }}>店舗が見つかりません</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', color: '#333', paddingBottom: '160px' }}>
      
      <Link to="/" style={{ position: 'fixed', top: '15px', left: '15px', zIndex: 1100, background: 'rgba(255,255,255,0.9)', color: '#666', textDecoration: 'none', fontSize: '0.7rem', padding: '6px 10px', borderRadius: '15px', border: '1px solid #ddd' }}>← 戻る</Link>
      
      <div style={{ marginTop: '30px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>{shop.business_name}</h2>
        {isAdminMode && (
          <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px' }}>
            ⚠️ 管理者モード：{adminDate} {adminTime} の予約を作成中
          </div>
        )}
        {shop.description && <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>{shop.description}</p>}
        {shop.notes && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3' }}>
            <h5 style={{ margin: '0 0 5px 0', color: '#e11d48', fontSize: '0.8rem' }}>⚠️ 予約時の注意事項</h5>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#be123c' }}>{shop.notes}</p>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '1rem', borderLeft: '4px solid #2563eb', paddingLeft: '10px', marginBottom: '20px' }}>1. メメニューを選択</h3>
        {categories.map((cat, idx) => {
          const isDisabled = disabledCategoryNames.includes(cat.name);
          return (
            <div key={cat.id} ref={el => categoryRefs.current[cat.id] = el} style={{ marginBottom: '35px', opacity: isDisabled ? 0.3 : 1 }}>
              <h4 style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px', lineHeight: '1.4' }}>
                {cat.name.split('/').map((text, i) => (
                  <React.Fragment key={i}>
                    {text.trim()}
                    {i < cat.name.split('/').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                {services.filter(s => s.category === cat.name).map(service => {
                  const isSelected = selectedServices.find(s => s.id === service.id);
                  const groupedOpts = getGroupedOptions(service.id);
                  return (
                    <div key={service.id} ref={el => serviceRefs.current[service.id] = el} style={{ border: isSelected ? '2px solid #2563eb' : '1px solid #ddd', borderRadius: '12px', background: 'white' }}>
                      <button disabled={isDisabled} onClick={() => toggleService(service, idx)} style={{ width: '100%', padding: '15px', border: 'none', background: 'none', textAlign: 'left' }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '18px', height: '18px', border: '2px solid #2563eb', borderRadius: cat.allow_multiple_in_category ? '4px' : '50%', background: isSelected ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{isSelected && '✓'}</div>
                          <span>{service.name}</span>
                        </div>
                      </button>
                      {isSelected && !isDisabled && Object.keys(groupedOpts).length > 0 && (
                        <div style={{ padding: '0 15px 15px 15px', background: '#f8fafc' }}>
                          {Object.keys(groupedOpts).map(gn => (
                            <div key={gn} style={{ marginTop: '10px' }}>
                              <p style={{ fontSize: '0.7rem', color: '#475569' }}>└ {gn}</p>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {groupedOpts[gn].map(opt => (
                                  <button key={opt.id} onClick={() => handleOptionSelect(service.id, gn, opt, idx)} style={{ padding: '10px 5px', borderRadius: '8px', border: '1px solid', borderColor: selectedOptions[`${service.id}-${gn}`]?.id === opt.id ? '#2563eb' : '#cbd5e1', background: selectedOptions[`${service.id}-${gn}`]?.id === opt.id ? '#2563eb' : 'white', color: selectedOptions[`${service.id}-${gn}`]?.id === opt.id ? 'white' : '#475569', fontSize: '0.8rem' }}>{opt.option_name}</button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {selectedServices.length > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '15px 20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', zIndex: 1000, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '12px', maxHeight: '45px', overflowY: 'auto' }}>
              {selectedServices.map(s => (
                <span key={s.id} style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', border: '1px solid #dbeafe', fontWeight: 'bold' }}>
                  {s.name}
                </span>
              ))}
            </div>

            <button 
              disabled={!allOptionsSelected || !isRequiredMet || !isTotalTimeOk} 
              onClick={handleNextStep} 
              style={{ 
                width: '100%', maxWidth: '400px', padding: '16px', 
                background: (!allOptionsSelected || !isRequiredMet || !isTotalTimeOk) ? '#cbd5e1' : '#2563eb', 
                color: 'white', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '1rem', transition: '0.3s'
              }}
            >
              {!allOptionsSelected 
                ? 'オプションを選択してください' 
                : !isRequiredMet 
                  ? '必須メニューが未選択です' 
                  : !isTotalTimeOk
                    ? 'メニューを組み合わせて選択してください'
                    : isAdminMode 
                      ? `このメニューで予約をねじ込む (${totalSlotsNeeded * (shop.slot_interval_min || 15)}分)`
                      : `日時選択へ進む (${totalSlotsNeeded * (shop.slot_interval_min || 15)}分)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationForm;