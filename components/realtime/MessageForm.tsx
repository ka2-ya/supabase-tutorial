"use client";

import { useState } from "react";

type MessageFormProps = {
  onSend: (content: string) => Promise<void>;
};

export default function MessageForm({ onSend }: MessageFormProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await onSend(message);
      setMessage("");
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="メッセージを入力..."
        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
        disabled={isSending}
      />
      <button
        type="submit"
        disabled={!message.trim() || isSending}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSending ? "送信中..." : "送信"}
      </button>
    </form>
  );
}
