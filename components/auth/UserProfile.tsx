"use client";

import { User } from "@supabase/supabase-js";

type UserProfileProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-6 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">ログイン中</h2>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2">
            <span className="font-medium w-32">ユーザーID:</span>
            <span className="text-gray-600 dark:text-gray-400 break-all">
              {user.id}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-medium w-32">メール:</span>
            <span className="text-gray-600 dark:text-gray-400">
              {user.email}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-medium w-32">認証方法:</span>
            <span className="text-gray-600 dark:text-gray-400">
              {user.app_metadata.provider || "email"}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-medium w-32">作成日時:</span>
            <span className="text-gray-600 dark:text-gray-400">
              {new Date(user.created_at).toLocaleString("ja-JP")}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-medium w-32">最終ログイン:</span>
            <span className="text-gray-600 dark:text-gray-400">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString("ja-JP")
                : "N/A"}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          ログアウト
        </button>
      </div>

      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-green-700 dark:text-green-300">
          ✅ 認証に成功しました！このページでユーザー情報を確認できます。
        </p>
      </div>
    </div>
  );
}
