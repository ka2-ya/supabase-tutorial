/**
 * 環境変数の型安全なアクセスとバリデーション
 *
 * 学習ポイント:
 * - zodを使用したランタイムバリデーション
 * - 型推論による型安全性の確保
 * - アプリ起動時の早期エラー検出
 *
 * 本番環境では、環境変数の検証は非常に重要です。
 * 設定ミスによるランタイムエラーを防ぎ、デプロイ時に問題を早期発見できます。
 */
import { z } from 'zod';

// 環境変数のスキーマ定義
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL'
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'
  }),
  // Note: OPENAI_API_KEY is not included here for security reasons.
  // It should only be used in Edge Functions (server-side) via Supabase Secrets.
});

// 環境変数の型を推論
export type Env = z.infer<typeof envSchema>;

/**
 * 環境変数をパースして検証
 *
 * エラーが発生した場合:
 * - 開発環境: 詳細なエラーメッセージを表示
 * - 本番環境: アプリケーションが起動しない（これは意図的な動作）
 */
function parseEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 環境変数の検証エラー:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('環境変数の設定を確認してください。.env.localファイルを作成し、必要な値を設定してください。');
    }
    throw error;
  }
}

// 環境変数をエクスポート（アプリ起動時に検証される）
export const env = parseEnv();
