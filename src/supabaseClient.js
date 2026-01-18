import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabaseの接続情報が読み込めません。");
}

/**
 * 🛡️ 1. データベース・ストレージ用クライアント
 * RLS（鉄壁のガード）に対応するため、リクエストごとに shopId をヘッダーに添えます。
 * 通常のデータ取得・保存にはこちらを使います。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      // URLから shopId を取得して身分証として添える
      'x-shop-id': window.location.pathname.split('/')[2] || '' 
    }
  }
});

/**
 * ✉️ 2. 通知・Edge Functions専用クライアント
 * Edge Functions を呼び出す際、CORSエラー（通信遮断）を回避するために使います。
 * RLSガード用のカスタムヘッダーを含まない「真っさらな」状態のクライアントです。
 */
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);