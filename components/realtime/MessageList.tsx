"use client";

import { Message } from "@/app/realtime/page";

type MessageListProps = {
  messages: Message[];
  currentUsername: string;
  onDelete: (id: number) => Promise<void>;
};

export default function MessageList({
  messages,
  currentUsername,
  onDelete,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        メッセージがありません。最初のメッセージを送信してください。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const isOwnMessage = message.username === currentUsername;

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                isOwnMessage
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold mb-1 ${
                      isOwnMessage ? "text-blue-100" : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {message.username}
                  </p>
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString("ja-JP")}
                  </p>
                </div>

                {isOwnMessage && (
                  <button
                    onClick={() => onDelete(message.id)}
                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors whitespace-nowrap"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
