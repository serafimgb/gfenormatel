
-- Add created_by column to bookings for ownership tracking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_by uuid;

-- Drop existing booking RLS policies
DROP POLICY IF EXISTS "Approved users can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Approved users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Approved users can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Approved users can delete bookings" ON public.bookings;

-- All approved users can VIEW bookings (viewer, user, manager, admin)
CREATE POLICY "Approved users can view bookings" ON public.bookings
FOR SELECT TO authenticated
USING (is_approved(auth.uid()));

-- Users with user/manager/admin role can INSERT (not viewer)
CREATE POLICY "Non-viewers can create bookings" ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (
  is_approved(auth.uid()) AND NOT has_role(auth.uid(), 'viewer'::app_role)
);

-- Manager/admin can update any; user can update own
CREATE POLICY "Users can update own or managers all" ON public.bookings
FOR UPDATE TO authenticated
USING (
  is_approved(auth.uid()) AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    (created_by = auth.uid())
  )
);

-- Manager/admin can delete any; user can delete own
CREATE POLICY "Users can delete own or managers all" ON public.bookings
FOR DELETE TO authenticated
USING (
  is_approved(auth.uid()) AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    (created_by = auth.uid())
  )
);
