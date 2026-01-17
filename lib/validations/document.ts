/**
 * Document関連のバリデーションスキーマ
 *
 * 学習ポイント:
 * - 意味検索用ドキュメントのバリデーション
 * - テキスト長の制限（トークン数を考慮）
 * - セキュリティ（悪意あるデータの防止）
 */
import { z } from 'zod';

/**
 * ドキュメント作成時のバリデーションスキーマ
 */
export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  content: z
    .string()
    .min(10, 'コンテンツは10文字以上で入力してください')
    .max(8000, 'コンテンツは8000文字以内で入力してください')
    .refine(
      (val) => val.trim().length >= 10,
      {
        message: 'コンテンツは空白のみにはできません',
      }
    ),
});

/**
 * 検索クエリのバリデーションスキーマ
 */
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, '検索クエリは必須です')
    .max(500, '検索クエリは500文字以内で入力してください')
    .refine(
      (val) => val.trim().length >= 1,
      {
        message: '検索クエリは空白のみにはできません',
      }
    ),
  matchThreshold: z
    .number()
    .min(0, '類似度閾値は0以上である必要があります')
    .max(1, '類似度閾値は1以下である必要があります')
    .default(0.5)
    .optional(),
  matchCount: z
    .number()
    .min(1, '取得件数は1以上である必要があります')
    .max(50, '取得件数は50以下である必要があります')
    .default(10)
    .optional(),
});

// 型推論
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
