"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import { searchQuerySchema, createDocumentSchema } from "@/lib/validations/document";
import DocumentForm from "@/components/search/DocumentForm";
import SearchBar from "@/components/search/SearchBar";
import SearchResults from "@/components/search/SearchResults";

/**
 * 意味検索ページ
 *
 * 学習ポイント:
 * - OpenAI埋め込みベクトルによる意味検索
 * - Edge Functionsとの連携
 * - リアルタイム検索のUX
 * - 類似度スコアの可視化
 */

interface SearchResult {
  id: number;
  title: string;
  content: string;
  similarity: number;
  created_at: string;
}

interface SearchMetadata {
  queryTokens: number;
  resultCount: number;
  executionTime: string;
  matchThreshold: number;
  matchCount: number;
}

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();
  const { addToast } = useToast();

  // 認証状態を監視
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * ドキュメント作成
   */
  const handleCreateDocument = async (title: string, content: string) => {
    setCreating(true);

    try {
      // バリデーション
      const validationResult = createDocumentSchema.safeParse({ title, content });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0]?.message || "入力値が不正です";
        addToast(errorMessage, "error");
        return;
      }

      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        addToast("ログインが必要です", "warning");
        return;
      }

      // Edge Functionを呼び出して埋め込みを生成
      logger.info("Creating document with embedding", { title });

      const response = await supabase.functions.invoke('generate-embedding', {
        body: { title, content },
      });

      if (response.error) {
        logger.error("Failed to create document", { error: response.error });
        addToast("ドキュメントの作成に失敗しました", "error");
        return;
      }

      const { success, documentId, metadata } = response.data;

      if (success) {
        logger.info("Document created successfully", { documentId, metadata });
        addToast(`ドキュメントを作成しました（ID: ${documentId}）`, "success");
      }
    } catch (error) {
      logger.error("Unexpected error creating document", { error });
      addToast("予期しないエラーが発生しました", "error");
    } finally {
      setCreating(false);
    }
  };

  /**
   * 意味検索を実行
   */
  const handleSearch = async (
    query: string,
    matchThreshold: number = 0.5,
    matchCount: number = 10
  ) => {
    setLoading(true);
    setSearchResults([]);
    setSearchMetadata(null);

    try {
      // バリデーション
      const validationResult = searchQuerySchema.safeParse({
        query,
        matchThreshold,
        matchCount,
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0]?.message || "入力値が不正です";
        addToast(errorMessage, "error");
        return;
      }

      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        addToast("ログインが必要です", "warning");
        return;
      }

      // Edge Functionを呼び出して検索
      logger.info("Performing semantic search", { query, matchThreshold, matchCount });

      const response = await supabase.functions.invoke('semantic-search', {
        body: { query, matchThreshold, matchCount },
      });

      if (response.error) {
        logger.error("Search failed", { error: response.error });
        addToast("検索に失敗しました", "error");
        return;
      }

      const { success, results, metadata } = response.data;

      if (success) {
        setSearchResults(results);
        setSearchMetadata(metadata);

        logger.info("Search completed", {
          resultCount: results.length,
          executionTime: metadata.executionTime,
        });

        if (results.length === 0) {
          addToast("検索結果が見つかりませんでした", "info");
        } else {
          addToast(`${results.length}件の結果が見つかりました`, "success");
        }
      }
    } catch (error) {
      logger.error("Unexpected error during search", { error });
      addToast("予期しないエラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔍 Semantic Search</h1>
          <p className="text-gray-600 dark:text-gray-400">
            OpenAI埋め込みベクトルによる意味検索の学習
          </p>
        </div>

        {/* 認証チェック */}
        {!isAuthenticated && (
          <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">⚠️ ログインが必要です</h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              意味検索機能を使用するには、ログインする必要があります。
            </p>
            <a
              href="/auth"
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
            >
              ログインページへ
            </a>
          </div>
        )}

        {/* ドキュメント作成フォーム */}
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">📝 ドキュメント作成</h2>
          <DocumentForm onSubmit={handleCreateDocument} loading={creating} />
        </div>

        {/* 検索バー */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🔎 検索</h2>
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {/* 検索結果 */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">📊 検索結果</h2>
          <SearchResults
            results={searchResults}
            metadata={searchMetadata}
            loading={loading}
          />
        </div>

        {/* 学習ポイント */}
        <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">📚 学習ポイント</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>埋め込みベクトル:</strong> OpenAI text-embedding-3-small (1536次元)
            </li>
            <li>
              <strong>類似度計算:</strong> コサイン類似度（0〜1、1が最も類似）
            </li>
            <li>
              <strong>ベクトル検索:</strong> pgvector HNSWインデックス
            </li>
            <li>
              <strong>Edge Functions:</strong> 埋め込み生成と検索をサーバーサイドで実行
            </li>
            <li>
              <strong>セキュリティ:</strong> RLSによるユーザーごとのデータ分離
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
