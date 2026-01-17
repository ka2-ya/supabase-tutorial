"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import MessageList from "@/components/realtime/MessageList";
import MessageForm from "@/components/realtime/MessageForm";

export type Message = {
  id: number;
  content: string;
  username: string;
  created_at: string;
};

export default function RealtimePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Generate random username
    const randomUsername = `User${Math.floor(Math.random() * 1000)}`;
    setUsername(randomUsername);

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to realtime changes
    const realtimeChannel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("New message received:", payload);
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("Message deleted:", payload);
          setMessages((current) =>
            current.filter((msg) => msg.id !== (payload.old as Message).id)
          );
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    // Cleanup
    return () => {
      realtimeChannel.unsubscribe();
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    const { error } = await supabase
      .from("messages")
      .insert([{ content, username }]);

    if (error) {
      console.error("Error sending message:", error);
      alert("メッセージ送信エラー: " + error.message);
      throw error;
    }
  };

  const handleDeleteMessage = async (id: number) => {
    const { error } = await supabase.from("messages").delete().eq("id", id);

    if (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <main className="min-h-screen pt-24 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">⚡ Realtime</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Supabase Realtimeを使用したリアルタイムデータ同期の学習
          </p>
        </div>

        <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">⚠️ セットアップが必要です</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            このページを使用する前に、Supabaseで以下のテーブルを作成してください：
          </p>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`CREATE TABLE messages (
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
ALTER PUBLICATION supabase_realtime ADD TABLE messages;`}
          </pre>
        </div>

        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm">
            <strong>あなたのユーザー名:</strong> {username}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            別のブラウザやタブで同じページを開くと、リアルタイム同期を確認できます
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">チャットメッセージ</h2>

            <div className="mb-4 h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              {loading ? (
                <p className="text-center text-gray-500">読み込み中...</p>
              ) : (
                <MessageList
                  messages={messages}
                  currentUsername={username}
                  onDelete={handleDeleteMessage}
                />
              )}
            </div>

            <MessageForm onSend={handleSendMessage} />
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">📚 学習ポイント</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>チャネル作成:</strong> <code>.channel()</code>
              でリアルタイムチャネルを作成
            </li>
            <li>
              <strong>データ変更の監視:</strong>{" "}
              <code>.on('postgres_changes')</code>でINSERT/UPDATE/DELETEを検知
            </li>
            <li>
              <strong>購読開始:</strong> <code>.subscribe()</code>
              でリアルタイム受信を開始
            </li>
            <li>
              <strong>クリーンアップ:</strong> <code>.unsubscribe()</code>
              でリソースを解放
            </li>
            <li>
              <strong>複数クライアント:</strong>{" "}
              別のブラウザで開くと同時に同じデータを見られる
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
