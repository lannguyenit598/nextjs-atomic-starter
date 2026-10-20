import { config } from 'zod/v4/core'

// Runs in the browser before hydration. Zod probes `new Function()` to JIT-compile parsers;
// under our CSP (no 'unsafe-eval') that probe is blocked and reported as a violation on every
// page using a schema. jitless skips the probe; client-side validation speed is unaffected in practice.
config({ jitless: true })
