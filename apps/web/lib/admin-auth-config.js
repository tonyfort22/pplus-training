function missingAdminAuthConfigError(missingKeys) {
  return new Error(`Missing admin auth Supabase configuration: ${missingKeys.join(', ')}`)
}

export function getAdminAuthConfig(env = process.env) {
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const missingKeys = []

  if (!supabaseUrl) missingKeys.push('SUPABASE_URL')
  if (!anonKey) missingKeys.push('SUPABASE_ANON_KEY')

  if (missingKeys.length > 0) {
    throw missingAdminAuthConfigError(missingKeys)
  }

  return {
    supabaseUrl,
    anonKey,
  }
}

export function getAdminAuthRedirectUrl(request, path) {
  const requestUrl = new URL(request.url)
  return new URL(path, requestUrl.origin).toString()
}
