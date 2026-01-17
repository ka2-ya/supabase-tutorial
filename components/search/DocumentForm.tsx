"use client";

import { useState } from "react";

interface DocumentFormProps {
  onSubmit: (title: string, content: string) => Promise<void>;
  loading: boolean;
}

export default function DocumentForm({ onSubmit, loading }: DocumentFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(title, content);
    setTitle("");
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          タイトル
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ドキュメントのタイトルを入力"
          className="w-full p-3 border rounded-lg"
          disabled={loading}
          required
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          コンテンツ
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ドキュメントの内容を入力（意味検索の対象）"
          rows={6}
          className="w-full p-3 border rounded-lg"
          disabled={loading}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          {content.length} / 8000文字
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "作成中..." : "ドキュメントを作成"}
      </button>
    </form>
  );
}
