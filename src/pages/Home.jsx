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
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-20">
      
      {/* 1. ヘッダー（ロゴ + アンダーバー + 三本線） */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-slate-800 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-slate-800 leading-none">
              OnePlay <span className="text-sm font-bold ml-1 text-slate-500">ワンプレ</span>
            </h1>
            <div className="h-1 w-full bg-slate-800 mt-1"></div>
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-md transition">
            <Menu size={28} className="text-slate-800" />
          </button>
        </div>
      </header>

      {/* 2. ヒーローセクション（自動スワイプ：サイズ控えめ） */}
      <section className="relative h-48 md:h-64 w-full overflow-hidden bg-slate-100">
        {topics.map((topic, index) => (
          <div
            key={topic.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={topic.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <h2 className="text-white text-lg md:text-2xl font-bold bg-slate-800/80 px-6 py-2 tracking-widest">
                {topic.title}
              </h2>
            </div>
          </div>
        ))}
      </section>

      {/* 🔍 検索エリア（バナー下） */}
      <div className="bg-slate-100 py-6 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white p-1 rounded border-2 border-slate-300 flex items-center shadow-inner">
            <div className="flex-1 flex items-center px-3 gap-2">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="キーワードで探す" 
                className="w-full py-2 outline-none text-sm"
              />
            </div>
            <button className="bg-slate-800 text-white px-6 py-2 font-bold text-sm hover:bg-slate-700">
              検索
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        
        {/* 3. インフォメーション（ETCスタイル） */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold">重要なお知らせ</h3>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div className="border border-slate-200 divide-y divide-slate-100 rounded-sm">
            {[
              { date: "2026.01.19", tag: "新店", title: "町田駅前に新しい美容室が追加されました" },
              { date: "2026.01.15", tag: "重要", title: "システムメンテナンスのお知らせ（1月25日 02:00〜）" }
            ].map((news, i) => (
              <div key={i} className="p-4 flex flex-col md:flex-row gap-2 md:gap-4 hover:bg-slate-50 transition group cursor-pointer">
                <span className="text-xs text-slate-500 font-mono w-24">{news.date}</span>
                <span className={`text-[10px] w-12 text-center py-0.5 rounded font-bold border ${
                  news.tag === '重要' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {news.tag}
                </span>
                <span className="text-sm font-bold text-slate-700 group-hover:underline">{news.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. カテゴリタイル（ETCクイックメニュー風） */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-bold">サービスカテゴリから探す</h3>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'beauty', name: "理容・美容室", icon: <Scissors size={28} /> },
              { id: 'health', name: "整体・接骨院", icon: <Activity size={28} /> },
              { id: 'nail', name: "ネイル・アイ", icon: <Sparkles size={28} /> },
              { id: 'esthe', name: "エステ・癒やし", icon: <Heart size={28} /> }
            ].map((cat, i) => (
              <Link 
                key={i} 
                to={`/category/${cat.id}`}
                className="bg-white border-2 border-slate-200 p-6 flex flex-col items-center gap-3 hover:border-slate-800 hover:shadow-md transition group"
              >
                <div className="text-slate-400 group-hover:text-slate-800 transition-colors">
                  {cat.icon}
                </div>
                <span className="font-bold text-slate-700 text-sm">{cat.name}</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-800" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;