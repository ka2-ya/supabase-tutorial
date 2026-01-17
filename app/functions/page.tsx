"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FunctionsPage() {
  const [helloResult, setHelloResult] = useState<string>("");
  const [processingResult, setProcessingResult] = useState<string>("");
  const [loading, setLoading] = useState<{
    hello: boolean;
    processing: boolean;
  }>({
    hello: false,
    processing: false,
  });
  const [inputData, setInputData] = useState<string>("");

  const supabase = createClient();

  const callHelloFunction = async () => {
    setLoading((prev) => ({ ...prev, hello: true }));
    setHelloResult("");

    try {
      const { data, error } = await supabase.functions.invoke("hello-world", {
        body: { name: "Supabase Learner" },
      });

      if (error) throw error;
      setHelloResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error calling function:", error);
      setHelloResult(
        `エラー: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, hello: false }));
    }
  };

  const callDataProcessingFunction = async () => {
    if (!inputData.trim()) {
      alert("処理するデータを入力してください");
      return;
    }

    setLoading((prev) => ({ ...prev, processing: true }));
    setProcessingResult("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "data-processing",
        {
          body: { text: inputData },
        }
      );

      if (error) {
        console.error("Function invocation error:", error);
        throw error;
      }
      setProcessingResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      console.error("Error calling function:", error);
      console.error("Error details:", {
        message: error?.message,
        context: error?.context,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });
      setProcessingResult(
        `エラー: ${error?.message || "Unknown error"}\n\n詳細:\n${JSON.stringify(
          {
            context: error?.context,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
          },
          null,
          2
        )}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, processing: false }));
    }
  };

  return (
    <main className="min-h-screen pt-24 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">⚡ Edge Functions</h1>

        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
            📘 Supabase Edge Functionsとは？
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Supabase Edge
            Functionsは、グローバルに分散されたエッジで実行されるサーバーサイドTypeScript関数です。
            Denoランタイムで動作し、低遅延で高速な処理が可能です。
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>TypeScript/JavaScriptで記述可能</li>
            <li>外部APIとの連携に最適</li>
            <li>Webhook受信やデータ処理に使用</li>
            <li>環境変数で機密情報を安全に管理</li>
          </ul>
        </div>

        <div className="space-y-8">
          {/* Hello World Function */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">
              1. Hello World Function
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              シンプルなEdge
              Functionを呼び出して、レスポンスを確認します。
            </p>

            <button
              onClick={callHelloFunction}
              disabled={loading.hello}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading.hello ? "実行中..." : "Hello Function を呼び出す"}
            </button>

            {helloResult && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">実行結果:</h3>
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                  {helloResult}
                </pre>
              </div>
            )}

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                💡 この関数は、リクエストボディの <code>name</code>{" "}
                パラメータを受け取り、挨拶メッセージを返します。
              </p>
            </div>
          </div>

          {/* Data Processing Function */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">
              2. Data Processing Function
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              テキストデータを処理するEdge
              Functionです。文字数カウント、大文字変換などの処理を行います。
            </p>

            <div className="mb-4">
              <label className="block mb-2 font-medium">
                処理するテキスト:
              </label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                rows={4}
                placeholder="ここにテキストを入力してください..."
              />
            </div>

            <button
              onClick={callDataProcessingFunction}
              disabled={loading.processing || !inputData.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading.processing
                ? "処理中..."
                : "Data Processing Function を呼び出す"}
            </button>

            {processingResult && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">処理結果:</h3>
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                  {processingResult}
                </pre>
              </div>
            )}

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                💡 この関数は、入力されたテキストの文字数をカウントし、
                大文字/小文字に変換して返します。
              </p>
            </div>
          </div>

          {/* Documentation */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">📚 学習のポイント</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">
                  Edge Functionの作成方法:
                </h3>
                <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded text-sm overflow-x-auto">
                  {`# Supabase CLIでプロジェクトを初期化
supabase init

# 新しいEdge Functionを作成
supabase functions new hello-world

# ローカルで実行
supabase functions serve

# デプロイ
supabase functions deploy hello-world`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  クライアントからの呼び出し:
                </h3>
                <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded text-sm overflow-x-auto">
                  {`const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' }
});`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">主な使用例:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li>外部API（Stripe、SendGrid等）との連携</li>
                  <li>Webhook受信エンドポイント</li>
                  <li>データの変換・加工処理</li>
                  <li>機密情報を扱う処理（APIキーなど）</li>
                  <li>複雑なビジネスロジック</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">注意事項:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li>実行時間は短時間（数秒以内）に抑える</li>
                  <li>
                    環境変数は Supabase Dashboard の Secrets で管理する
                  </li>
                  <li>長時間実行タスクはバックグラウンドワーカーを使用</li>
                  <li>冪等性を保つように設計する</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="p-6 border-2 border-orange-300 dark:border-orange-600 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">⚙️ セットアップ方法</h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="font-semibold">
                これらのEdge
                Functionsを実際に動作させるには、以下のセットアップが必要です:
              </p>

              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <strong>Supabase CLIをインストール:</strong>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">
                    {`# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop install supabase

# または npm (実行時は npx supabase と使用)
npm i supabase --save-dev`}
                  </pre>
                </li>

                <li>
                  <strong>Supabaseプロジェクトにログイン:</strong>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">
                    supabase login
                  </pre>
                </li>

                <li>
                  <strong>プロジェクトをリンク:</strong>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">
                    supabase link --project-ref your-project-id
                  </pre>
                </li>

                <li>
                  <strong>サンプルのEdge Functionsをデプロイ:</strong>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">
                    {`supabase functions deploy hello-world --no-verify-jwt
supabase functions deploy data-processing --no-verify-jwt`}
                  </pre>
                </li>
              </ol>

              <p className="text-sm mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                📖 詳細は README.md の「Edge Functions」セクションをご覧ください
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
