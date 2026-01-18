import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabaseの接続情報が読み込めません。");
}

/**
 * 🛡️ 1. データベース・ストレージ用クライアント
 * RLSガード（x-shop-id）を添えて通信します。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-shop-id': window.location.pathname.split('/')[2] || '' 
    }
  }
});

/**
 * ✉️ 2. 通知・Edge Functions専用クライアント
 * CORSエラーを防ぐため、カスタムヘッダーを一切含みません。
 * また、重複警告を防ぐために認証情報の保持（persistSession）をオフにします。
 */
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // 🆕 重複警告を消すための設定
  }
});