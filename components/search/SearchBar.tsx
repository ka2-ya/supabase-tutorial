"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string, matchThreshold: number, matchCount: number) => Promise<void>;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [matchThreshold, setMatchThreshold] = useState(0.5);
  const [matchCount, setMatchCount] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSearch(query, matchThreshold, matchCount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索クエリを入力（意味で検索されます）"
          className="flex-1 p-3 border rounded-lg"
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "検索中..." : "検索"}
        </button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showAdvanced ? "詳細設定を隠す" : "詳細設定を表示"}
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">
              類似度閾値: {matchThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={matchThreshold}
              onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              高いほど厳密にマッチング
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              最大結果数: {matchCount}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={matchCount}
              onChange={(e) => setMatchCount(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              取得する結果の最大件数
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
