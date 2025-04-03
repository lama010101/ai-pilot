
-- Create app_builds table to track build history
CREATE TABLE IF NOT EXISTS public.app_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  app_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  spec TEXT,
  code TEXT,
  preview_url TEXT,
  production_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  build_log JSONB DEFAULT '[]'::JSONB,
  budget_usage FLOAT DEFAULT 0
);

-- Create RLS policies
ALTER TABLE public.app_builds ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see their own builds
CREATE POLICY "Users can view their own builds"
  ON public.app_builds
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own builds
CREATE POLICY "Users can create their own builds"
  ON public.app_builds
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own builds
CREATE POLICY "Users can update their own builds"
  ON public.app_builds
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own builds
CREATE POLICY "Users can delete their own builds"
  ON public.app_builds
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create generated_apps table to track deployed applications
CREATE TABLE IF NOT EXISTS public.generated_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID REFERENCES public.app_builds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  repository_url TEXT,
  deployment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  monthly_cost FLOAT DEFAULT 0,
  is_public BOOLEAN DEFAULT false
);

-- Create RLS policies
ALTER TABLE public.generated_apps ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see their own apps
CREATE POLICY "Users can view their own apps"
  ON public.generated_apps
  FOR SELECT
  USING ((SELECT user_id FROM public.app_builds WHERE id = build_id) = auth.uid());

-- Allow authenticated users to insert their own apps
CREATE POLICY "Users can create their own apps"
  ON public.generated_apps
  FOR INSERT
  WITH CHECK ((SELECT user_id FROM public.app_builds WHERE id = build_id) = auth.uid());

-- Allow authenticated users to update their own apps
CREATE POLICY "Users can update their own apps"
  ON public.generated_apps
  FOR UPDATE
  USING ((SELECT user_id FROM public.app_builds WHERE id = build_id) = auth.uid());

-- Allow authenticated users to delete their own apps
CREATE POLICY "Users can delete their own apps"
  ON public.generated_apps
  FOR DELETE
  USING ((SELECT user_id FROM public.app_builds WHERE id = build_id) = auth.uid());

-- Create a public policy for viewing public apps
CREATE POLICY "Anyone can view public apps"
  ON public.generated_apps
  FOR SELECT
  USING (is_public = true);

-- Create app_components table to track components of generated apps
CREATE TABLE IF NOT EXISTS public.app_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES public.generated_apps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create RLS policies
ALTER TABLE public.app_components ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see components of their own apps
CREATE POLICY "Users can view their own app components"
  ON public.app_components
  FOR SELECT
  USING ((SELECT user_id FROM public.app_builds WHERE id = (SELECT build_id FROM public.generated_apps WHERE id = app_id)) = auth.uid());

-- Create function to record budget usage
CREATE OR REPLACE FUNCTION public.record_build_budget_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Log cost changes to the cost_logs table
  INSERT INTO public.cost_logs (agent_id, cost, reason)
  VALUES ('zapbuilder', NEW.budget_usage - COALESCE(OLD.budget_usage, 0), 'App build: ' || NEW.app_name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update budget when app build usage changes
CREATE TRIGGER on_build_budget_change
  AFTER UPDATE OF budget_usage ON public.app_builds
  FOR EACH ROW
  WHEN (NEW.budget_usage <> OLD.budget_usage)
  EXECUTE FUNCTION public.record_build_budget_usage();
