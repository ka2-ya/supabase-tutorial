-- Enable pg_cron extension for scheduled jobs
-- pg_cron allows you to schedule PostgreSQL commands to run periodically

-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant SELECT permission on cron.job table to authenticated users
-- This allows users to view scheduled jobs
GRANT SELECT ON cron.job TO authenticated;

-- Create a table to log cron job executions
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on cron_job_logs
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all users to read cron job logs (for learning purposes)
CREATE POLICY "Enable read access for cron_job_logs"
ON cron_job_logs FOR SELECT
TO public
USING (true);

-- Example: Create a function to cleanup old messages (7 days old)
-- This demonstrates how to create reusable functions for cron jobs
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM messages
  WHERE created_at < NOW() - INTERVAL '7 days';
$$;

-- Example: Schedule the cleanup job to run daily at 3:00 AM
-- Cron syntax: minute hour day-of-month month day-of-week
-- '0 3 * * *' means: at 0 minutes, 3rd hour, every day, every month, every day of week
SELECT cron.schedule(
  'cleanup-old-messages',  -- Job name
  '0 3 * * *',             -- Cron schedule (daily at 3 AM)
  'SELECT cleanup_old_messages();'  -- SQL command to execute
);

-- Example: Create a function to generate daily statistics
CREATE OR REPLACE FUNCTION generate_daily_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  message_count INTEGER;
  todo_count INTEGER;
BEGIN
  -- Count today's messages
  SELECT COUNT(*) INTO message_count
  FROM messages
  WHERE DATE(created_at) = CURRENT_DATE;

  -- Count active todos
  SELECT COUNT(*) INTO todo_count
  FROM todos
  WHERE completed = false;

  -- Log the statistics
  INSERT INTO cron_job_logs (job_name, status, message)
  VALUES (
    'generate-daily-stats',
    'success',
    format('Messages today: %s, Active todos: %s', message_count, todo_count)
  );
END;
$$;

-- Example: Schedule daily statistics generation at midnight
SELECT cron.schedule(
  'generate-daily-stats',
  '0 0 * * *',
  'SELECT generate_daily_stats();'
);

-- Example: Create a function for periodic health check
CREATE OR REPLACE FUNCTION health_check()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Perform a simple health check
  INSERT INTO cron_job_logs (job_name, status, message)
  VALUES ('health-check', 'success', 'System is healthy');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO cron_job_logs (job_name, status, message)
  VALUES ('health-check', 'error', SQLERRM);
END;
$$;

-- Example: Schedule health check every hour
SELECT cron.schedule(
  'health-check',
  '0 * * * *',
  'SELECT health_check();'
);

-- Useful queries for managing cron jobs:
--
-- View all scheduled jobs:
-- SELECT * FROM cron.job;
--
-- Unschedule a job:
-- SELECT cron.unschedule('job-name');
--
-- View job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 100;
--
-- Common cron schedule examples:
-- '* * * * *'      - Every minute
-- '0 * * * *'      - Every hour at 0 minutes
-- '0 0 * * *'      - Daily at midnight
-- '0 0 * * 0'      - Weekly on Sunday at midnight
-- '0 0 1 * *'      - Monthly on the 1st at midnight
-- '*/5 * * * *'    - Every 5 minutes
-- '0 */6 * * *'    - Every 6 hours
-- '0 9,17 * * *'   - Daily at 9 AM and 5 PM
