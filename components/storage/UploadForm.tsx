"use client";

import { useState } from "react";

type UploadFormProps = {
  onUpload: (file: File) => Promise<void>;
};

export default function UploadForm({ onUpload }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file);
      setFile(null);
      setPreview(null);
      // Reset input
      const input = document.getElementById("file-upload") as HTMLInputElement;
      if (input) input.value = "";
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="file-upload"
          className="block text-sm font-medium mb-2"
        >
          ファイルを選択
        </label>
        <input
          type="file"
          id="file-upload"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />
      </div>

      {file && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm mb-2">
            <strong>ファイル名:</strong> {file.name}
          </p>
          <p className="text-sm mb-2">
            <strong>サイズ:</strong> {(file.size / 1024).toFixed(2)} KB
          </p>
          <p className="text-sm">
            <strong>タイプ:</strong> {file.type || "不明"}
          </p>
        </div>
      )}

      {preview && (
        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium mb-2">プレビュー:</p>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto rounded"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!file || isUploading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? "アップロード中..." : "アップロード"}
      </button>
    </form>
  );
}
