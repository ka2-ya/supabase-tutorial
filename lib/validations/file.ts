/**
 * ファイルアップロード関連のバリデーションスキーマ
 *
 * 学習ポイント:
 * - ファイルサイズの制限
 * - MIMEタイプの検証
 * - セキュリティ（悪意あるファイルの防止）
 * - ユーザー体験（わかりやすいエラーメッセージ）
 *
 * 本番環境では、クライアントサイドとサーバーサイドの両方で
 * ファイル検証を行うことが重要です。
 */
import { z } from 'zod';

// 定数定義
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain'];
const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOCUMENT_TYPES];

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * ファイルアップロードのバリデーションスキーマ
 */
export const fileUploadSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, {
      message: 'ファイルを選択してください',
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `ファイルサイズは${formatFileSize(MAX_FILE_SIZE)}以下にしてください`,
    })
    .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type), {
      message: `対応ファイル形式: 画像（JPEG、PNG、WebP、GIF）、PDF、テキスト`,
    }),
});

/**
 * 画像ファイルのみのバリデーション
 */
export const imageUploadSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, {
      message: 'ファイルを選択してください',
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `ファイルサイズは${formatFileSize(MAX_FILE_SIZE)}以下にしてください`,
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: '対応ファイル形式: JPEG、PNG、WebP、GIF',
    }),
});

// 型推論
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;

// 定数のエクスポート
export { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES, ACCEPTED_IMAGE_TYPES };
