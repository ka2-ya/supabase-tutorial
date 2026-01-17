"use client";

import { useState } from "react";

type SignupFormProps = {
  onSignup: (email: string, password: string) => Promise<void>;
};

export default function SignupForm({ onSignup }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      alert("パスワードは6文字以上で入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSignup(email, password);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Error is handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
          メールアドレス
        </label>
        <input
          type="email"
          id="signup-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          required
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
          パスワード（6文字以上）
        </label>
        <input
          type="password"
          id="signup-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          required
          minLength={6}
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium mb-1"
        >
          パスワード（確認）
        </label>
        <input
          type="password"
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          required
          minLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "登録中..." : "サインアップ"}
      </button>
    </form>
  );
}
