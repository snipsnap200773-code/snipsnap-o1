import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ReservationForm() {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [options, setOptions] = useState([]);
  
  const [selectedServices, setSelectedServices] = useState([]); 
  const [selectedOptions, setSelectedOptions] = useState({}); 
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  const categoryRefs = useRef({});
  const serviceRefs = useRef({});

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
    setLoading(true);
    // profilesから店舗情報を取得
    const shopRes = await supabase.from('profiles').select('*').eq('id', shopId).single();
    
    if (shopRes.data) {
      setShop(shopRes.data);

      // 公開中（is_suspended が false）の場合のみ、メニュー情報を取得する
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

  // 1. 読み込み中の表示
  if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontSize: '1rem', color: '#666' }}>読み込み中...</div>;

  // 2. アクセス遮断（中止中）の表示
  if (shop?.is_suspended) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ color: '#1e293b', fontSize: '1.4rem', marginBottom: '15px' }}>現在、予約受付を停止しています</h2>
        <p style={{ color: '#64748b', lineHeight: '1.8', fontSize: '0.95rem', marginBottom: '30px' }}>
          申し訳ございませんが、こちらのページは現在公開されておりません。<br/>
          詳細については、直接店舗へお問い合わせください。
        </p>

        {shop.phone && (
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px', fontWeight: 'bold' }}>お急ぎの方はお電話ください</p>
            <a 
              href={`tel:${shop.phone}`} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                background: '#10b981', color: '#fff', textDecoration: 'none',
                padding: '15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '1.2rem'
              }}
            >
              <span>📞</span> {shop.phone}
            </a>
          </div>
        )}

        <Link to="/" style={{ display: 'inline-block', color: '#64748b', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← 総合ポータルへ戻る
        </Link>
      </div>
    );
  }

  // --- 通常の予約フォームロジック ---

  const disabledCategoryNames = selectedServices.reduce((acc, s) => {
    const cat = categories.find(c => c.name === s.category);
    if (cat?.disable_categories) return [...acc, ...cat.disable_categories.split(',').map(n => n.trim())];
    return acc;
  }, []);

  const scrollToNextValidCategory = (currentCatIdx) => {
    const nextValidCat = categories.slice(currentCatIdx + 1).find(cat => 
      !disabledCategoryNames.includes(cat.name)
    );
    if (nextValidCat && categoryRefs.current[nextValidCat.id]) {
      setTimeout(() => {
        categoryRefs.current[nextValidCat.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  };

  if (!shop) return <div style={{ textAlign: 'center', padding: '50px' }}>店舗が見つかりません</div>;

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
        setSelectedServices(selectedServices.filter(s => s.id !== service.id));
      } else {
        let newSelection = allowMultipleInCat 
          ? [...selectedServices, service]
          : [...selectedServices.filter(s => s.category !== service.category), service];
        setSelectedServices(newSelection);
        if (!allowMultipleInCat && !hasOptions) scrollToNextValidCategory(catIdx);
        else if (hasOptions) scrollIntoService(service.id);
      }
    }
  };

  const scrollIntoService = (serviceId) => {
    setTimeout(() => {
      if (serviceRefs.current[serviceId]) {
        serviceRefs.current[serviceId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleOptionSelect = (serviceId, groupName, opt, catIdx) => {
    const key = `${serviceId}-${groupName}`;
    const newOptions = { ...selectedOptions, [key]: opt };
    setSelectedOptions(newOptions);
    const grouped = getGroupedOptions(serviceId);
    const isComplete = Object.keys(grouped).every(gn => newOptions[`${serviceId}-${gn}`]);
    if (isComplete) scrollToNextValidCategory(catIdx);
  };

  const skipCategory = (catIdx) => {
    const catName = categories[catIdx].name;
    setSelectedServices(prev => prev.filter(s => s.category !== catName));
    scrollToNextValidCategory(catIdx);
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

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', color: '#333', paddingBottom: '160px' }}>
      
      <Link to="/" style={{ position: 'fixed', top: '15px', left: '15px', zIndex: 1100, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(5px)', color: '#666', textDecoration: 'none', fontSize: '0.7rem', padding: '6px 10px', borderRadius: '15px', border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}>
        ← 戻る
      </Link>
      
      {/* --- 追加：店舗ヘッダーセクション --- */}
      <div style={{ marginTop: '30px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b' }}>{shop.business_name}</h2>
        
        {shop.description && (
          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>
            {shop.description}
          </p>
        )}

        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shop.address && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <span>📍</span> <span>{shop.address}</span>
            </div>
          )}
          {shop.phone && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <span>📞</span> <a href={`tel:${shop.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>{shop.phone}</a>
            </div>
          )}
        </div>

        {shop.notes && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3' }}>
            <h5 style={{ margin: '0 0 5px 0', color: '#e11d48', fontSize: '0.8rem', fontWeight: 'bold' }}>⚠️ 予約に関する注意事項</h5>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#be123c', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{shop.notes}</p>
          </div>
        )}
      </div>

      {step === 1 ? (
        <div>
          <h3 style={{ fontSize: '1rem', borderLeft: '4px solid #2563eb', paddingLeft: '10px', marginBottom: '20px' }}>メニューを選択</h3>
          
          {categories.map((cat, idx) => {
            const isDisabled = disabledCategoryNames.includes(cat.name);
            return (
              <div key={cat.id} ref={el => categoryRefs.current[cat.id] = el} style={{ marginBottom: '35px', opacity: isDisabled ? 0.3 : 1, transition: '0.3s' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{background: isDisabled ? '#cbd5e1' : '#2563eb', color: '#fff', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 'bold'}}>{idx + 1}</span>
                  {cat.name} {isDisabled && <span style={{fontSize: '0.65rem', color: '#ef4444'}}>(併用不可)</span>}
                </h4>
                
                <div style={{ display: 'grid', gap: '10px' }}>
                  {services.filter(s => s.category === cat.name).map(service => {
                    const isSelected = selectedServices.find(s => s.id === service.id);
                    const groupedOpts = getGroupedOptions(service.id);
                    return (
                      <div key={service.id} ref={el => serviceRefs.current[service.id] = el} style={{ border: isSelected ? '2px solid #2563eb' : '1px solid #ddd', borderRadius: '12px', background: isDisabled ? '#f8fafc' : 'white', overflow: 'hidden' }}>
                        <button 
                          disabled={isDisabled}
                          onClick={() => toggleService(service, idx)} 
                          style={{ width: '100%', padding: '15px', border: 'none', background: 'none', textAlign: 'left', cursor: isDisabled ? 'default' : 'pointer' }}
                        >
                          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', color: isDisabled ? '#94a3b8' : '#333' }}>
                            <div style={{ width: '18px', height: '18px', border: '2px solid', borderColor: isDisabled ? '#cbd5e1' : '#2563eb', borderRadius: cat.allow_multiple_in_category ? '4px' : '50%', background: isSelected ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>{isSelected && '✓'}</div>
                            <span style={{fontSize: '0.95rem'}}>{service.name}</span>
                          </div>
                        </button>
                        {isSelected && !isDisabled && Object.keys(groupedOpts).length > 0 && (
                          <div style={{ padding: '0 15px 15px 15px', background: '#f8fafc' }}>
                            {Object.keys(groupedOpts).map(gn => (
                              <div key={gn} style={{ marginTop: '10px' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>└ {gn}</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  {groupedOpts[gn].map(opt => (
                                    <button key={opt.id} onClick={() => handleOptionSelect(service.id, gn, opt, idx)} style={{ padding: '10px 5px', borderRadius: '8px', border: '1px solid', borderColor: selectedOptions[`${service.id}-${gn}`]?.id === opt.id ? '#2563eb' : '#cbd5e1', background: selectedOptions[`${service.id}-${gn}`]?.id === opt.id ? '#2563eb' : 'white', color: selectedOptions[`${service.id}-${gn}`]?.id === opt.id ? 'white' : '#475569', fontSize: '0.8rem', fontWeight: 'bold' }}>{opt.option_name}</button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!isDisabled && (
                    <button onClick={() => skipCategory(idx)} style={{ padding: '10px', background: 'none', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}>{cat.name}をスキップ</button>
                  )}
                </div>
              </div>
            );
          })}

          {selectedServices.length > 0 && (
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', padding: '5px 10px 10px 10px', borderTop: '1px solid #e2e8f0', textAlign: 'center', zIndex: 1000 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', marginBottom: '8px', maxHeight: '60px', overflowY: 'auto' }}>
                {selectedServices.map(s => (
                  <span key={s.id} style={{ fontSize: '0.65rem', background: '#eef2ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', border: '1px solid #dbeafe' }}>
                    {s.name}
                  </span>
                ))}
              </div>
              <button
                disabled={!allOptionsSelected}
                onClick={() => { window.scrollTo(0,0); setStep(2); }}
                style={{ width: '100%', maxWidth: '400px', padding: '10px', background: allOptionsSelected ? '#2563eb' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.95rem' }}
              >
                {allOptionsSelected ? '日時選択へ進む' : 'オプションを選択'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ステップ2：日時選択 */
        <div style={{marginTop: '20px'}}>
          <button onClick={() => setStep(1)} style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '8px 15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>← 選び直す</button>
          <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#64748b' }}>最終確認</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {selectedServices.map(s => (
                <span key={s.id} style={{ fontSize: '0.8rem', fontWeight: 'bold', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px' }}>{s.name}</span>
              ))}
            </div>
          </div>
          <h3 style={{ fontSize: '1.1rem', borderLeft: '4px solid #2563eb', paddingLeft: '10px', marginBottom: '15px' }}>日時を選択</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'].map(time => (
              <button key={time} style={{ padding: '15px 5px', border: '1px solid #2563eb', borderRadius: '12px', background: 'white', color: '#2563eb', fontWeight: 'bold', fontSize: '0.9rem' }}>{time}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationForm;