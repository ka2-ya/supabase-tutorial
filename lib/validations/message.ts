/**
 * Message関連のバリデーションスキーマ
 *
 * 学習ポイント:
 * - リアルタイムチャットでのデータ検証
 * - XSS攻撃の防止（HTMLタグの制限）
 * - メッセージ長の制限
 */
import { z } from 'zod';

/**
 * メッセージ作成時のバリデーションスキーマ
 */
export const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'メッセージは必須です')
    .max(500, 'メッセージは500文字以内で入力してください')
    .refine(
      (val) => {
        // 空白のみのメッセージを拒否
        return val.trim().length > 0;
      },
      {
        message: 'メッセージは空白のみにはできません',
      }
    ),
  username: z
    .string()
    .min(1, 'ユーザー名は必須です')
    .max(50, 'ユーザー名は50文字以内で入力してください'),
});

// 型推論
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
