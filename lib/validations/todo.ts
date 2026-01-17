/**
 * Todo関連のバリデーションスキーマ
 *
 * 学習ポイント:
 * - zodによるランタイム型検証
 * - フロントエンドでのデータ検証
 * - セキュリティ（悪意あるデータの防止）
 * - ユーザーフレンドリーなエラーメッセージ
 *
 * 本番環境では、クライアントサイドとサーバーサイドの両方で
 * バリデーションを行うことが重要です。
 */
import { z } from 'zod';

/**
 * Todo作成時のバリデーションスキーマ
 */
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional()
    .or(z.literal('')), // 空文字列も許可
});

/**
 * Todo更新時のバリデーションスキーマ
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください')
    .optional(),
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  completed: z.boolean().optional(),
});

// 型推論
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
