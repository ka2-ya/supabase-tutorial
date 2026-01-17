"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import { createTodoSchema } from "@/lib/validations/todo";
import TodoList from "@/components/database/TodoList";
import TodoForm from "@/components/database/TodoForm";
import type { Database } from "@/lib/supabase/database.types";

// 自動生成された型を使用
export type Todo = Database["public"]["Tables"]["todos"]["Row"];

export default function DatabasePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { addToast } = useToast();

  const fetchTodos = async () => {
    setLoading(true);

    try {
      // 認証済みユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        addToast("ログインが必要です", "warning");
        setTodos([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to fetch todos", { error: error.message, userId: user.id });
        addToast("Todoの取得に失敗しました", "error");
      } else {
        setTodos(data || []);
        logger.debug("Fetched todos", { count: data?.length, userId: user.id });
      }
    } catch (error) {
      logger.error("Unexpected error fetching todos", { error });
      addToast("予期しないエラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleCreate = async (title: string, description: string) => {
    try {
      // zodバリデーション
      const validationResult = createTodoSchema.safeParse({ title, description });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0]?.message || "入力値が不正です";
        addToast(errorMessage, "error");
        return;
      }

      // 認証済みユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        addToast("ログインが必要です", "warning");
        return;
      }

      const { data, error } = await supabase
        .from("todos")
        .insert([{
          title,
          description: description || null,
          completed: false,
          user_id: user.id, // RLSポリシーに対応
        }])
        .select();

      if (error) {
        logger.error("Failed to create todo", { error: error.message, userId: user.id });
        addToast("Todoの作成に失敗しました", "error");
      } else {
        addToast("Todoを作成しました", "success");
        await fetchTodos();
      }
    } catch (error) {
      logger.error("Unexpected error creating todo", { error });
      addToast("予期しないエラーが発生しました", "error");
    }
  };

  const handleToggle = async (id: number, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("todos")
        .update({ completed: !completed })
        .eq("id", id);

      if (error) {
        logger.error("Failed to update todo", { error: error.message, todoId: id });
        addToast("Todoの更新に失敗しました", "error");
      } else {
        addToast(completed ? "未完了にしました" : "完了にしました", "success");
        await fetchTodos();
      }
    } catch (error) {
      logger.error("Unexpected error updating todo", { error, todoId: id });
      addToast("予期しないエラーが発生しました", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) {
        logger.error("Failed to delete todo", { error: error.message, todoId: id });
        addToast("Todoの削除に失敗しました", "error");
      } else {
        addToast("Todoを削除しました", "success");
        await fetchTodos();
      }
    } catch (error) {
      logger.error("Unexpected error deleting todo", { error, todoId: id });
      addToast("予期しないエラーが発生しました", "error");
    }
  };

  return (
    <main className="min-h-screen pt-24 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📊 Database (CRUD)</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Supabase PostgreSQLを使用したCRUD操作の学習
          </p>
        </div>

        <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">⚠️ セットアップが必要です</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            このページを使用する前に、Supabaseで以下のテーブルを作成してください：
          </p>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`CREATE TABLE todos (
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
WITH CHECK (true);`}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">新規作成 (Create)</h2>
            <TodoForm onSubmit={handleCreate} />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Todo一覧 (Read, Update, Delete)
            </h2>
            {loading ? (
              <p>読み込み中...</p>
            ) : (
              <TodoList
                todos={todos}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">📚 学習ポイント</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Create:</strong> <code>.insert()</code>でデータを新規作成
            </li>
            <li>
              <strong>Read:</strong> <code>.select()</code>でデータを取得、
              <code>.order()</code>で並び替え
            </li>
            <li>
              <strong>Update:</strong> <code>.update()</code>と<code>.eq()</code>
              で特定レコードを更新
            </li>
            <li>
              <strong>Delete:</strong> <code>.delete()</code>と<code>.eq()</code>
              で特定レコードを削除
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
