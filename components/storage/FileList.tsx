"use client";

type StorageFile = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  metadata: any;
};

type FileListProps = {
  files: StorageFile[];
  onDelete: (fileName: string) => Promise<void>;
  getPublicUrl: (fileName: string) => string;
};

export default function FileList({ files, onDelete, getPublicUrl }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        ファイルがありません。アップロードしてください。
      </div>
    );
  }

  const isImage = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
  };

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="p-4 border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate mb-2">{file.name}</h3>

              {isImage(file.name) && (
                <div className="mb-3">
                  <img
                    src={getPublicUrl(file.name)}
                    alt={file.name}
                    className="max-w-full h-auto rounded max-h-48 object-cover"
                  />
                </div>
              )}

              <p className="text-xs text-gray-400 mb-2">
                作成: {new Date(file.created_at).toLocaleString("ja-JP")}
              </p>

              <a
                href={getPublicUrl(file.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline break-all"
              >
                {getPublicUrl(file.name)}
              </a>
            </div>

            <button
              onClick={() => onDelete(file.name)}
              className="ml-2 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors whitespace-nowrap"
            >
              削除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
