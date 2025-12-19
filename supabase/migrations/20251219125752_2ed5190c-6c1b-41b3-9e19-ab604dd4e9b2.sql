-- Create the bookings table for PEMT scheduling
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pemt_id TEXT NOT NULL,
  solicitante TEXT NOT NULL,
  carteira TEXT NOT NULL,
  local TEXT NOT NULL,
  servico_tipo TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  tempo_servico_horas NUMERIC(4,2) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (all users can view bookings)
CREATE POLICY "Anyone can view bookings" 
ON public.bookings 
FOR SELECT 
USING (true);

-- Create policy for public insert access (all users can create bookings)
CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update access (all users can update bookings)
CREATE POLICY "Anyone can update bookings" 
ON public.bookings 
FOR UPDATE 
USING (true);

-- Create policy for public delete access (all users can delete bookings)
CREATE POLICY "Anyone can delete bookings" 
ON public.bookings 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries by pemt_id and date range
CREATE INDEX idx_bookings_pemt_id ON public.bookings(pemt_id);
CREATE INDEX idx_bookings_start_time ON public.bookings(start_time);
CREATE INDEX idx_bookings_carteira ON public.bookings(carteira);