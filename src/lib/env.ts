import 'server-only'

import { z } from 'zod'

/**
 * Server-side environment, validated once at startup.
 * `server-only` makes the build fail if a Client Component imports this file,
 * so API_TOKEN can never leak into the browser bundle.
 */
const serverEnvSchema = z.discriminatedUnion('API_MODE', [
  z.object({ API_MODE: z.literal('demo') }),
  z.object({
    API_MODE: z.literal('rest'),
    API_BASE_URL: z.url({ error: 'API_BASE_URL must be an absolute URL when API_MODE=rest' }),
    API_TOKEN: z.string().min(1).optional(),
    API_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    /**
     * DANGEROUS. Lets every visitor act with API_TOKEN, without signing in. Only for apps that are
     * already protected in front of Next.js (VPN, SSO gateway). Default false = fail closed.
     */
    AUTH_ALLOW_ANONYMOUS: z.stringbool().default(false),
  }),
])

export type ServerEnv = z.infer<typeof serverEnvSchema>

function readServerEnv(): ServerEnv {
  // Treat empty strings (`API_TOKEN=`) as unset.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''))
  const result = serverEnvSchema.safeParse({ ...raw, API_MODE: raw.API_MODE ?? 'demo' })
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

export const serverEnv = readServerEnv()
