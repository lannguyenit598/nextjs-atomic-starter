/** Node-only startup checks: env validation and loud warnings for insecure configurations (kept out of instrumentation.ts so the Edge build stays clean). */
export async function validateEnvOrExit() {
  try {
    const { serverEnv } = await import('@/lib/env')
    // A warning, not an exit: CI's E2E run serves the production build in demo mode on purpose.
    if (serverEnv.API_MODE === 'demo' && process.env.NODE_ENV === 'production') {
      console.warn(
        '[env] API_MODE=demo in a production build: data is in-memory and every visitor can ' +
          'change it. Set API_MODE=rest for a real deployment.',
      )
    }
    if (serverEnv.API_MODE === 'rest' && serverEnv.AUTH_ALLOW_ANONYMOUS) {
      console.warn(
        '[auth] AUTH_ALLOW_ANONYMOUS=true: every visitor can read and change backend data using ' +
          'API_TOKEN. Only acceptable behind a VPN / SSO gateway.',
      )
    }
  } catch (error) {
    // Misconfigured deployment: exit instead of serving 500s on every request.
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
