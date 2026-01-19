import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Activity, Sparkles, Heart, ChevronRight, Search, Menu } from 'lucide-react';

const OnePlayPortal = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const topics = [
    { id: 1, url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80", title: "一人ひとりに、最高の体験を。" },
    { id: 2, url: "https://images.unsplash.com/photo-1512690199101-83749a7448d4?auto=format&fit=crop&w=1200&q=80", title: "プロの技術を、もっと身近に。" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % topics.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-white font-sans text-slate-800 pb-10">
      
      {/* 1. ヘッダー：ロゴ（左）と三本線（右）を完璧に端へ配置 */}
      <header className="w-full bg-white border-b-4 border-slate-800 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter text-slate-800 leading-none">
            OnePlay <span className="text-[10px] font-bold text-slate-500 uppercase">ワンプレ</span>
          </h1>
          <div className="h-1 w-full bg-slate-800 mt-1"></div>
        </div>
        <button className="p-1 active:bg-slate-100 rounded transition-colors">
          <Menu size={32} className="text-slate-800" />
        </button>
      </header>

      {/* 2. ヒーローバナー：高さを抑えて「カテゴリ」を最初から見せる設計 */}
      <section className="relative h-32 w-full overflow-hidden bg-slate-200">
        {topics.map((topic, index) => (
          <div
            key={topic.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={topic.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 p-2 text-center">
              <h2 className="text-white text-[10px] font-bold tracking-widest drop-shadow-sm">
                {topic.title}
              </h2>
            </div>
          </div>
        ))}
        <div className="absolute top-2 right-2 flex gap-1">
          {topics.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentSlide ? 'bg-white shadow' : 'bg-white/30'}`} />
          ))}
        </div>
      </section>

      {/* 🔍 検索バー：カッチリした実用的なデザイン */}
      <div className="w-full px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="bg-white rounded-none border border-slate-300 flex items-center shadow-sm">
          <div className="flex-1 flex items-center px-2 gap-2">
            <Search size={14} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="店名、エリア、サービス" 
              className="w-full py-1.5 outline-none text-xs font-medium"
            />
          </div>
          <button className="bg-slate-800 text-white px-4 py-2 font-bold text-[10px] active:bg-slate-700">
            検索
          </button>
        </div>
      </div>

      {/* 3. カテゴリメニュー：2枚目画像を再現したタイル形式 */}
      <div className="w-full px-4 py-6 bg-white">
        <div className="flex items-center gap-2 mb-4 border-l-4 border-slate-800 pl-3">
          <h3 className="text-[13px] font-black text-slate-800 tracking-wider uppercase italic">Category</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'beauty', name: "理容・美容室", icon: <Scissors size={28} /> },
            { id: 'health', name: "整体・接骨院", icon: <Activity size={28} /> },
            { id: 'nail', name: "ネイル・アイ", icon: <Sparkles size={28} /> },
            { id: 'esthe', name: "エステ・癒やし", icon: <Heart size={28} /> }
          ].map((cat, i) => (
            <Link 
              key={i} 
              to={`/category/${cat.id}`}
              className="bg-white border border-slate-200 p-4 aspect-square flex flex-col items-center justify-center gap-3 hover:border-slate-800 active:bg-slate-50 transition group shadow-sm"
            >
              <div className="text-slate-400 group-hover:text-slate-800 transform group-hover:scale-110 transition-all">
                {cat.icon}
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700 text-[11px] tracking-tighter leading-none">{cat.name}</span>
                <ChevronRight size={12} className="text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. インフォメーション：ETC風の整列されたお知らせ */}
      <section className="w-full px-4 pt-2">
        <div className="flex items-center gap-2 mb-4 border-l-4 border-slate-300 pl-3">
          <h3 className="text-[13px] font-black text-slate-300 tracking-wider uppercase italic">News List</h3>
        </div>
        <div className="bg-slate-50 border border-slate-200 divide-y divide-slate-100">
          {[
            { date: "2026.01.19", tag: "新店", title: "町田駅前に新しい美容室が追加されました" },
            { date: "2026.01.15", tag: "重要", title: "システムメンテナンスのお知らせ（1/25）" }
          ].map((news, i) => (
            <div key={i} className="p-3 flex flex-col gap-1 hover:bg-white transition cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{news.date}</span>
                <span className={`text-[8px] px-1 rounded font-bold border ${
                  news.tag === '重要' ? 'text-red-500 border-red-200' : 'text-blue-500 border-blue-200'
                }`}>
                  {news.tag}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-600 leading-snug">{news.title}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default OnePlayPortal;