
CREATE TABLE public.pi_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  txid TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pi_payments_user ON public.pi_payments(user_id);

GRANT SELECT, INSERT, UPDATE ON public.pi_payments TO authenticated;
GRANT ALL ON public.pi_payments TO service_role;

ALTER TABLE public.pi_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pi payments"
ON public.pi_payments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pi payments"
ON public.pi_payments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pi payments"
ON public.pi_payments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
