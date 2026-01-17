"use client";

import { Todo } from "@/app/database/page";

type TodoListProps = {
  todos: Todo[];
  onToggle: (id: number, completed: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export default function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Todoがありません。新規作成してください。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="p-4 border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <input
                type="checkbox"
                checked={todo.completed ?? false}
                onChange={() => onToggle(todo.id, todo.completed ?? false)}
                className="mt-1 w-5 h-5 cursor-pointer"
              />
              <div className="flex-1">
                <h3
                  className={`font-semibold ${
                    todo.completed
                      ? "line-through text-gray-400"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {todo.title}
                </h3>
                {todo.description && (
                  <p
                    className={`text-sm mt-1 ${
                      todo.completed
                        ? "line-through text-gray-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {todo.description}
                  </p>
                )}
                {todo.created_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(todo.created_at).toLocaleString("ja-JP")}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onDelete(todo.id)}
              className="ml-2 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
