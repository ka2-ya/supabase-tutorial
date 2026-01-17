import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen pt-24 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Supabase Learning Project
        </h1>

        <p className="text-center mb-12 text-gray-600 dark:text-gray-400">
          Supabaseの主要機能を実際に操作して学習できるプロジェクトです
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/database"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">📊 Database (CRUD)</h2>
            <p className="text-gray-600 dark:text-gray-400">
              PostgreSQLデータベースの基本操作（作成・読取・更新・削除）を学習
            </p>
          </Link>

          <Link
            href="/auth"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">🔐 Authentication</h2>
            <p className="text-gray-600 dark:text-gray-400">
              ユーザー認証、サインアップ、ログイン、OAuth連携を学習
            </p>
          </Link>

          <Link
            href="/storage"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">📁 Storage</h2>
            <p className="text-gray-600 dark:text-gray-400">
              ファイルアップロード、画像保存、バケット管理を学習
            </p>
          </Link>

          <Link
            href="/realtime"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">⚡ Realtime</h2>
            <p className="text-gray-600 dark:text-gray-400">
              リアルタイムデータ同期、サブスクリプション機能を学習
            </p>
          </Link>

          <Link
            href="/functions"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">⚡ Edge Functions</h2>
            <p className="text-gray-600 dark:text-gray-400">
              サーバーサイド関数、外部API連携、データ処理を学習
            </p>
          </Link>

          <Link
            href="/search"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">🔍 Semantic Search</h2>
            <p className="text-gray-600 dark:text-gray-400">
              OpenAI埋め込みベクトルによる意味検索、pgvectorを学習
            </p>
          </Link>

          <Link
            href="/cron"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">⏰ Cron Jobs</h2>
            <p className="text-gray-600 dark:text-gray-400">
              pg_cronによる定期実行ジョブ、スケジューリングを学習
            </p>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">🚀 はじめ方</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Supabaseプロジェクトを作成（まだの場合）</li>
            <li>.env.localファイルに認証情報を設定</li>
            <li>各ページにアクセスして機能を試す</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
