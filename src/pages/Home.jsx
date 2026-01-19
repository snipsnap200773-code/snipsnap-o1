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
      
      {/* 1. ヘッダー：背景は白、下線は太く、中身は最大幅制限で中央寄せ */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-slate-800 shadow-sm">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-slate-800 leading-none">
              OnePlay <span className="text-xs font-bold ml-1 text-slate-500">ワンプレ</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold mt-1">総合予約ポータルサイト</p>
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-md transition">
            <Menu size={24} className="text-slate-800" />
          </button>
        </div>
      </header>

      {/* コンテンツエリア：スマホ幅（480px）で中央に固定 */}
      <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-x">
        
        {/* 2. ヒーローセクション（自動スワイプ）：高さを抑えて中央配置 */}
        <section className="relative h-56 w-full overflow-hidden bg-slate-200">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={topic.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-slate-800/80 p-4 text-center">
                <h2 className="text-white text-sm font-bold tracking-widest">
                  {topic.title}
                </h2>
              </div>
            </div>
          ))}
          {/* スライドのドット（ETC風） */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            {topics.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === currentSlide ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </section>

        {/* 🔍 検索バーエリア */}
        <div className="bg-slate-50 px-4 py-6 border-b border-slate-200">
          <div className="bg-white p-1 rounded border-2 border-slate-300 flex items-center shadow-inner">
            <div className="flex-1 flex items-center px-3 gap-2">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="エリア・店名で探す" 
                className="w-full py-1.5 outline-none text-sm"
              />
            </div>
            <button className="bg-slate-800 text-white px-4 py-1.5 font-bold text-xs hover:bg-slate-700">
              検索
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="px-4 py-8">
          
          {/* 3. インフォメーション */}
          <section className="mb-10">
            <h3 className="text-sm font-bold bg-slate-100 px-3 py-1 border-l-4 border-slate-800 mb-4 italic">
              INFORMATION
            </h3>
            <div className="border border-slate-200 divide-y divide-slate-100 rounded-sm">
              {[
                { date: "2026.01.19", tag: "新店", title: "町田駅前に新しい美容室が追加されました" },
                { date: "2026.01.15", tag: "重要", title: "システムメンテナンスのお知らせ" }
              ].map((news, i) => (
                <div key={i} className="p-3 flex gap-3 hover:bg-slate-50 transition group cursor-pointer">
                  <div className="flex flex-col gap-1 min-w-[70px]">
                    <span className="text-[10px] text-slate-400 font-mono">{news.date}</span>
                    <span className={`text-[9px] w-8 text-center py-0.5 rounded font-bold border ${
                      news.tag === '重要' ? 'bg-red-600 text-white border-red-600' : 'bg-blue-600 text-white border-blue-600'
                    }`}>
                      {news.tag}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:underline leading-relaxed">
                    {news.title}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 4. カテゴリメニュー（ETC風アイコン配置） */}
          <section>
            <h3 className="text-sm font-bold bg-slate-100 px-3 py-1 border-l-4 border-slate-800 mb-4 italic">
              CATEGORY
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'beauty', name: "理容・美容室", icon: <Scissors size={24} /> },
                { id: 'health', name: "整体・接骨院", icon: <Activity size={24} /> },
                { id: 'nail', name: "ネイル・アイ", icon: <Sparkles size={24} /> },
                { id: 'esthe', name: "エステ・癒やし", icon: <Heart size={24} /> }
              ].map((cat, i) => (
                <Link 
                  key={i} 
                  to={`/category/${cat.id}`}
                  className="bg-white border border-slate-200 p-5 flex flex-col items-center gap-2 hover:border-slate-800 hover:shadow-sm transition group rounded-sm"
                >
                  <div className="text-slate-400 group-hover:text-slate-800 transition-colors">
                    {cat.icon}
                  </div>
                  <span className="font-bold text-slate-700 text-[11px]">{cat.name}</span>
                  <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-800" />
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Home;