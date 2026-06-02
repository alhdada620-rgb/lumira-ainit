-- Explicit policy: service_role has full access to pi_identities
-- This makes the bypass explicit and defensively documents the intended access pattern.
CREATE POLICY "Service role has full access to pi_identities"
ON public.pi_identities
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);