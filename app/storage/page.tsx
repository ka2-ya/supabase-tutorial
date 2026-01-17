"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import { fileUploadSchema } from "@/lib/validations/file";
import UploadForm from "@/components/storage/UploadForm";
import FileList from "@/components/storage/FileList";
import type { FileObject } from "@supabase/storage-js";

// 型安全なStorageFile型
type StorageFile = FileObject;

export default function StoragePage() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const supabase = createClient();
  const { addToast } = useToast();
  const BUCKET_NAME = "public-files";

  const fetchFiles = async () => {
    setLoading(true);

    try {
      // 認証済みユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        addToast("ログインが必要です", "warning");
        setFiles([]);
        setUserId("");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // ユーザーのフォルダ内のファイルを取得
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (error) {
        logger.error("Failed to fetch files", { error: error.message, userId: user.id });
        addToast("ファイルの取得に失敗しました", "error");
      } else {
        setFiles(data || []);
        logger.debug("Fetched files", { count: data?.length, userId: user.id });
      }
    } catch (error) {
      logger.error("Unexpected error fetching files", { error });
      addToast("予期しないエラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (file: File) => {
    try {
      // zodバリデーション
      const validationResult = fileUploadSchema.safeParse({ file });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0]?.message || "ファイルが不正です";
        addToast(errorMessage, "error");
        throw new Error(errorMessage);
      }

      // 認証済みユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        addToast("ログインが必要です", "warning");
        throw new Error("User not authenticated");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`; // ユーザーIDベースのパス

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (error) {
        logger.error("Failed to upload file", {
          error: error.message,
          userId: user.id,
          fileName: file.name,
        });
        addToast("ファイルのアップロードに失敗しました", "error");
        throw error;
      } else {
        addToast("ファイルをアップロードしました", "success");
        await fetchFiles();
      }
    } catch (error) {
      logger.error("Unexpected error uploading file", { error });
      if (error instanceof Error && !error.message.includes("User not authenticated")) {
        addToast("予期しないエラーが発生しました", "error");
      }
      throw error;
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        addToast("ログインが必要です", "warning");
        return;
      }

      // ユーザーIDを含むフルパス
      const fullPath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fullPath]);

      if (error) {
        logger.error("Failed to delete file", {
          error: error.message,
          userId: user.id,
          fileName,
        });
        addToast("ファイルの削除に失敗しました", "error");
      } else {
        addToast("ファイルを削除しました", "success");
        await fetchFiles();
      }
    } catch (error) {
      logger.error("Unexpected error deleting file", { error, fileName });
      addToast("予期しないエラーが発生しました", "error");
    }
  };

  const getPublicUrl = (fileName: string) => {
    // ユーザーIDを含むフルパスでURLを取得
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${userId}/${fileName}`);

    return data.publicUrl;
  };

  return (
    <main className="min-h-screen pt-24 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📁 Storage</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Supabase Storageを使用したファイル管理の学習
          </p>
        </div>

        <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">⚠️ セットアップが必要です</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Supabase Dashboard → Storage で新しいバケットを作成</li>
            <li>
              バケット名: <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">public-files</code>
            </li>
            <li>Public bucket のオプションを有効化</li>
            <li>
              以下のポリシーを作成して、全員がアップロード・削除できるようにする:
            </li>
          </ol>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-sm mt-4">
{`-- Storage Policy (Supabase Dashboard で設定)
-- INSERT policy
CREATE POLICY "Public upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'public-files');

-- SELECT policy
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-files');

-- DELETE policy
CREATE POLICY "Public delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'public-files');`}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">ファイルアップロード</h2>
            <UploadForm onUpload={handleUpload} />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">
              アップロード済みファイル
            </h2>
            {loading ? (
              <p>読み込み中...</p>
            ) : (
              <FileList
                files={files}
                onDelete={handleDelete}
                getPublicUrl={getPublicUrl}
              />
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">📚 学習ポイント</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>アップロード:</strong> <code>.upload()</code>
              でファイルをバケットに保存
            </li>
            <li>
              <strong>ファイル一覧:</strong> <code>.list()</code>
              でバケット内のファイルを取得
            </li>
            <li>
              <strong>削除:</strong> <code>.remove()</code>でファイルを削除
            </li>
            <li>
              <strong>公開URL:</strong> <code>.getPublicUrl()</code>
              でアクセス可能なURLを取得
            </li>
            <li>
              <strong>セキュリティ:</strong> RLS（Row Level
              Security）でアクセス制御
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
