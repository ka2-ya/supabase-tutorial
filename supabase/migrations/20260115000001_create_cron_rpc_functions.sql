-- Create RPC functions to manage cron jobs from the client
-- These wrapper functions allow authenticated users to schedule and unschedule cron jobs

-- Function to schedule a new cron job
CREATE OR REPLACE FUNCTION schedule_cron_job(
  job_name TEXT,
  job_schedule TEXT,
  job_command TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_id BIGINT;
BEGIN
  -- Call the cron.schedule function
  SELECT cron.schedule(job_name, job_schedule, job_command) INTO job_id;

  -- Log the scheduling event
  INSERT INTO cron_job_logs (job_name, status, message)
  VALUES (job_name, 'scheduled', format('Job scheduled with ID %s: %s', job_id, job_schedule));

  RETURN job_id;
END;
$$;

-- Function to unschedule a cron job
CREATE OR REPLACE FUNCTION unschedule_cron_job(
  job_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Call the cron.unschedule function
  SELECT cron.unschedule(job_name) INTO result;

  -- Log the unscheduling event
  IF result THEN
    INSERT INTO cron_job_logs (job_name, status, message)
    VALUES (job_name, 'unscheduled', 'Job successfully unscheduled');
  END IF;

  RETURN result;
END;
$$;

-- Function to get all cron jobs (since cron schema is not exposed via PostgREST)
CREATE OR REPLACE FUNCTION get_cron_jobs()
RETURNS TABLE (
  jobid BIGINT,
  schedule TEXT,
  command TEXT,
  nodename TEXT,
  nodeport INTEGER,
  database TEXT,
  username TEXT,
  active BOOLEAN,
  jobname TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jobid, schedule, command, nodename, nodeport, database, username, active, jobname
  FROM cron.job
  ORDER BY jobid;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION schedule_cron_job(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION unschedule_cron_job(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cron_jobs() TO authenticated;

-- Note: In production, you should implement proper access controls
-- For learning purposes, we're allowing all authenticated users to manage cron jobs
-- Consider restricting this to admin users only in a real application
