'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import CronJobList from '@/components/cron/CronJobList';
import CronJobForm from '@/components/cron/CronJobForm';
import CronJobLogs from '@/components/cron/CronJobLogs';

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

interface CronJobLog {
  id: number;
  job_name: string;
  status: string;
  message: string;
  created_at: string;
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [logs, setLogs] = useState<CronJobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc('get_cron_jobs');
      if (error) throw error;
      setJobs(data || []);
    } catch (err: unknown) {
      console.error('Error fetching cron jobs:', err);
      const errorObj = err as { message?: string };
      setError(errorObj?.message || 'Failed to fetch cron jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('cron_job_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching cron logs:', err);
    }
  };

  const scheduleJob = async (jobName: string, schedule: string, command: string) => {
    try {
      setError(null);
      const { error } = await supabase.rpc('schedule_cron_job', {
        job_name: jobName,
        job_schedule: schedule,
        job_command: command
      });
      if (error) throw error;
      await fetchJobs();
      return { success: true };
    } catch (err) {
      console.error('Error scheduling job:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule job';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const unscheduleJob = async (jobName: string) => {
    try {
      setError(null);
      const { error } = await supabase.rpc('unschedule_cron_job', {
        job_name: jobName
      });
      if (error) throw error;
      await fetchJobs();
      return { success: true };
    } catch (err) {
      console.error('Error unscheduling job:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unschedule job';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchLogs();

    const channel = supabase
      .channel('cron_logs_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cron_job_logs' },
        (payload) => {
          setLogs((current) => [payload.new as CronJobLog, ...current].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <main className="min-h-screen pt-24 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Cron Jobs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            pg_cronを使用してデータベース内で定期実行ジョブをスケジュールします
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">新しいジョブを作成</h2>
            <CronJobForm onSchedule={scheduleJob} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Cronスケジュール記法</h2>
            <div className="space-y-3 text-sm">
              <div>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  * * * * *
                </code>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  分 時 日 月 曜日
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">* * * * *</code>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">毎分</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">0 * * * *</code>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">毎時0分</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">0 0 * * *</code>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">毎日0時</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">*/5 * * * *</code>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">5分ごと</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">スケジュール済みジョブ</h2>
          <CronJobList
            jobs={jobs}
            loading={loading}
            onUnschedule={unscheduleJob}
            onRefresh={fetchJobs}
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">実行ログ</h2>
          <CronJobLogs logs={logs} />
        </div>
      </div>
    </main>
  );
}
