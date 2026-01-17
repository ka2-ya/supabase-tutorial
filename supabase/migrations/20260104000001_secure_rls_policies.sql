/**
 * セキュアなRLS（Row Level Security）ポリシーの実装
 *
 * 学習ポイント:
 * - RLSによるデータアクセス制御
 * - ユーザーごとのデータ分離
 * - auth.uid()を使用した認証チェック
 * - パフォーマンスを考慮したインデックス作成
 *
 * 本番環境では、RLSは必須のセキュリティ対策です。
 * これにより、SQLインジェクション攻撃やデータ漏洩を防ぎます。
 */

-- ==========================================
-- Todosテーブルのセキュア化
-- ==========================================

-- user_idカラムを追加（認証済みユーザーのIDを保存）
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 既存の危険なポリシーを削除
DROP POLICY IF EXISTS "Enable all access for todos" ON todos;

-- パフォーマンス向上のためのインデックス作成
-- user_idとcreated_atの組み合わせでクエリが高速化される
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON todos(user_id);
CREATE INDEX IF NOT EXISTS todos_user_id_created_at_idx ON todos(user_id, created_at DESC);

-- 未完了のTodoを効率的に取得するためのインデックス
CREATE INDEX IF NOT EXISTS todos_completed_idx ON todos(completed) WHERE completed = false;

-- 自分のTodoのみ表示可能
CREATE POLICY "Users can view own todos"
ON todos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 自分のTodoのみ作成可能
CREATE POLICY "Users can create own todos"
ON todos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 自分のTodoのみ更新可能
CREATE POLICY "Users can update own todos"
ON todos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 自分のTodoのみ削除可能
CREATE POLICY "Users can delete own todos"
ON todos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- Messagesテーブルのセキュア化
-- ==========================================

-- user_idカラムを追加
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 既存の危険なポリシーを削除
DROP POLICY IF EXISTS "Enable all access for messages" ON messages;

-- パフォーマンス向上のためのインデックス作成
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- 認証済みユーザーは全てのメッセージを表示可能（チャットの性質上）
CREATE POLICY "Authenticated users can view all messages"
ON messages FOR SELECT
TO authenticated
USING (true);

-- 認証済みユーザーのみメッセージ作成可能
CREATE POLICY "Authenticated users can create messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 自分のメッセージのみ削除可能
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- Storageポリシーのセキュア化
-- ==========================================

-- 既存の危険なポリシーを削除
DROP POLICY IF EXISTS "Public upload" ON storage.objects;
DROP POLICY IF EXISTS "Public read" ON storage.objects;
DROP POLICY IF EXISTS "Public delete" ON storage.objects;

-- 認証済みユーザーは自分のフォルダにのみアップロード可能
-- ファイルパス形式: {user_id}/{filename}
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 認証済みユーザーは全てのファイルを表示可能
-- （学習用プロジェクトのため。本番環境では制限を検討）
CREATE POLICY "Authenticated users can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'public-files');

-- 自分のファイルのみ削除可能
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- 既存データのマイグレーション
-- ==========================================

-- 注意: 既存のデータがある場合、user_idがNULLになっています。
-- 本番環境では、既存データに適切なuser_idを設定する必要があります。
--
-- 例: 開発環境で全てのデータを削除する場合
-- DELETE FROM todos WHERE user_id IS NULL;
-- DELETE FROM messages WHERE user_id IS NULL;
--
-- または、特定のユーザーIDを設定する場合:
-- UPDATE todos SET user_id = 'your-user-id-here' WHERE user_id IS NULL;

-- ==========================================
-- ビューの作成（統計情報）
-- ==========================================

-- ユーザーごとのTodo統計
CREATE OR REPLACE VIEW user_todo_stats AS
SELECT
  user_id,
  COUNT(*) as total_todos,
  COUNT(*) FILTER (WHERE completed = true) as completed_todos,
  COUNT(*) FILTER (WHERE completed = false) as pending_todos,
  ROUND(
    COUNT(*) FILTER (WHERE completed = true)::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100,
    2
  ) as completion_rate
FROM todos
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- ==========================================
-- コメント追加（ドキュメント）
-- ==========================================

COMMENT ON TABLE todos IS '
Todoアイテムを管理するテーブル。
RLSにより、各ユーザーは自分のTodoのみアクセス可能。
';

COMMENT ON COLUMN todos.user_id IS '
Todoの所有者のユーザーID。
auth.users テーブルへの外部キー。
';

COMMENT ON TABLE messages IS '
リアルタイムチャットのメッセージを管理するテーブル。
全ユーザーが閲覧可能だが、削除は自分のメッセージのみ可能。
';

COMMENT ON COLUMN messages.user_id IS '
メッセージの送信者のユーザーID。
auth.users テーブルへの外部キー。
';
