import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
// 🆕 修正：通知専用の supabaseAnon もインポートに追加
import { supabase, supabaseAnon } from '../supabaseClient';
// 💡 重要：LINEログイン（LIFF）を操作するためのSDK
import liff from '@line/liff';

function ReservationForm() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 管理者画面からの「ねじ込み予約」データ
  const isAdminMode = location.state?.adminDate && location.state?.adminTime;
  const adminDate = location.state?.adminDate;
  const adminTime = location.state?.adminTime;

  // 💡 移植：LINE経由（URLに ?source=line があるか、またはLINEアプリ内か）を判定
  const queryParams = new URLSearchParams(location.search);
  const isLineSource = queryParams.get('source') === 'line';
  const isLineApp = /Line/i.test(navigator.userAgent);

  // 基本データState
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [options, setOptions] = useState([]);

  // --- 🆕 複数名予約用のState ---
  const [people, setPeople] = useState([]); // 確定した人のリスト: [{services, options, slots}]
  const [selectedServices, setSelectedServices] = useState([]); // 現在編集中の人のメニュー
  const [selectedOptions, setSelectedOptions] = useState({}); // 現在編集中の人の枝メニュー
  
  const [loading, setLoading] = useState(true);
  const [lineUser, setLineUser] = useState(null);

  const categoryRefs = useRef({});
  const serviceRefs = useRef({});

  useEffect(() => {
    fetchData();
    if (isLineSource || isLineApp) {
      initLiff();
    }
  }, [shopId]);

  const initLiff = async () => {
    try {
      await liff.init({ liffId: '2008606267-eJadD70Z' }); 
      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        setLineUser(profile);
      } else {
        liff.login(); 
      }
    } catch (err) {
      console.error('LIFF Initialization failed', err);
    }
  };

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

  // --- 🆕 複数名対応の計算ロジック ---

  // 今編集中の人の必要コマ数
  const currentPersonSlots = selectedServices.reduce((sum, s) => sum + s.slots, 0) + 
    Object.values(selectedOptions).reduce((sum, opt) => sum + (opt.additional_slots || 0), 0);

  // すでに確定した人たちの合計コマ数
  const pastPeopleSlots = people.reduce((sum, p) => sum + p.slots, 0);

  // 全員分の合計必要コマ数
  const totalSlotsNeeded = pastPeopleSlots + currentPersonSlots;

  // 必須条件チェック (現在編集中の一人分に対して)
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

  // --- 🆕 複数名予約用のアクション ---

  // 「追加でもう一人」を押した時
  const handleAddPerson = () => {
    if (people.length >= 3) return; // 最大4名まで
    
    setPeople([...people, { 
      services: selectedServices, 
      options: selectedOptions, 
      slots: currentPersonSlots 
    }]);

    setSelectedServices([]);
    setSelectedOptions({});

    // 🆕 画面を一番上までスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 追加した人を削除する場合
  const removePerson = (index) => {
    const newPeople = [...people];
    newPeople.splice(index, 1);
    setPeople(newPeople);
  };

  // UI制御：無効化されたカテゴリ
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
    const commonState = { 
      people: [...people, { services: selectedServices, options: selectedOptions, slots: currentPersonSlots }],
      totalSlotsNeeded,
      lineUser 
    };

    if (isAdminMode) {
      navigate(`/shop/${shopId}/confirm`, { 
        state: { ...commonState, date: adminDate, time: adminTime, adminDate, adminTime } 
      });
    } else {
      navigate(`/shop/${shopId}/reserve/time`, { state: commonState });
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

  // ✅ テーマカラーの取得（設定がない場合はデフォルトの青）
  const themeColor = shop?.theme_color || '#2563eb';

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', color: '#333', paddingBottom: '160px' }}>
      
      <Link to="/" style={{ position: 'fixed', top: '15px', left: '15px', zIndex: 1100, background: 'rgba(255,255,255,0.9)', color: '#666', textDecoration: 'none', fontSize: '0.7rem', padding: '6px 10px', borderRadius: '15px', border: '1px solid #ddd' }}>← 戻る</Link>
      
      <div style={{ marginTop: '30px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>{shop.business_name}</h2>
        
        {lineUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', padding: '10px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <img src={lineUser.pictureUrl} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="LINE" />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#166534' }}>{lineUser.displayName} さん、こんにちは！</span>
          </div>
        )}

        {people.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }}>現在の予約内容：</p>
            {people.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 0', borderBottom: idx < people.length - 1 ? '1px dashed #eee' : 'none' }}>
                <span style={{ color: themeColor, fontWeight: 'bold' }}>{idx + 1}人目：{p.services.map(s => s.name).join(', ')}</span>
                <button onClick={() => removePerson(idx)} style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        )}

        {isAdminMode && (
          <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px' }}>
            ⚠️ 管理者モード：{adminDate} {adminTime} の予約を作成中
          </div>
        )}
        
        {/* ✅ 【修正箇所】サブタイトル（description）の「/」による改行対応 */}
        {shop.description && (
          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
            {shop.description.split('/').map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < shop.description.split('/').length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )}
      </div>

      <div>
        {/* 🛡️ 1人目の時は「メニューを選択」、2人目以降は「n人目の〜」を表示 */}
        {/* ✅ ボーダーの色をテーマカラーに連動 */}
        <h3 style={{ fontSize: '1rem', borderLeft: `4px solid ${themeColor}`, paddingLeft: '10px', marginBottom: '20px' }}>
          {people.length === 0 ? "メニューを選択" : `${people.length + 1}人目のメニューを選択`}
        </h3>
        
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
                    <div key={service.id} ref={el => serviceRefs.current[service.id] = el} 
                         style={{ border: isSelected ? `2px solid ${themeColor}` : '1px solid #ddd', borderRadius: '12px', background: 'white' }}>
                      <button disabled={isDisabled} onClick={() => toggleService(service, idx)} style={{ width: '100%', padding: '15px', border: 'none', background: 'none', textAlign: 'left' }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* ✅ チェックボックスの背景色をテーマカラーに連動 */}
                          <div style={{ 
                            width: '18px', height: '18px', border: `2px solid ${themeColor}`, 
                            borderRadius: cat.allow_multiple_in_category ? '4px' : '50%', 
                            background: isSelected ? themeColor : 'transparent', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' 
                          }}>{isSelected && '✓'}</div>
                          <span>{service.name}</span>
                        </div>
                      </button>
                      {isSelected && !isDisabled && Object.keys(groupedOpts).length > 0 && (
                        <div style={{ padding: '0 15px 15px 15px', background: '#f8fafc' }}>
                          {Object.keys(groupedOpts).map(gn => (
                            <div key={gn} style={{ marginTop: '10px' }}>
                              <p style={{ fontSize: '0.7rem', color: '#475569' }}>└ {gn}</p>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {groupedOpts[gn].map(opt => {
                                  const isOptSelected = selectedOptions[`${service.id}-${gn}`]?.id === opt.id;
                                  return (
                                    <button 
                                      key={opt.id} 
                                      onClick={() => handleOptionSelect(service.id, gn, opt, idx)} 
                                      style={{ 
                                        padding: '10px 5px', borderRadius: '8px', border: '1px solid', 
                                        borderColor: isOptSelected ? themeColor : '#cbd5e1', 
                                        background: isOptSelected ? themeColor : 'white', 
                                        color: isOptSelected ? 'white' : '#475569', 
                                        fontSize: '0.8rem' 
                                      }}
                                    >
                                      {opt.option_name}
                                    </button>
                                  );
                                })}
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

        {/* 🆕 縦書きの「追加でもう一人」札 */}
        {/* ✅ 背景色をテーマカラーに連動 */}
        {selectedServices.length > 0 && people.length < 3 && allOptionsSelected && isRequiredMet && (
          <button 
            onClick={handleAddPerson}
            style={{ 
              position: 'fixed', bottom: '100px', right: '15px', zIndex: 999, 
              writingMode: 'vertical-rl',
              background: themeColor, color: 'white', padding: '15px 8px', 
              borderRadius: '8px 0 0 8px', border: 'none', fontWeight: 'bold', 
              fontSize: '0.85rem', boxShadow: '-4px 4px 12px rgba(0,0,0,0.1)', 
              cursor: 'pointer', animation: 'slideIn 0.3s ease-out'
            }}
          >
            追加でもう一人 ＋
          </button>
        )}

        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>

        {/* 下部固定アンダーバー */}
        {(selectedServices.length > 0 || people.length > 0) && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(10px)', padding: '15px 20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', zIndex: 1000, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
            <button 
              disabled={!allOptionsSelected || !isRequiredMet || !isTotalTimeOk} 
              onClick={handleNextStep} 
              style={{ 
                width: '100%', maxWidth: '400px', padding: '16px', 
                background: (!allOptionsSelected || !isRequiredMet || !isTotalTimeOk) ? '#cbd5e1' : themeColor, 
                color: 'white', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '1rem'
              }}
            >
              {!allOptionsSelected ? 'オプションを選択してください' 
               : !isRequiredMet ? '必須メニューが未選択です' 
               : isAdminMode ? `予約をねじ込む (${totalSlotsNeeded * (shop.slot_interval_min || 15)}分)`
               : `日時選択へ進む (${totalSlotsNeeded * (shop.slot_interval_min || 15)}分)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationForm;