# ThunderID Nuxt Quickstart

<a href="https://stackblitz.com/fork/github/thunder-id/javascript-sdks/tree/main/samples/nuxt/quickstart?file=.env" target="_blank"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" /></a>

A minimal Nuxt 3 application demonstrating ThunderID authentication with OAuth 2.0, PKCE, and JWT out of the box.

## Prerequisites

- Node.js 18+
- pnpm
- A ThunderID application

## Getting started

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Fill in your ThunderID credentials in `.env`. By default the file is set up for the native flow:

   ```dotenv
   NUXT_PUBLIC_THUNDERID_BASE_URL=https://localhost:8090
   NUXT_PUBLIC_THUNDERID_APPLICATION_ID=<your-application-id>
   NUXT_PUBLIC_THUNDERID_SIGN_IN_URL=/signin
   NUXT_PUBLIC_THUNDERID_SIGN_UP_URL=/signup
   THUNDERID_FLOW_SECRET=<your-flow-secret>
   THUNDERID_SESSION_SECRET=<run: openssl rand -base64 32>
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

   The app is now running at [http://localhost:3000](http://localhost:3000).

<details>
<summary><h2>Redirect-based flow</h2></summary>

By default this quickstart uses the native (embedded) flow, where sign-in/sign-up render inline on this
app's own `/signin` and `/signup` routes with no redirect to ThunderID's hosted pages.

To send the user to ThunderID's hosted sign-in page instead, switch to the redirect-based flow:

1. Register a redirect URI for your application (see the app's config notice in the console for the
   exact value to use).
2. Regenerate `.env` for the redirect flow:

   ```bash
   npm run prepare-dev:redirect
   ```

   This comments out the native-flow vars (`NUXT_PUBLIC_THUNDERID_APPLICATION_ID`,
   `NUXT_PUBLIC_THUNDERID_SIGN_IN_URL`, `NUXT_PUBLIC_THUNDERID_SIGN_UP_URL`) and adds:

   ```dotenv
   NUXT_PUBLIC_THUNDERID_CLIENT_ID=<your-client-id>
   THUNDERID_CLIENT_SECRET=<your-client-secret>
   ```

   Both values come from the application's Credentials tab in the console. The redirect-based flow
   doesn't use `THUNDERID_FLOW_SECRET` (that's only sent when the native flow starts), so it can stay
   set in `.env` from step 2 above, unused. To switch back to the native flow, run
   `node scripts/prepare-dev.cjs --flow=native` (or manually re-enable the native-flow vars and comment
   out the two above).
3. Fill in `NUXT_PUBLIC_THUNDERID_CLIENT_ID` and `THUNDERID_CLIENT_SECRET` in `.env`, then restart the
   dev server.

</details>
