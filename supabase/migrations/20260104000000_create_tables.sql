/**
 * 初期テーブルの作成
 *
 * 学習ポイント:
 * - PostgreSQLテーブルの作成
 * - データ型の選択
 * - デフォルト値の設定
 * - タイムスタンプの自動設定
 *
 * ⚠️ セキュリティ警告:
 * このマイグレーションは学習用のためRLSポリシーを作成していません。
 * 本番環境では 20260104000001_secure_rls_policies.sql のような
 * auth.uid() を使ったユーザーごとの制限を必ず適用してください。
 *
 * 例: USING (auth.uid() = user_id)
 */

-- ==========================================
-- Todosテーブルの作成
-- ==========================================

CREATE TABLE IF NOT EXISTS todos (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化（後のマイグレーションでポリシーを追加）
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Messagesテーブルの作成
-- ==========================================

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

/**
 * ⚠️ Realtime + RLS の注意点:
 *
 * Realtime機能はRLSの影響を受けます。
 * - SELECTポリシーが正しく設定されていないと、リアルタイムの変更がクライアントに届きません
 * - ユーザーがRealtimeでデータを受信するには、そのデータに対するSELECT権限が必要です
 *
 * 詳細: https://supabase.com/docs/guides/realtime/postgres-changes#row-level-security
 */

-- ==========================================
-- Storageバケットの作成
-- ==========================================

-- public-filesバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-files', 'public-files', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- トリガー関数：updated_atの自動更新
-- ==========================================

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- todosテーブルにトリガーを追加
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- コメント追加
-- ==========================================

COMMENT ON TABLE todos IS 'Todoアイテムを管理するテーブル';
COMMENT ON TABLE messages IS 'リアルタイムチャットのメッセージを管理するテーブル';
