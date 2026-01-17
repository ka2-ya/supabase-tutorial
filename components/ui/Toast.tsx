/**
 * トースト通知コンポーネント
 *
 * 学習ポイント:
 * - React Context APIによるグローバルステート管理
 * - カスタムフックによる使いやすいAPI
 * - アクセシビリティ（ARIA属性）
 * - アニメーション（Tailwind CSS）
 * - 自動削除タイマー
 *
 * 本番環境では、ユーザーへの適切なフィードバックは必須です。
 * alertやconsole.logではなく、トースト通知を使用しましょう。
 */
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// トーストのタイプ
type ToastType = 'success' | 'error' | 'info' | 'warning';

// トーストの構造
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Context の型定義
interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

// Context の作成
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * トーストプロバイダーコンポーネント
 * アプリケーション全体でトースト通知を使用可能にする
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * トーストを追加
   * 3秒後に自動的に削除される
   */
  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    // 3秒後に自動削除
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  /**
   * トーストを削除
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}

      {/* トースト表示エリア */}
      <div
        className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * 個別のトーストアイテムコンポーネント
 */
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  // タイプに応じたスタイル
  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  // タイプに応じたアイコン
  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      role="alert"
      className={`
        ${typeStyles[toast.type]}
        px-6 py-4 rounded-lg shadow-lg
        min-w-[300px] max-w-md
        flex items-center justify-between gap-4
        animate-slide-in
        pointer-events-auto
        transition-all duration-300
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold" aria-hidden="true">
          {typeIcons[toast.type]}
        </span>
        <p className="text-sm font-medium">{toast.message}</p>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="
          text-white hover:text-gray-200
          transition-colors
          text-xl font-bold
          leading-none
        "
        aria-label="通知を閉じる"
      >
        ×
      </button>
    </div>
  );
}

/**
 * トースト通知を使用するためのカスタムフック
 *
 * 使用例:
 * ```tsx
 * const { addToast } = useToast();
 *
 * // 成功メッセージ
 * addToast('Todoを作成しました', 'success');
 *
 * // エラーメッセージ
 * addToast('エラーが発生しました', 'error');
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
