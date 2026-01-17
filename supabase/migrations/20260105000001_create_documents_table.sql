/**
 * 意味検索用documentsテーブルの作成
 *
 * 学習ポイント:
 * - vector型カラムの定義
 * - ベクトル検索用インデックス（HNSW）
 * - RLSによるユーザーごとのアクセス制御
 * - 将来的な拡張性を考慮した設計
 */

-- ==========================================
-- Documentsテーブルの作成
-- ==========================================

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  -- OpenAI text-embedding-3-smallは1536次元
  embedding vector(1536),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- インデックス作成
-- ==========================================

-- user_idインデックス（RLS用）
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);

-- 作成日時インデックス（ソート用）
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);

-- ベクトル検索用HNSWインデックス（コサイン類似度）
-- HNSW: Hierarchical Navigable Small World
-- - IVFFlatより高速だが、構築に時間がかかる
-- - m=16: グラフの接続数（デフォルト）
-- - ef_construction=64: 構築時の探索範囲（デフォルト）
CREATE INDEX IF NOT EXISTS documents_embedding_idx
ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 代替案: IVFFlatインデックス（大量データ向け）
-- 10万件以上のドキュメントがある場合はこちらを検討
-- CREATE INDEX documents_embedding_idx
-- ON documents
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- ==========================================
-- RLSポリシー
-- ==========================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 自分のドキュメントのみ表示可能
CREATE POLICY "Users can view own documents"
ON documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 自分のドキュメントのみ作成可能
CREATE POLICY "Users can create own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 自分のドキュメントのみ更新可能
CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 自分のドキュメントのみ削除可能
CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- トリガー: updated_atの自動更新
-- ==========================================

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 検索関数の作成
-- ==========================================

/**
 * 意味検索関数
 *
 * @param query_embedding: 検索クエリの埋め込みベクトル
 * @param match_threshold: 類似度の閾値（0〜1、デフォルト0.5）
 * @param match_count: 返す結果の最大数（デフォルト10）
 * @param filter_user_id: フィルタリングするユーザーID（RLS適用）
 *
 * @returns: 類似度の高い順にドキュメントを返す
 */
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  title text,
  content text,
  user_id uuid,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.content,
    documents.user_id,
    -- コサイン類似度を計算（1 - コサイン距離）
    1 - (documents.embedding <=> query_embedding) as similarity,
    documents.created_at
  FROM documents
  WHERE
    -- RLS: ユーザーフィルタリング
    (filter_user_id IS NULL OR documents.user_id = filter_user_id)
    -- 類似度閾値フィルタリング
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- ==========================================
-- コメント
-- ==========================================

COMMENT ON TABLE documents IS '
意味検索用ドキュメントテーブル。
各ドキュメントはOpenAI埋め込みベクトルを持ち、コサイン類似度で検索可能。
';

COMMENT ON COLUMN documents.embedding IS 'OpenAI text-embedding-3-small (1536次元)';
COMMENT ON COLUMN documents.user_id IS 'ドキュメントの所有者（RLS適用）';

COMMENT ON FUNCTION match_documents IS '
ベクトル類似度検索関数。
クエリの埋め込みベクトルに対して、類似度の高いドキュメントを返す。
';
