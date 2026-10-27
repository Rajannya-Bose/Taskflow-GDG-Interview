/*
# Create TaskFlow shared tasks table

1. New Tables
- `taskflow_tasks`
- `id` (uuid, primary key): Stable identifier for each task.
- `title` (text, required): Human-readable task name.
- `status` (text, required): One of todo, in_progress, done, or blocked.
- `assignee` (text, required): Student or teammate responsible for the task.
- `priority` (text, required): One of low, medium, or high.
- `due_date` (date, required): Calendar date for completion.
- `progress` (integer, required): Completion percentage from 0 to 100.
- `created_at` (timestamptz): Creation timestamp.
- `updated_at` (timestamptz): Last update timestamp.

2. Security
- Row level security is enabled.
- The app has no sign-in screen, so anon and authenticated roles can use the intentionally shared task board.
- Separate read, insert, update, and delete policies are added.
- Data API grants are limited to the verbs used by the dashboard.

3. Important Notes
- Validation constraints keep status, priority, and progress values consistent for charts and filters.
- The table is shared rather than user-owned because this first version has no accounts or sign-in flow.
*/

CREATE TABLE IF NOT EXISTS public.taskflow_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  assignee text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  due_date date NOT NULL,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.taskflow_tasks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.taskflow_tasks TO anon, authenticated;

DROP POLICY IF EXISTS "Shared task board can be read" ON public.taskflow_tasks;
CREATE POLICY "Shared task board can be read"
  ON public.taskflow_tasks FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Shared task board can add tasks" ON public.taskflow_tasks;
CREATE POLICY "Shared task board can add tasks"
  ON public.taskflow_tasks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Shared task board can update tasks" ON public.taskflow_tasks;
CREATE POLICY "Shared task board can update tasks"
  ON public.taskflow_tasks FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Shared task board can delete tasks" ON public.taskflow_tasks;
CREATE POLICY "Shared task board can delete tasks"
  ON public.taskflow_tasks FOR DELETE
  TO anon, authenticated
  USING (true);
