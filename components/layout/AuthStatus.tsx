"use client";

import Link from "next/link";
import { User } from "@supabase/supabase-js";

type AuthStatusProps = {
  user: User | null;
  onLogout: () => Promise<void>;
};

export default function AuthStatus({ user, onLogout }: AuthStatusProps) {
  if (!user) {
    return (
      <Link
        href="/auth"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
      >
        ログイン
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
        {user.email}
      </span>
      <button
        onClick={onLogout}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
      >
        ログアウト
      </button>
    </div>
  );
}
