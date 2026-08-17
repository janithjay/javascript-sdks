# Express quickstart: native flow + users/me/meta — work notes

Branch: `fix-express-native-flow` (based on `upstream/main`).

Covers two items from the original SDK issues list:
- "Express doesn't have users/me/meta integrated profile data population"
- "Express native flow is not implemented, no flow secret"

## What changed

### 1. `packages/express/src/middleware/flow.ts` (package-level bug fix)

`handleFlow()` defaulted `flowType` to `'SIGN_IN'` when the caller didn't supply one.
The ThunderID backend only accepts `AUTHENTICATION`, `REGISTRATION`, `USER_ONBOARDING`,
`RECOVERY`, `SIGNOUT`, `ADMINISTRATION` (`backend/pkg/thunderidengine/providers/constants.go`).
Any embedded sign-in flow initiated through this middleware without an explicit
`flowType` failed with `FES-1005 invalid_flow_type` — surfaced to the caller as a
generic "Invalid request", which is also the shared message text for several other
`flowexec` error codes (`ErrorInvalidAppID`, `ErrorInvalidExecutionID`, etc.), so it's
easy to misdiagnose as an app/secret problem instead. Confirmed by curling
`/flow/execute` directly with `flowType=AUTHENTICATION` vs `SIGN_IN` — same
`applicationId`/`flowSecret`, only the flow type changed the outcome.

Fixed the default to `'AUTHENTICATION'`. Also fixed the docstring example.

### 2. `samples/express/quickstart/index.mjs` — config gate

The global config gate (503 "Configuration needed") required
`THUNDERID_CLIENT_ID`/`THUNDERID_CLIENT_SECRET` unconditionally, which blocked
`/native-login` and `/flow/sign-in` even when `THUNDERID_APPLICATION_ID`/
`THUNDERID_FLOW_SECRET` were fully configured. Redirect flow and native flow are now
treated as two independent, either-is-sufficient configurations — the gate only fires
when *neither* is set up. `thunderID()` middleware mounts under the same condition
(both `/login` and `handleFlow()` need `req.thunderIDAuth`).

Also guarded `/login`/`/logout` specifically behind `redirectFlowConfigured` — without
this, a native-only deployment would let `/login` execute with an empty `client_id`,
producing a confusing ThunderID-hosted error page instead of a local one. It now
redirects to `/native-login` (or `/`) instead.

The nav "Sign in" button (`lib/layout.mjs`, new `signInHref` param) now points at
whichever flow is actually configured, instead of hardcoding `/login`.

### 3. `/native-login` page + `public/native-login.js`

New minimal vanilla-JS page demonstrating app-native embedded sign-in: POSTs to
`/flow/sign-in` (backed by `handleFlow()`), recursively walks the returned
`components` tree for `TEXT_INPUT`/`PASSWORD_INPUT`/`EMAIL_INPUT` fields and the
`SUBMIT`-type `ACTION`, renders a form, and drives the POST loop to
`{done: true, redirectUrl}`. Express ships no UI components (unlike react/vue), so
this is hand-rolled — same reasoning as the browser quickstart's profile dialog.

Known follow-up bug (now fixed as part of this): the client JS's error display
(`renderError()`) looked for a `.native-login-error` element that only existed once
`renderStep()` had run once — so a failure on the very first request (before any step
had rendered) had nowhere to display and silently no-opped, leaving a blank card. The
initial server-rendered markup now always includes the error container.

### 4. `/api/profile` endpoint

New bearer-protected route (`lib/auth.mjs` now also stashes the raw token as
`req.thunderIDAccessToken` for reuse) calling `getUsersMe` + `getUsersMeMeta` from
`@thunderid/express` (re-exported from `@thunderid/node` → `@thunderid/javascript`),
returning `{profile, schema}`. Sits alongside the existing `/api/me` (which proxies
`GET /oauth2/userinfo` — OIDC claims only, no schema/attributes).

## Verified

- `pnpm --filter @thunderid/express build` — clean.
- Live end-to-end against a local ThunderID backend with a real
  `applicationId`/`flowSecret`: `POST /flow/sign-in` (default flowType, no explicit
  override) returns a real flow step with username/password form components.
- Config gate: with only `THUNDERID_APPLICATION_ID`/`THUNDERID_FLOW_SECRET` set (redirect
  vars commented out), `/` and `/native-login` return 200 instead of 503, and `/login`
  redirects to `/native-login` instead of hitting ThunderID with an empty `client_id`.
- `/api/profile`: correctly gated (401 without/invalid bearer token, matching
  `/api/protected`/`/api/me`'s existing behavior). Not yet click-tested with a real
  token end-to-end (needs an interactive browser sign-in to obtain one).

## Not done / out of scope here

- No automated tests added (sample apps in this repo don't have test scripts; this
  mirrors the existing convention for `samples/**`).
- `/login`'s "empty client_id" guard only covers the top-level route; other edge cases
  (e.g. directly hitting `/logout` with only native flow configured) weren't
  exhaustively audited beyond the same guard.
