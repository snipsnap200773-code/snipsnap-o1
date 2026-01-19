import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Activity, Sparkles, Heart, ChevronRight, Search, Menu } from 'lucide-react';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const topics = [
    { 
      id: 1, 
      url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80", 
      title: "一人ひとりに、最高の体験を。",
    },
    { 
      id: 2, 
      url: "https://images.unsplash.com/photo-1512690199101-83749a7448d4?auto=format&fit=crop&w=1200&q=80", 
      title: "プロの技術を、もっと身近に。",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % topics.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* 1. ヘッダー：両端配置とアンダーバー */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-slate-800 shadow-sm">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex justify-between items-end">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-slate-800 leading-none">
              OnePlay <span className="text-[10px] font-bold ml-1 text-slate-500">ワンプレ</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-bold mt-1 tracking-tighter">総合予約ポータルサイト</p>
          </div>
          <button className="p-1 hover:bg-slate-100 transition">
            <Menu size={28} className="text-slate-800" />
          </button>
        </div>
      </header>

      {/* メインコンテナ（480px制限で中央寄せ） */}
      <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-sm">
        
        {/* 2. ヒーローセクション：高さを極限まで抑えて「次」を見せる */}
        <section className="relative h-40 w-full overflow-hidden bg-slate-200 border-b border-slate-100">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={topic.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-slate-800/70 p-2 text-center">
                <h2 className="text-white text-[11px] font-bold tracking-widest leading-none">
                  {topic.title}
                </h2>
              </div>
            </div>
          ))}
          {/* インジケーター */}
          <div className="absolute top-2 right-2 flex gap-1">
            {topics.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentSlide ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </section>

        {/* 🔍 検索エリア（コンパクト） */}
        <div className="bg-slate-50 px-4 py-4 border-b border-slate-200">
          <div className="bg-white p-0.5 rounded border border-slate-300 flex items-center shadow-inner">
            <div className="flex-1 flex items-center px-2 gap-2">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="店名、エリア、サービスで検索" 
                className="w-full py-1.5 outline-none text-[11px]"
              />
            </div>
            <button className="bg-slate-800 text-white px-4 py-1.5 font-bold text-[10px] hover:bg-slate-700 transition">
              検索
            </button>
          </div>
        </div>

        {/* 3. カテゴリメニュー（チラ見せのためにここに配置） */}
        <div className="px-4 py-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-4 bg-slate-800"></span>
            <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Category</h3>
            <span className="text-[9px] text-slate-400 font-bold ml-1">カテゴリから探す</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'beauty', name: "理容・美容室", icon: <Scissors size={22} /> },
              { id: 'health', name: "整体・接骨院", icon: <Activity size={22} /> },
              { id: 'nail', name: "ネイル・アイ", icon: <Sparkles size={22} /> },
              { id: 'esthe', name: "エステ・癒やし", icon: <Heart size={22} /> }
            ].map((cat, i) => (
              <Link 
                key={i} 
                to={`/category/${cat.id}`}
                className="bg-white border border-slate-200 p-4 flex items-center justify-between hover:border-slate-800 hover:bg-slate-50 transition group rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                <div className="flex flex-col gap-2">
                  <div className="text-slate-400 group-hover:text-slate-800 transition-colors">
                    {cat.icon}
                  </div>
                  <span className="font-bold text-slate-700 text-[10px] leading-none">{cat.name}</span>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-800" />
              </Link>
            ))}
          </div>
        </div>

        {/* 4. インフォメーション */}
        <section className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-4 bg-slate-400"></span>
            <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-wider">News</h3>
          </div>
          <div className="divide-y divide-slate-100 bg-slate-50 rounded-sm border border-slate-100">
            {[
              { date: "2026.01.19", tag: "新店", title: "町田駅前に新しい美容室が追加されました" },
              { date: "2026.01.15", tag: "重要", title: "システムメンテナンスのお知らせ" }
            ].map((news, i) => (
              <div key={i} className="p-3 flex gap-3 items-start hover:bg-white transition cursor-pointer">
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">{news.date}</span>
                <span className="text-[11px] font-bold text-slate-600 leading-snug">{news.title}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;