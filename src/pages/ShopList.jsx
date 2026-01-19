import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // パスは適宜調整してください
import { MapPin, Star, ChevronLeft } from 'lucide-react';

const ShopList = () => {
  const { categoryId } = useParams(); // URLからカテゴリ名を取得 (例: beauty)
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // カテゴリ名の日本語変換
  const categoryNames = {
    beauty: "理容・美容室",
    health: "整体・接骨院",
    nail: "ネイル・アイ",
    esthe: "エステ・癒やし"
  };

  useEffect(() => {
    fetchShops();
  }, [categoryId]);

  const fetchShops = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('category', categoryId); // カテゴリで絞り込み

    if (error) {
      console.error('Error fetching shops:', error);
    } else {
      setShops(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold">{categoryNames[categoryId] || "店舗一覧"}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-400">読み込み中...</div>
        ) : shops.length > 0 ? (
          <div className="grid gap-6">
            {shops.map((shop) => (
              <Link 
                key={shop.id} 
                to={`/shop/${shop.id}`} // ここでこれまでの個別予約画面へ飛ぶ
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition"
              >
                {/* 店舗写真 */}
                <div className="w-full md:w-48 h-48 bg-slate-200">
                  <img 
                    src={shop.avatar_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400"} 
                    alt={shop.username} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* 店舗情報 */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-bold text-slate-800">{shop.username}</h2>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={16} fill="currentColor" />
                        <span className="text-sm font-bold text-slate-600">4.8</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                      {shop.introduction || "一人一人に合わせた丁寧な施術を心がけています。プライベートな空間でリラックスした時間をお過ごしください。"}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin size={14} />
                      <span>東京都町田市...</span>
                    </div>
                    <span className="bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-bold">
                      空き状況を確認
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            このカテゴリに登録されている店舗はまだありません。
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopList;