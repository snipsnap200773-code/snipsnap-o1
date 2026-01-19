import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 👈 カテゴリ移動に必要
import { Scissors, Activity, Sparkles, Heart, ChevronRight, Search } from 'lucide-react';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 1. スワイプ用画像データ
  const topics = [
    { 
      id: 1, 
      url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80", 
      title: "一人ひとりに、最高の体験を。",
      subtitle: "ワンプレで見つける、あなただけの専属パートナー"
    },
    { 
      id: 2, 
      url: "https://images.unsplash.com/photo-1512690199101-83749a7448d4?auto=format&fit=crop&w=1200&q=80", 
      title: "プロの技術を、もっと身近に。",
      subtitle: "少人数サロンだから叶う、深いおもてなし"
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
      
      {/* 1. ヒーローセクション（自動スワイプ） */}
      <section className="relative h-72 md:h-[450px] w-full overflow-hidden shadow-lg">
        {topics.map((topic, index) => (
          <div
            key={topic.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={topic.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
              <h2 className="text-white text-3xl md:text-5xl font-bold tracking-widest drop-shadow-lg mb-4">
                {topic.title}
              </h2>
              <p className="text-white/90 text-sm md:text-lg font-light tracking-wider">
                {topic.subtitle}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* 🔍 検索バー */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white p-2 rounded-full shadow-xl flex items-center border border-slate-200">
          <div className="flex-1 flex items-center px-4 gap-2">
            <Search size={20} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="エリア、店名、サービスで検索..." 
              className="w-full py-2 outline-none text-sm"
            />
          </div>
          <button className="bg-slate-800 text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-slate-700 transition">
            検索
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        
        {/* 2. インフォメーション */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center">
            <span className="text-sm font-bold tracking-wider">インフォメーション</span>
            <ChevronRight size={16} />
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { date: "2026.01.19", tag: "新店", title: "町田駅徒歩5分に整体サロン『ほぐし処』がオープン！" },
              { date: "2026.01.15", tag: "重要", title: "【ワンプレ】システムメンテナンスによる一部サービス停止のお知らせ" }
            ].map((news, i) => (
              <div key={i} className="p-4 flex flex-col md:flex-row gap-2 md:gap-6 hover:bg-slate-50 transition cursor-pointer">
                <div className="flex gap-3 items-center min-w-[150px]">
                  <span className="text-xs text-slate-400 font-mono">{news.date}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    news.tag === '重要' ? 'border-red-200 bg-red-50 text-red-500' : 'border-blue-200 bg-blue-50 text-blue-500'
                  }`}>
                    {news.tag}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-700">{news.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. カテゴリタイル（Linkタグに修正済み） */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold flex items-center gap-3">
              <span className="w-2 h-8 bg-slate-800 rounded-full"></span>
              カテゴリから探す
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 'beauty', name: "理容・美容室", icon: <Scissors size={32} />, color: "border-blue-100 hover:bg-blue-50 text-blue-600" },
              { id: 'health', name: "整体・接骨院", icon: <Activity size={32} />, color: "border-green-100 hover:bg-green-50 text-green-600" },
              { id: 'nail', name: "ネイル・アイ", icon: <Sparkles size={32} />, color: "border-pink-100 hover:bg-pink-50 text-pink-600" },
              { id: 'esthe', name: "エステ・癒やし", icon: <Heart size={32} />, color: "border-purple-100 hover:bg-purple-50 text-purple-600" }
            ].map((cat, i) => (
              <Link 
                key={i} 
                to={`/category/${cat.id}`}
                className={`bg-white border-2 ${cat.color} p-8 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-2 group`}
              >
                <div className="transform group-hover:scale-110 transition-transform duration-300">
                  {cat.icon}
                </div>
                <span className="font-extrabold text-slate-700 tracking-tighter">{cat.name}</span>
                <div className="w-8 h-1 bg-slate-200 group-hover:w-12 group-hover:bg-current transition-all"></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;