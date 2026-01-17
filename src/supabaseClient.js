import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabaseの接続情報が読み込めません。");
}

// 🆕 RLS（鉄壁のガード）に対応するための設定を追加
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      // 🛡️ リクエストのたびに、URLに含まれるshopIdなどを自動でヘッダーに添える
      'x-shop-id': window.location.pathname.split('/')[2] || '' 
    }
  }
});