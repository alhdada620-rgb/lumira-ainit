-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can insert their own pi payments" ON public.pi_payments;
DROP POLICY IF EXISTS "Users can update their own pi payments" ON public.pi_payments;

-- Re-create INSERT policy that pins status to 'created'
CREATE POLICY "Users can insert their own pi payments"
ON public.pi_payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'created');

-- Revoke direct UPDATE from authenticated; server functions use service_role
REVOKE UPDATE ON public.pi_payments FROM authenticated;

-- Ensure service_role has full access for server-side status progression
GRANT ALL ON public.pi_payments TO service_role;

CREATE POLICY "Service role has full access to pi_payments"
ON public.pi_payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
