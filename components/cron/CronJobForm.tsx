'use client';

import { useState } from 'react';

interface CronJobFormProps {
  onSchedule: (jobName: string, schedule: string, command: string) => Promise<{ success: boolean; error?: string }>;
}

export default function CronJobForm({ onSchedule }: CronJobFormProps) {
  const [jobName, setJobName] = useState('');
  const [schedule, setSchedule] = useState('0 * * * *');
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Predefined example commands
  const exampleCommands = [
    {
      name: '古いメッセージを削除',
      command: 'SELECT cleanup_old_messages();',
      schedule: '0 3 * * *',
      description: '7日以上前のメッセージを削除'
    },
    {
      name: '日次統計生成',
      command: 'SELECT generate_daily_stats();',
      schedule: '0 0 * * *',
      description: '毎日0時に統計を生成'
    },
    {
      name: 'ヘルスチェック',
      command: 'SELECT health_check();',
      schedule: '0 * * * *',
      description: '毎時システムの健全性をチェック'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await onSchedule(jobName, schedule, command);

    if (result.success) {
      setSuccess(true);
      setJobName('');
      setSchedule('0 * * * *');
      setCommand('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to schedule job');
    }

    setLoading(false);
  };

  const loadExample = (example: typeof exampleCommands[0]) => {
    setJobName(example.name);
    setCommand(example.command);
    setSchedule(example.schedule);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Job Name */}
        <div>
          <label htmlFor="jobName" className="block text-sm font-medium mb-1">
            ジョブ名
          </label>
          <input
            id="jobName"
            type="text"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="例: cleanup-old-data"
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Schedule */}
        <div>
          <label htmlFor="schedule" className="block text-sm font-medium mb-1">
            スケジュール (Cron形式)
          </label>
          <input
            id="schedule"
            type="text"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="0 * * * *"
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            分 時 日 月 曜日 (例: 0 * * * * = 毎時0分)
          </p>
        </div>

        {/* Command */}
        <div>
          <label htmlFor="command" className="block text-sm font-medium mb-1">
            実行コマンド (SQL)
          </label>
          <textarea
            id="command"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="SELECT your_function();"
            required
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              ジョブをスケジュールしました！
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'スケジュール中...' : 'ジョブをスケジュール'}
        </button>
      </form>

      {/* Example Commands */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3">サンプルコマンド</h3>
        <div className="space-y-2">
          {exampleCommands.map((example, index) => (
            <button
              key={index}
              onClick={() => loadExample(example)}
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-sm">{example.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {example.description}
              </div>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 inline-block">
                {example.schedule}
              </code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
