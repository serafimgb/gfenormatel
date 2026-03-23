
CREATE TABLE public.equipment_sharing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id text NOT NULL,
  equipment_type_id text NOT NULL,
  target_project_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (source_project_id, equipment_type_id, target_project_id)
);

ALTER TABLE public.equipment_sharing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage equipment sharing"
  ON public.equipment_sharing FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view equipment sharing"
  ON public.equipment_sharing FOR SELECT TO public
  USING (true);
