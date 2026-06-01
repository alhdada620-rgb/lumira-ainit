-- Securely stored Pi identities, written only by trusted server code after
-- verifying the Pi access token against Pi's /v2/me endpoint.
CREATE TABLE IF NOT EXISTS public.pi_identities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pi_uid TEXT NOT NULL UNIQUE,
  pi_username TEXT NOT NULL,
  last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No anon/authenticated grants: this table is server-only (service role).
GRANT ALL ON public.pi_identities TO service_role;

ALTER TABLE public.pi_identities ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated => zero client access. Service role
-- bypasses RLS, so trusted server code can still read/write.
