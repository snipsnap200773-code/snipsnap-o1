import { createClient } from '@supabase/supabase-js'

// 環境変数（.envファイル）から読み込むように変更しました
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// もし環境変数が読み込めていない場合にエラーを出して教えてくれるガード
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabaseの接続情報が読み込めません。.envファイルとVercelの設定を確認してください。");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)