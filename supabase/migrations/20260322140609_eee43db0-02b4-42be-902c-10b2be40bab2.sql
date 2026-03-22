
CREATE TABLE public.project_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  equipment_type_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (project_id, equipment_type_id)
);

ALTER TABLE public.project_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view project equipment"
ON public.project_equipment FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can manage project equipment"
ON public.project_equipment FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
