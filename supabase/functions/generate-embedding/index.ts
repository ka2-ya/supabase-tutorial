// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// 共通CORSヘルパーをインポート
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
} from '../_shared/cors.ts'

/**
 * Edge Function: generate-embedding
 *
 * 学習ポイント:
 * - OpenAI APIを使用した埋め込み生成
 * - Supabase認証の検証
 * - エラーハンドリングとロギング
 * - トランザクション処理
 *
 * エンドポイント: /functions/v1/generate-embedding
 * メソッド: POST
 * 認証: 必須（JWT）
 *
 * リクエストボディ:
 * {
 *   "title": "ドキュメントのタイトル",
 *   "content": "ドキュメントの本文"
 * }
 *
 * レスポンス:
 * {
 *   "success": true,
 *   "documentId": 123,
 *   "message": "Document created successfully"
 * }
 */

interface RequestBody {
  title: string
  content: string
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

Deno.serve(async (req) => {
  // CORS preflight リクエストの処理
  const corsResponse = handleCorsPreflightRequest(req)
  if (corsResponse) return corsResponse

  const corsHeaders = getCorsHeaders(req)

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

    // Supabaseクライアントの作成（Service Role Key使用）
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // JWTトークンからユーザー認証
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
    const { title, content }: RequestBody = await req.json()

    if (!title || typeof title !== 'string' || title.length === 0) {
      throw new Error('Title is required and must be a non-empty string')
    }

    if (!content || typeof content !== 'string' || content.length < 10) {
      throw new Error('Content must be at least 10 characters long')
    }

    if (content.length > 8000) {
      throw new Error('Content must be less than 8000 characters')
    }

    console.log(`[generate-embedding] Processing request for user: ${user.id}`)
    console.log(`[generate-embedding] Title: ${title.substring(0, 50)}...`)
    console.log(`[generate-embedding] Content length: ${content.length} characters`)

    // OpenAI APIで埋め込みを生成
    const openaiResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: content,
        encoding_format: 'float',
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error(`[generate-embedding] OpenAI API error: ${errorText}`)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const embeddingData: OpenAIEmbeddingResponse = await openaiResponse.json()
    const embedding = embeddingData.data[0].embedding

    console.log(`[generate-embedding] Embedding generated: ${embedding.length} dimensions`)
    console.log(`[generate-embedding] Tokens used: ${embeddingData.usage.total_tokens}`)

    // ドキュメントをデータベースに保存
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        title,
        content,
        embedding,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error(`[generate-embedding] Database insert error:`, insertError)
      throw new Error(`Failed to save document: ${insertError.message}`)
    }

    console.log(`[generate-embedding] Document created with ID: ${document.id}`)

    // 成功レスポンス
    return new Response(
      JSON.stringify({
        success: true,
        documentId: document.id,
        message: 'Document created successfully',
        metadata: {
          tokensUsed: embeddingData.usage.total_tokens,
          embeddingDimensions: embedding.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    )
  } catch (error) {
    console.error('[generate-embedding] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
