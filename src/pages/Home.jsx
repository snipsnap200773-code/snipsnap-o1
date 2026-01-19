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
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* 1. ヘッダー：左にロゴ、右に三本線を強制配置 */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-slate-800 shadow-sm">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex justify-between items-center w-full">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-slate-800 leading-none border-b-2 border-slate-800 pb-1">
              OnePlay <span className="text-[10px] font-bold text-slate-500">ワンプレ</span>
            </h1>
            <p className="text-[8px] text-slate-400 font-bold mt-1 tracking-tighter uppercase">Comprehensive Portal</p>
          </div>
          <button className="p-2 active:bg-slate-200 transition">
            <Menu size={32} className="text-slate-800" />
          </button>
        </div>
      </header>

      {/* メインコンテンツ（中央寄せ・白背景） */}
      <main className="max-w-[480px] mx-auto bg-white min-h-screen">
        
        {/* 2. ヒーローセクション：高さを抑えて「カテゴリ」をチラ見せさせる */}
        <section className="relative h-36 w-full overflow-hidden bg-slate-200">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={topic.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 p-2 text-center">
                <h2 className="text-white text-[10px] font-bold tracking-widest uppercase">
                  {topic.title}
                </h2>
              </div>
            </div>
          ))}
          {/* インジケーター（右上に配置） */}
          <div className="absolute top-2 right-2 flex gap-1">
            {topics.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentSlide ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </section>

        {/* 🔍 検索バー（よりカッチリした四角いデザイン） */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="bg-white rounded-sm border border-slate-300 flex items-center overflow-hidden">
            <div className="flex-1 flex items-center px-2 gap-2">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="店名・エリア・サービス" 
                className="w-full py-2 outline-none text-xs"
              />
            </div>
            <button className="bg-slate-800 text-white px-4 py-2 font-bold text-[10px] hover:bg-slate-700 transition">
              検索
            </button>
          </div>
        </div>

        {/* 3. カテゴリメニュー（チラ見えしている最重要エリア） */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4 border-l-4 border-slate-800 pl-3">
            <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-tighter italic">Category</h3>
            <span className="text-[9px] text-slate-400 font-bold ml-1">— カテゴリから探す</span>
          </div>
          
          {/* 2枚目・3枚目の画像を再現したタイル型ボタン */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'beauty', name: "理容・美容室", icon: <Scissors size={24} /> },
              { id: 'health', name: "整体・接骨院", icon: <Activity size={24} /> },
              { id: 'nail', name: "ネイル・アイ", icon: <Sparkles size={24} /> },
              { id: 'esthe', name: "エステ・癒やし", icon: <Heart size={24} /> }
            ].map((cat, i) => (
              <Link 
                key={i} 
                to={`/category/${cat.id}`}
                className="bg-white border border-slate-200 p-4 aspect-[4/3] flex flex-col justify-between hover:border-slate-800 hover:bg-slate-50 transition group shadow-sm active:shadow-inner"
              >
                <div className="text-slate-400 group-hover:text-slate-800 transition-colors">
                  {cat.icon}
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-700 text-[11px] leading-tight w-2/3">{cat.name}</span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-800" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 4. インフォメーション（ETCサイト風リスト） */}
        <section className="px-4 pb-12">
          <div className="flex items-center gap-2 mb-4 border-l-4 border-slate-400 pl-3">
            <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-tighter italic">News</h3>
          </div>
          <div className="bg-slate-50 border border-slate-200 divide-y divide-slate-200 rounded-sm">
            {[
              { date: "2026.01.19", tag: "新店", title: "町田駅前に新しい美容室が追加されました" },
              { date: "2026.01.15", tag: "重要", title: "システムメンテナンスのお知らせ（1/25）" }
            ].map((news, i) => (
              <div key={i} className="p-3 flex flex-col gap-1 hover:bg-white transition cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-mono">{news.date}</span>
                  <span className={`text-[8px] px-1 rounded font-bold border ${
                    news.tag === '重要' ? 'text-red-500 border-red-500' : 'text-blue-500 border-blue-500'
                  }`}>
                    {news.tag}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-600 leading-snug">{news.title}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Home;