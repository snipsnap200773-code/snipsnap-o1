import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabaseの接続情報が読み込めません。");
}

/**
 * 🛡️ 1. メインクライアント（データベース・ストレージ用）
 * RLSガード（x-shop-id）を添えて通信します。
 * 通常の「名簿保存」「予約取得」などはこちらの supabase を使います。
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
 * ✉️ 2. 通知専用クライアント（Edge Functions用）
 * 通知を送る際、CORSエラーを回避するために使います。
 * auth設定を追加し、メインクライアントと喧嘩しないように完全に隔離しました。
 */
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,   // 🆕 ログイン情報をブラウザに保存しない（喧嘩防止）
    autoRefreshToken: false, // 🆕 自動更新をオフにする
    detectSessionInUrl: false // 🆕 URLからのセッション検知をオフにする
  }
});