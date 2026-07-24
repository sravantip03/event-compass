
-- Extend events with capacity / team / registration type
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_seats integer,
  ADD COLUMN IF NOT EXISTS registered_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_team_based boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_team_size integer,
  ADD COLUMN IF NOT EXISTS max_team_size integer,
  ADD COLUMN IF NOT EXISTS registration_type text NOT NULL DEFAULT 'free';

-- Application status enum
DO $$ BEGIN
  CREATE TYPE public.app_status AS ENUM ('pending','submitted','under_review','shortlisted','accepted','rejected','completed','waitlisted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('not_required','pending','paid','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Applications
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status public.app_status NOT NULL DEFAULT 'submitted',
  payment_status public.payment_status NOT NULL DEFAULT 'not_required',
  amount numeric NOT NULL DEFAULT 0,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  college text,
  university text,
  branch text,
  year text,
  roll_number text,
  gender text,
  skills text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  github_url text,
  linkedin_url text,
  portfolio_url text,
  resume_url text,
  experience_level text,
  team_name text,
  team_size integer,
  team_members jsonb DEFAULT '[]'::jsonb,
  answers jsonb DEFAULT '{}'::jsonb,
  agreed_terms boolean NOT NULL DEFAULT false,
  application_number text NOT NULL DEFAULT ('APP-' || upper(substr(md5(random()::text),1,8))),
  attended boolean NOT NULL DEFAULT false,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own applications" ON public.applications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin all applications" ON public.applications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER apps_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  transaction_id text NOT NULL DEFAULT ('TXN-' || upper(substr(md5(random()::text||clock_timestamp()::text),1,12))),
  order_id text NOT NULL DEFAULT ('ORD-' || upper(substr(md5(random()::text),1,10))),
  invoice_number text NOT NULL DEFAULT ('INV-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(md5(random()::text),1,6))),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments" ON public.payments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin payments" ON public.payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Event questions
CREATE TABLE IF NOT EXISTS public.event_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  required boolean NOT NULL DEFAULT false,
  options text[],
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_questions TO anon, authenticated;
GRANT ALL ON public.event_questions TO service_role;
ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read questions" ON public.event_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage questions" ON public.event_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Application status history
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status public.app_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.application_status_history TO authenticated;
GRANT ALL ON public.application_status_history TO service_role;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history via app" ON public.application_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "history insert admin or owner" ON public.application_status_history FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- Auto-log status changes
CREATE OR REPLACE FUNCTION public.log_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.application_status_history(application_id, status) VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_log_app_status ON public.applications;
CREATE TRIGGER trg_log_app_status AFTER INSERT OR UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.log_application_status();

-- Increment registered count on new application
CREATE OR REPLACE FUNCTION public.bump_event_registered()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.events SET registered_count = registered_count + 1 WHERE id = NEW.event_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_bump_event ON public.applications;
CREATE TRIGGER trg_bump_event AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.bump_event_registered();

-- Set defaults for existing events (registration_type based on is_free)
UPDATE public.events SET registration_type = CASE WHEN is_free THEN 'free' ELSE 'paid' END WHERE registration_type = 'free' AND NOT is_free;
UPDATE public.events SET max_seats = 500 WHERE max_seats IS NULL;
