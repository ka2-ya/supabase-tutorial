import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

/**
 * ブラウザ用Supabaseクライアントを作成
 *
 * 学習ポイント:
 * - 環境変数は型安全な`env`オブジェクトから取得
 * - アプリ起動時に環境変数が検証されるため、ランタイムエラーを防止
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
