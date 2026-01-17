// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Supabase Edge Function - Data Processing
// テキストデータの処理を行うサンプル関数

// CORS対応のヘッダー
// 本番環境では ALLOWED_ORIGIN 環境変数を設定してください
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    'http://localhost:3000',
    Deno.env.get('ALLOWED_ORIGIN'),
  ].filter(Boolean) as string[]

  return requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]
}

const getCorsHeaders = (requestOrigin: string | null) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
})

// テキスト処理のユーティリティ関数
function processText(text: string) {
  return {
    original: text,
    length: text.length,
    wordCount: text.trim().split(/\s+/).filter(word => word.length > 0).length,
    uppercase: text.toUpperCase(),
    lowercase: text.toLowerCase(),
    reversed: text.split('').reverse().join(''),
    firstChar: text.charAt(0),
    lastChar: text.charAt(text.length - 1),
  }
}

// メインのハンドラー関数
Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)

  // OPTIONSリクエスト（CORS preflight）の処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // リクエストボディからパラメータを取得
    const { text } = await req.json()

    // バリデーション
    if (!text || typeof text !== 'string') {
      throw new Error('text パラメータが必要です（文字列型）')
    }

    if (text.length > 10000) {
      throw new Error('テキストは10,000文字以内にしてください')
    }

    // テキスト処理を実行
    const result = processText(text)

    // レスポンスデータ
    const data = {
      success: true,
      timestamp: new Date().toISOString(),
      input: {
        received: true,
        preview: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      },
      processing: result,
      metadata: {
        function: 'data-processing',
        executionTime: 'Edge環境で高速実行',
      },
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    // エラーハンドリング
    console.error('Error in data-processing function:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
