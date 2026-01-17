"use client";

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

interface SearchResultsProps {
  results: SearchResult[];
  metadata: SearchMetadata | null;
  loading: boolean;
}

export default function SearchResults({ results, metadata, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">検索中...</p>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">検索クエリを入力してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* メタデータ */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-500">結果数</p>
            <p className="font-semibold">{metadata.resultCount}件</p>
          </div>
          <div>
            <p className="text-gray-500">実行時間</p>
            <p className="font-semibold">{metadata.executionTime}</p>
          </div>
          <div>
            <p className="text-gray-500">クエリトークン</p>
            <p className="font-semibold">{metadata.queryTokens}</p>
          </div>
          <div>
            <p className="text-gray-500">類似度閾値</p>
            <p className="font-semibold">{metadata.matchThreshold.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 検索結果 */}
      {results.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">検索結果が見つかりませんでした</p>
          <p className="text-sm text-gray-500 mt-2">
            類似度閾値を下げるか、別のクエリを試してください
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="p-6 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{result.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">類似度:</span>
                  <SimilarityBadge similarity={result.similarity} />
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {result.content.substring(0, 200)}
                {result.content.length > 200 && "..."}
              </p>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>ID: {result.id}</span>
                <span>{new Date(result.created_at).toLocaleString("ja-JP")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 類似度スコアのバッジコンポーネント
 */
function SimilarityBadge({ similarity }: { similarity: number }) {
  const percentage = Math.round(similarity * 100);

  let bgColor = "bg-gray-200 text-gray-700";
  if (similarity >= 0.8) {
    bgColor = "bg-green-100 text-green-700";
  } else if (similarity >= 0.6) {
    bgColor = "bg-blue-100 text-blue-700";
  } else if (similarity >= 0.4) {
    bgColor = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${bgColor}`}>
      {percentage}%
    </span>
  );
}
