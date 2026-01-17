/**
 * CORS (Cross-Origin Resource Sharing) ヘルパー
 *
 * Edge Functions で共通して使用するCORS設定を提供します。
 *
 * 使用方法:
 * ```typescript
 * import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
 *
 * Deno.serve(async (req) => {
 *   // CORS preflight リクエストの処理
 *   const corsResponse = handleCorsPreflightRequest(req)
 *   if (corsResponse) return corsResponse
 *
 *   const corsHeaders = getCorsHeaders(req)
 *   // ... ビジネスロジック
 *   return new Response(JSON.stringify(data), {
 *     headers: { ...corsHeaders, 'Content-Type': 'application/json' }
 *   })
 * })
 * ```
 *
 * 環境変数:
 * - ALLOWED_ORIGIN: 許可するオリジン（本番ドメイン）
 *   例: supabase secrets set ALLOWED_ORIGIN=https://your-domain.com
 */

/**
 * 許可されたオリジンを取得
 *
 * 1. localhost:3000 は常に許可（開発用）
 * 2. ALLOWED_ORIGIN 環境変数のドメインを許可（本番用）
 * 3. リクエストのOriginが許可リストにあればそれを返す
 * 4. なければ最初の許可オリジンを返す
 */
export const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    'http://localhost:3000',
    Deno.env.get('ALLOWED_ORIGIN'),
  ].filter(Boolean) as string[]

  return requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]
}

/**
 * CORSヘッダーを生成
 *
 * @param req - リクエストオブジェクト（Originヘッダーを取得するため）
 * @returns CORSヘッダーオブジェクト
 */
export const getCorsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get('Origin')
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(origin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }
}

/**
 * CORS preflight (OPTIONS) リクエストを処理
 *
 * @param req - リクエストオブジェクト
 * @returns OPTIONSリクエストの場合はResponseを返す、それ以外はnull
 *
 * 使用例:
 * ```typescript
 * const corsResponse = handleCorsPreflightRequest(req)
 * if (corsResponse) return corsResponse
 * ```
 */
export const handleCorsPreflightRequest = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  return null
}

/**
 * エラーレスポンスを生成
 *
 * @param req - リクエストオブジェクト（CORSヘッダー用）
 * @param message - エラーメッセージ
 * @param status - HTTPステータスコード（デフォルト: 400）
 */
export const createErrorResponse = (
  req: Request,
  message: string,
  status = 400
): Response => {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status,
    }
  )
}

/**
 * 成功レスポンスを生成
 *
 * @param req - リクエストオブジェクト（CORSヘッダー用）
 * @param data - レスポンスデータ
 * @param status - HTTPステータスコード（デフォルト: 200）
 */
export const createSuccessResponse = (
  req: Request,
  data: unknown,
  status = 200
): Response => {
  return new Response(
    JSON.stringify({ success: true, ...data as object }),
    {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status,
    }
  )
}
