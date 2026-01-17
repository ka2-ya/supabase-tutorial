"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import UserProfile from "@/components/auth/UserProfile";

export default function AuthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("ログインエラー: " + error.message);
      throw error;
    }
  };

  const handleSignup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("サインアップエラー: " + error.message);
      throw error;
    } else {
      alert("確認メールを送信しました。メールを確認してください。");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert("Googleログインエラー: " + error.message);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-24 p-8 flex items-center justify-center">
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔐 Authentication</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Supabase Authを使用した認証機能の学習
          </p>
        </div>

        <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">⚠️ セットアップが必要です</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              Supabase Dashboard → Authentication → Providers でメール認証を有効化
            </li>
            <li>
              （オプション）Google OAuthを使う場合は、Google Providerを設定
            </li>
            <li>
              Authentication → URL Configuration で Redirect URLs に
              <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">
                http://localhost:3000/auth/callback
              </code>
              を追加
            </li>
          </ol>
        </div>

        {user ? (
          <UserProfile user={user} onLogout={handleLogout} />
        ) : (
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowSignup(false)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    !showSignup
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  ログイン
                </button>
                <button
                  onClick={() => setShowSignup(true)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    showSignup
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  サインアップ
                </button>
              </div>

              {showSignup ? (
                <SignupForm onSignup={handleSignup} />
              ) : (
                <LoginForm onLogin={handleLogin} />
              )}
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                  または
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでログイン
            </button>
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">📚 学習ポイント</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>サインアップ:</strong> <code>signUp()</code>
              で新規ユーザー登録
            </li>
            <li>
              <strong>ログイン:</strong> <code>signInWithPassword()</code>
              でメール認証
            </li>
            <li>
              <strong>OAuth:</strong> <code>signInWithOAuth()</code>
              でGoogle等の外部認証
            </li>
            <li>
              <strong>セッション管理:</strong> <code>onAuthStateChange()</code>
              で認証状態を監視
            </li>
            <li>
              <strong>ログアウト:</strong> <code>signOut()</code>でセッション削除
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
