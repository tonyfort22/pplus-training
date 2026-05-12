import { createSendAthleteInvitationHandler } from './handler.js'

const handler = createSendAthleteInvitationHandler({
  env: {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') || '',
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') || '',
    LOOPS_API_KEY: Deno.env.get('LOOPS_API_KEY') || '',
    PPLUS_APP_STORE_URL: Deno.env.get('PPLUS_APP_STORE_URL') || '',
    LOOPS_TRANSACTIONAL_ID: Deno.env.get('LOOPS_TRANSACTIONAL_ID') || '',
  },
})

Deno.serve((request) => handler(request))
