-- Link Pi identities to Supabase users so payment ownership can be enforced server-side.
ALTER TABLE public.pi_identities
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS pi_identities_user_id_idx ON public.pi_identities(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS pi_identities_user_id_unique ON public.pi_identities(user_id) WHERE user_id IS NOT NULL;
