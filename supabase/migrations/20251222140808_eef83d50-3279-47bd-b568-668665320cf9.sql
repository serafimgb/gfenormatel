-- Add cancellation fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN cancelled_at timestamp with time zone DEFAULT NULL,
ADD COLUMN cancellation_reason text DEFAULT NULL,
ADD COLUMN is_cancelled boolean DEFAULT false NOT NULL;