
-- Add new roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
