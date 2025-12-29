-- Add project_id column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT '743';

-- Create index for better performance on project queries
CREATE INDEX IF NOT EXISTS idx_bookings_project_id ON public.bookings(project_id);

-- Create equipment_types table
CREATE TABLE IF NOT EXISTS public.equipment_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on equipment_types
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

-- Create policy for equipment_types
CREATE POLICY "Anyone can view equipment types" ON public.equipment_types FOR SELECT USING (true);

-- Insert default equipment types
INSERT INTO public.equipment_types (id, name, color, icon) VALUES
  ('PEMT', 'PEMT', '#57B952', 'crane'),
  ('RETROESCAVADEIRA', 'Retroescavadeira', '#E67E22', 'construction'),
  ('CAMINHAO_COMPACTADOR', 'Caminhão Compactador', '#9B59B6', 'truck'),
  ('TRATOR', 'Trator', '#3498DB', 'tractor'),
  ('CAMINHAO_MUNCK', 'Caminhão Munck', '#E74C3C', 'truck')
ON CONFLICT (id) DO NOTHING;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policy for projects
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);

-- Insert default projects
INSERT INTO public.projects (id, name, description) VALUES
  ('743', 'Projeto 743', 'Projeto principal 743'),
  ('741', 'Projeto 741', 'Projeto 741')
ON CONFLICT (id) DO NOTHING;

-- Add equipment_type column to bookings (replacing the old servico_tipo logic)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS equipment_type text DEFAULT 'PEMT';