import { createStart } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// Registers `attachSupabaseAuth` as a global function middleware so that every
// createServerFn RPC from the browser carries the Supabase bearer token.
// Without this, server functions guarded by `requireSupabaseAuth` 401.
export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
}));
