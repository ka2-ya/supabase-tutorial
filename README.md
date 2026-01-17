<div align="center">

# 🚀 Supabase Learning Project

**Next.js + Supabase の完全学習リポジトリ**

Supabaseの主要機能（Database、Authentication、Storage、Realtime）を実際に操作して学べるハンズオン型チュートリアルです。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.89-green)](https://supabase.com/)

</div>

---

## 機能一覧

### 📊 Database (CRUD)
- PostgreSQLデータベースの基本操作
- Create（新規作成）、Read（読取）、Update（更新）、Delete（削除）
- Todoアプリを通じた実践的な学習

### 🔐 Authentication
- メールアドレス認証（サインアップ/ログイン）
- OAuth認証（Google）
- セッション管理
- ユーザープロフィール表示

### 📁 Storage
- ファイルアップロード
- 画像プレビュー
- 公開URLの取得
- ファイル削除

### ⚡ Realtime
- リアルタイムデータ同期
- チャットアプリケーション
- 複数クライアント間でのデータ共有
- INSERT/DELETE イベントの監視

### ⚡ Edge Functions
- サーバーサイドTypeScript関数の実行
- 外部APIとの連携
- データ処理・変換
- Webhook受信エンドポイント

### 🔍 Semantic Search (意味検索)
- OpenAI embeddings (text-embedding-3-small) を使用した意味検索
- pgvector拡張による高速ベクトル検索
- コサイン類似度による類似文書の発見
- ドキュメントの自動埋め込みベクトル生成
- Edge Functionsを使用したセキュアな検索API

### ⏰ Cron (定期実行ジョブ)
- pg_cron拡張による定期ジョブの実行
- cronシンタックスと自然言語での設定
- データベースクリーンアップの自動化
- 定期的なレポート生成
- サブミニット（1-59秒ごと）のスケジューリング

## 必要な環境

このプロジェクトを始める前に、以下がインストールされていることを確認してください:

- **Node.js** 18.0以上 ([ダウンロード](https://nodejs.org/))
- **npm** または **yarn** (Node.jsに付属)
- **Supabaseアカウント** ([無料登録](https://supabase.com/))
- **OpenAI APIキー** (意味検索機能を使用する場合) ([取得方法](https://platform.openai.com/api-keys))
- テキストエディタ（推奨: [VS Code](https://code.visualstudio.com/)）

### 推奨スキル

- JavaScriptの基礎知識
- React/Next.jsの基本的な理解
- PostgreSQL/SQLの基礎（学習しながらでもOK）

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのダッシュボードから以下を取得：
   - Project URL
   - Anon (public) Key

### 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、Supabaseの認証情報を設定します。

**重要:** `.env.local`ファイルは`.gitignore`に含まれているため、Gitにコミットされません。

#### ステップ:

1. サンプルファイルをコピー:
   ```bash
   cp .env.local.example .env.local
   ```

2. `.env.local`ファイルを編集し、Supabaseダッシュボードから取得した値に置き換え:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **意味検索機能を使用する場合（オプション）:**
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```
   OpenAI APIキーは [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) から取得できます。

3. 値の取得場所:
   - Supabaseダッシュボード → [Settings](https://supabase.com/dashboard/project/_/settings/api) → API
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Project API keys` の `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**注意:** `anon` keyは公開しても安全です（Row Level Securityで保護されます）。ただし、`service_role` keyは絶対に公開しないでください。

### 4. データベーステーブルの作成

Supabase Dashboard → SQL Editor で以下のSQLを実行：

#### Todosテーブル（Database機能用）

```sql
CREATE TABLE todos (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)を有効化
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 全員が読み書きできるポリシー（学習用）
CREATE POLICY "Enable all access for todos"
ON todos FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

#### Messagesテーブル（Realtime機能用）

```sql
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)を有効化
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 全員が読み書きできるポリシー（学習用）
CREATE POLICY "Enable all access for messages"
ON messages FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Realtimeを有効化（重要！）
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

#### Documentsテーブル（Semantic Search機能用）

意味検索機能を使用する場合は、以下のマイグレーションを実行してください：

```sql
-- pgvector拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- documentsテーブルを作成
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- embeddingカラムにHNSWインデックスを作成（高速検索用）
CREATE INDEX documents_embedding_idx ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Row Level Security (RLS)を有効化
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のドキュメントのみ作成可能
CREATE POLICY "Users can insert their own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のドキュメントのみ閲覧可能
CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ユーザーは自分のドキュメントのみ削除可能
CREATE POLICY "Users can delete their own documents"
ON documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 類似度検索用の関数を作成
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
RETURNS TABLE (
  id bigint,
  title text,
  content text,
  similarity float,
  created_at timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT
    documents.id,
    documents.title,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity,
    documents.created_at
  FROM documents
  WHERE documents.user_id = filter_user_id
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

#### Cron Jobs（定期実行ジョブ）

pg_cron拡張を使用した定期ジョブを使用する場合は、以下のマイグレーションを実行してください：

```sql
-- pg_cron拡張を有効化
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- cron.jobテーブルへのアクセス権限を付与（ジョブの一覧表示用）
GRANT SELECT ON cron.job TO authenticated;

-- 古いメッセージを削除する関数を作成（例）
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM messages
  WHERE created_at < NOW() - INTERVAL '7 days';
$$;

-- cronジョブのスケジュール例（毎日午前3時に古いメッセージを削除）
SELECT cron.schedule(
  'cleanup-old-messages',
  '0 3 * * *',
  'SELECT cleanup_old_messages();'
);

-- cron_job_logs テーブルを作成（ジョブ実行履歴の記録用）
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)を有効化
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- 全員が読み取りできるポリシー（学習用）
CREATE POLICY "Enable read access for cron_job_logs"
ON cron_job_logs FOR SELECT
TO public
USING (true);
```

**注意:** これらのマイグレーションは `supabase/migrations/` ディレクトリにも保存されています。

### 5. Authentication の設定

#### Email認証の設定

Supabase Dashboard → Authentication → Providers で以下を設定：

1. **Email Provider**を有効化
2. **URL Configuration**:
   - Authentication → URL Configuration
   - Redirect URLsに `http://localhost:3000/auth/callback` を追加

#### Google OAuth認証の設定（オプション）

Google OAuthを使用する場合は、以下の手順で設定します：

##### 1. Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
5. 同意画面の構成（初回のみ）:
   - User Type: 外部
   - アプリ名、サポートメールなどを入力
   - スコープは追加不要（デフォルトのまま）
6. OAuth 2.0 クライアントIDの作成:
   - アプリケーションの種類: **ウェブアプリケーション**
   - 名前: 任意（例: "Supabase Auth"）
   - **承認済みのリダイレクトURI**に以下を追加:
     ```
     https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
     ```
     **重要**: `YOUR-PROJECT-ID`は、あなたのSupabaseプロジェクトURL（`NEXT_PUBLIC_SUPABASE_URL`）から取得してください。

     例: `https://yuoolmztdvtwstzuelhw.supabase.co/auth/v1/callback`

7. 作成後、**クライアントID**と**クライアントシークレット**をコピー

##### 2. Supabaseでの設定

1. Supabase Dashboard → **Authentication** → **Providers**
2. **Google**を探して有効化
3. Google Cloud Consoleからコピーした値を入力:
   - **Client ID**: クライアントID
   - **Client Secret**: クライアントシークレット
4. **Save**をクリック

##### 3. 動作確認

- アプリの認証ページ（`http://localhost:3000/auth`）で「Googleでログイン」ボタンをクリック
- Googleのログイン画面が表示されることを確認
- ログイン後、アプリにリダイレクトされることを確認

**注意事項:**
- リダイレクトURIは必ず `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback` の形式である必要があります

### 6. Storage の設定

Supabase Dashboard → Storage で以下を設定：

1. 新しいバケットを作成
   - バケット名: `public-files`
   - Public bucketを有効化

2. Policies タブで以下のポリシーを作成：

```sql
-- INSERT policy
CREATE POLICY "Public upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'public-files');

-- SELECT policy
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-files');

-- DELETE policy
CREATE POLICY "Public delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'public-files');
```

### 7. Edge Functions の設定（オプション）

Edge Functionsを使用する場合は、Supabase CLIが必要です：

#### CLIのインストール

公式ドキュメント: https://github.com/supabase/cli

**macOS（推奨）:**
```bash
brew install supabase/tap/supabase
```

**npm (開発用依存関係として):**
```bash
npm i supabase --save-dev
# 実行時は npx を使用
npx supabase <command>
```

**npx（インストール不要）:**
```bash
# インストールせずに直接実行
npx supabase <command>
```

**Windows:**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux:**
- Homebrew: `brew install supabase/tap/supabase`
- パッケージ (.deb, .rpm): https://github.com/supabase/cli/releases

**重要:** `npm install -g supabase`（グローバルインストール）はサポートされていません。上記の方法をご利用ください。

#### プロジェクトのリンクとデプロイ

```bash
# Supabaseにログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref your-project-id

# Edge Functionsをデプロイ
supabase functions deploy hello-world --no-verify-jwt
supabase functions deploy data-processing --no-verify-jwt

# 意味検索機能のEdge Functionsをデプロイ
supabase functions deploy generate-embedding
supabase functions deploy semantic-search
```

**注意:**
- Edge Functionsは `supabase/functions/` ディレクトリに配置されており、Denoランタイムで実行されます。
- `generate-embedding`と`semantic-search`は認証が必要なため、`--no-verify-jwt`フラグは使用しません。

#### Edge Functions の環境変数設定（意味検索機能用）

意味検索機能のEdge Functionsを使用する場合、以下の環境変数を設定する必要があります：

```bash
# OpenAI APIキーを設定
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

または、Supabase Dashboard → Edge Functions → Settings → Secrets から設定できます。

### 8. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## プロジェクト構成

```
lesson-supabase/
├── app/
│   ├── auth/              # 認証ページ
│   ├── cron/              # Cronジョブ管理ページ
│   ├── database/          # データベースページ
│   ├── functions/         # Edge Functionsページ
│   ├── realtime/          # リアルタイムページ
│   ├── search/            # 意味検索ページ
│   ├── storage/           # ストレージページ
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── components/
│   ├── auth/              # 認証コンポーネント
│   ├── cron/              # Cronジョブコンポーネント
│   ├── database/          # データベースコンポーネント
│   ├── realtime/          # リアルタイムコンポーネント
│   ├── search/            # 意味検索コンポーネント
│   └── storage/           # ストレージコンポーネント
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # クライアントサイドSupabaseクライアント
│   │   ├── server.ts      # サーバーサイドSupabaseクライアント
│   │   └── middleware.ts  # ミドルウェア用ヘルパー
│   ├── validations/       # Zodバリデーションスキーマ
│   ├── env.ts             # 型安全な環境変数
│   └── logger.ts          # ロギングユーティリティ
├── supabase/
│   ├── functions/         # Edge Functions
│   │   ├── hello-world/   # Hello World サンプル
│   │   ├── data-processing/ # データ処理サンプル
│   │   ├── generate-embedding/ # 埋め込みベクトル生成
│   │   └── semantic-search/ # 意味検索
│   └── migrations/        # データベースマイグレーション
│       ├── 20260105000000_enable_pgvector.sql
│       └── 20260105000001_create_documents_table.sql
├── .env.local.example     # 環境変数の例
└── README.md
```

## 学習のヒント

### Database (CRUD)
- `app/database/page.tsx` - メインロジック
- `.from('table_name').select()` - データ取得
- `.insert()` - データ作成
- `.update()` - データ更新
- `.delete()` - データ削除

### Authentication
- `app/auth/page.tsx` - 認証フロー
- `.auth.signUp()` - サインアップ
- `.auth.signInWithPassword()` - ログイン
- `.auth.signInWithOAuth()` - OAuth認証
- `.auth.onAuthStateChange()` - セッション監視

### Storage
- `app/storage/page.tsx` - ファイル管理
- `.storage.from('bucket').upload()` - アップロード
- `.storage.from('bucket').list()` - ファイル一覧
- `.storage.from('bucket').getPublicUrl()` - 公開URL取得

### Realtime
- `app/realtime/page.tsx` - リアルタイム同期
- `.channel('channel-name')` - チャネル作成
- `.on('postgres_changes', ...)` - データ変更監視
- `.subscribe()` - 購読開始

### Edge Functions
- `supabase/functions/` - 関数のソースコード
- `.functions.invoke('function-name', { body })` - 関数呼び出し
- `Deno.serve()` - サーバーハンドラー
- CORSヘッダーの設定が重要

### Semantic Search
- `app/search/page.tsx` - 意味検索のメインロジック
- `supabase/functions/generate-embedding/` - 埋め込みベクトル生成
- `supabase/functions/semantic-search/` - 意味検索実行
- OpenAI API (`text-embedding-3-small`) - テキストをベクトルに変換
- pgvector - ベクトル類似度検索（コサイン類似度）
- HNSWインデックス - 高速近似最近傍探索

### Cron
- `app/cron/page.tsx` - Cronジョブ管理のメインロジック
- `cron.schedule()` - ジョブのスケジュール設定
- `cron.unschedule()` - ジョブの削除
- cronシンタックス（例：`0 * * * *` = 毎時0分）
- pg_cron拡張 - PostgreSQL内での定期ジョブ実行

## トラブルシューティング

### データが表示されない
- `.env.local`の設定を確認
- Supabaseダッシュボードでテーブルが作成されているか確認
- RLSポリシーが正しく設定されているか確認

### 認証が動作しない
- Redirect URLsが正しく設定されているか確認
- Email Providerが有効化されているか確認

### Realtimeが動作しない
- `ALTER PUBLICATION supabase_realtime ADD TABLE messages;` を実行したか確認
- ブラウザのコンソールでエラーを確認

### ファイルアップロードできない
- バケット名が `public-files` で作成されているか確認
- Storageポリシーが正しく設定されているか確認

### 環境変数が読み込まれない
- 開発サーバーを再起動してください (`npm run dev`)
- `.env.local`ファイルが正しいディレクトリ（プロジェクトルート）にあるか確認
- ファイル名が `.env.local`（`.env`ではない）であることを確認

### "Invalid API Key" エラー
- `.env.local`のキーが正しくコピーされているか確認
- 余分なスペースや改行がないか確認
- Supabaseダッシュボードで`anon`キーを再度コピーして貼り付け

### Storageバケットが見つからない
- バケット名が正確に `public-files` であることを確認
- ダッシュボードのStorageセクションでバケットが作成されているか確認

### Edge Functionsのエラー
- デプロイ時は `--no-verify-jwt` フラグを使用（認証不要な関数の場合）
- 関数のログはSupabase Dashboard → Edge Functions → Logsで確認
- 環境変数（シークレット）が正しく設定されているか確認

### 意味検索機能のエラー
- OpenAI APIキーが正しく設定されているか確認（Edge Functions側の環境変数）
- documentsテーブルとpgvector拡張が正しく作成されているか確認
- Edge Functionsが正しくデプロイされているか確認
- 認証済みユーザーでログインしているか確認
- ブラウザのコンソールとSupabase Edge Functionsのログを確認

### Cronジョブのエラー
- pg_cron拡張が有効化されているか確認（`CREATE EXTENSION IF NOT EXISTS pg_cron;`）
- cron.jobテーブルへのアクセス権限が付与されているか確認
- RPC関数（`schedule_cron_job`, `unschedule_cron_job`）が作成されているか確認
- cronシンタックスが正しいか確認（5つのフィールド: 分 時 日 月 曜日）
- Supabase Dashboard → Database → Cron でジョブの実行履歴を確認
- ジョブが実行するSQL関数が存在するか確認

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Supabase Cron Guide](https://supabase.com/modules/cron) - 定期実行ジョブの設定
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Deno Documentation](https://deno.land/manual) - Edge Functionsのランタイム
- [pgvector Documentation](https://github.com/pgvector/pgvector) - PostgreSQLベクトル拡張
- [pg_cron Documentation](https://github.com/citusdata/pg_cron) - PostgreSQL cronジョブスケジューラー
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings) - テキスト埋め込みAPI

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

学習目的での使用、改変、再配布が自由に行えます。
