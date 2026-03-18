
-- Table to link users to projects they can access
CREATE TABLE public.user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- Admins can manage user-project assignments
CREATE POLICY "Admins can manage user_projects" ON public.user_projects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own project assignments
CREATE POLICY "Users can view own projects" ON public.user_projects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Table for configurable notification recipients
CREATE TYPE public.recipient_type AS ENUM ('carteira', 'gestao');

CREATE TABLE public.notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  type recipient_type NOT NULL,
  carteira text, -- null for gestão (receives all)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email, type, carteira)
);

ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view recipients (needed for edge functions via service key)
CREATE POLICY "Authenticated can view recipients" ON public.notification_recipients
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can manage recipients
CREATE POLICY "Admins can insert recipients" ON public.notification_recipients
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update recipients" ON public.notification_recipients
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete recipients" ON public.notification_recipients
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
