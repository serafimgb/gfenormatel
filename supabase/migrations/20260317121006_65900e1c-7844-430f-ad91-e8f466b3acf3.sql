
CREATE TABLE public.booking_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  edited_by uuid REFERENCES auth.users(id),
  edited_by_name text,
  edited_at timestamptz NOT NULL DEFAULT now(),
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_values jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.booking_edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view edit history" ON public.booking_edit_history
  FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Non-viewers can insert edit history" ON public.booking_edit_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_approved(auth.uid()) AND NOT public.has_role(auth.uid(), 'viewer'::app_role));
