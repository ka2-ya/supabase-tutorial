'use client';

import { useState } from 'react';

interface CronJob {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string;
}

interface CronJobListProps {
  jobs: CronJob[];
  loading: boolean;
  onUnschedule: (jobName: string) => Promise<{ success: boolean; error?: string }>;
  onRefresh: () => void;
}

export default function CronJobList({ jobs, loading, onUnschedule, onRefresh }: CronJobListProps) {
  const [deletingJob, setDeletingJob] = useState<string | null>(null);

  const handleUnschedule = async (jobName: string) => {
    if (!confirm(`ジョブ「${jobName}」を削除しますか？`)) {
      return;
    }

    setDeletingJob(jobName);
    await onUnschedule(jobName);
    setDeletingJob(null);
  };

  // Parse cron schedule to human-readable format
  const parseCronSchedule = (schedule: string): string => {
    const parts = schedule.split(' ');
    if (parts.length !== 5) return schedule;

    const [minute, hour, day, month, dayOfWeek] = parts;

    // Simple interpretations
    if (schedule === '* * * * *') return '毎分';
    if (schedule === '0 * * * *') return '毎時0分';
    if (schedule === '0 0 * * *') return '毎日0時';
    if (schedule === '0 0 * * 0') return '毎週日曜0時';
    if (schedule === '0 0 1 * *') return '毎月1日0時';
    if (schedule.startsWith('*/')) {
      const interval = minute.substring(2);
      return `${interval}分ごと`;
    }

    return schedule;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          スケジュールされているジョブがありません
        </p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          更新
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          🔄 更新
        </button>
      </div>

      {jobs.map((job) => (
        <div
          key={job.jobid}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{job.jobname}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    job.active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {job.active ? 'アクティブ' : '無効'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">スケジュール: </span>
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {job.schedule}
                  </code>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    ({parseCronSchedule(job.schedule)})
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400">コマンド: </span>
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                    {job.command}
                  </code>
                </div>

                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>データベース: {job.database}</span>
                  <span>ユーザー: {job.username}</span>
                  <span>ジョブID: {job.jobid}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleUnschedule(job.jobname)}
              disabled={deletingJob === job.jobname}
              className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {deletingJob === job.jobname ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
      ))}

      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
        全{jobs.length}件のジョブ
      </div>
    </div>
  );
}
