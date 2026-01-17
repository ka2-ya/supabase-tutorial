// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// 共通CORSヘルパーをインポート
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
} from '../_shared/cors.ts'

/**
 * Edge Function: semantic-search
 *
 * 学習ポイント:
 * - クエリの埋め込み生成
 * - ベクトル類似度検索
 * - パフォーマンス最適化
 * - 結果のランキングとフィルタリング
 *
 * エンドポイント: /functions/v1/semantic-search
 * メソッド: POST
 * 認証: 必須（JWT）
 *
 * リクエストボディ:
 * {
 *   "query": "検索クエリ",
 *   "matchThreshold": 0.5,  // オプション（デフォルト: 0.5）
 *   "matchCount": 10         // オプション（デフォルト: 10）
 * }
 *
 * レスポンス:
 * {
 *   "success": true,
 *   "results": [
 *     {
 *       "id": 123,
 *       "title": "ドキュメントタイトル",
 *       "content": "ドキュメント本文",
 *       "similarity": 0.85,
 *       "created_at": "2026-01-04T10:00:00Z"
 *     }
 *   ],
 *   "metadata": {
 *     "queryTokens": 50,
 *     "resultCount": 5,
 *     "executionTime": "123ms"
 *   }
 * }
 */

interface RequestBody {
  query: string
  matchThreshold?: number
  matchCount?: number
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

interface SearchResult {
  id: number
  title: string
  content: string
  similarity: number
  created_at: string
}

Deno.serve(async (req) => {
  // CORS preflight リクエストの処理
  const corsResponse = handleCorsPreflightRequest(req)
  if (corsResponse) return corsResponse

  const corsHeaders = getCorsHeaders(req)

  const startTime = performance.now()

  try {
    // 環境変数の取得
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase configuration is missing')
    }

    // Supabaseクライアントの作成
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // JWT認証
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    // リクエストボディの取得とバリデーション
    const {
      query,
      matchThreshold = 0.5,
      matchCount = 10,
    }: RequestBody = await req.json()

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query is required and must be a non-empty string')
    }

    if (query.length > 500) {
      throw new Error('Query must be less than 500 characters')
    }

    if (matchThreshold < 0 || matchThreshold > 1) {
      throw new Error('Match threshold must be between 0 and 1')
    }

    if (matchCount < 1 || matchCount > 50) {
      throw new Error('Match count must be between 1 and 50')
    }

    console.log(`[semantic-search] Processing query for user: ${user.id}`)
    console.log(`[semantic-search] Query: ${query}`)
    console.log(`[semantic-search] Threshold: ${matchThreshold}, Count: ${matchCount}`)

    // クエリの埋め込みを生成
    const openaiResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float',
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error(`[semantic-search] OpenAI API error: ${errorText}`)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const embeddingData: OpenAIEmbeddingResponse = await openaiResponse.json()
    const queryEmbedding = embeddingData.data[0].embedding

    console.log(`[semantic-search] Query embedding generated: ${queryEmbedding.length} dimensions`)
    console.log(`[semantic-search] Tokens used: ${embeddingData.usage.total_tokens}`)

    // ベクトル類似度検索を実行
    // セキュリティ: match_documents関数内でauth.uid()を直接参照するため、
    // クライアントからuser_idを渡す必要がない（user_id偽装を防止）
    const { data: results, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      })

    if (searchError) {
      console.error(`[semantic-search] Search error:`, searchError)
      throw new Error(`Search failed: ${searchError.message}`)
    }

    const endTime = performance.now()
    const executionTime = Math.round(endTime - startTime)

    console.log(`[semantic-search] Found ${results?.length || 0} results in ${executionTime}ms`)

    // 成功レスポンス
    return new Response(
      JSON.stringify({
        success: true,
        results: results || [],
        metadata: {
          queryTokens: embeddingData.usage.total_tokens,
          resultCount: results?.length || 0,
          executionTime: `${executionTime}ms`,
          matchThreshold,
          matchCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[semantic-search] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const endTime = performance.now()
    const executionTime = Math.round(endTime - startTime)

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        metadata: {
          executionTime: `${executionTime}ms`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
