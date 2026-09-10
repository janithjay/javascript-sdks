// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError, type UpdateMeCredentialsConfig} from '@thunderid/node';
import {defineEventHandler, readBody, createError} from 'h3';
import type {H3Event} from 'h3';
import ThunderIDNuxtClient from '../../../ThunderIDNuxtClient';
import {verifyAndRehydrateSession} from '../../../utils/serverSession';
import {useRuntimeConfig} from '#imports';

/**
 * POST /api/auth/user/credentials
 *
 * Changes one or more of the authenticated user's own credentials via
 * `POST /users/me/update-credentials`. Mirrors the `updateUserCredentialsAction`
 * Next.js server action.
 *
 * Request body: {@link UpdateMeCredentialsConfig} (the map-keyed credential payload).
 * Response: `{ success: true }` on `204`; on failure the upstream status is forwarded
 * (403 for a rejected current value, 400 for a malformed request) so the client can
 * attach the error to the right field.
 */
export default defineEventHandler(async (event: H3Event): Promise<{success: boolean}> => {
  const config: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig();
  const sessionSecret: string | undefined = config.thunderid?.sessionSecret;

  const session: Awaited<ReturnType<typeof verifyAndRehydrateSession>> = await verifyAndRehydrateSession(
    event,
    sessionSecret,
  );
  if (!session) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized: Invalid or expired session.'});
  }

  let payload: UpdateMeCredentialsConfig;
  try {
    payload = await readBody<UpdateMeCredentialsConfig>(event);
  } catch {
    throw createError({statusCode: 400, statusMessage: 'Invalid request body.'});
  }

  try {
    const client: ThunderIDNuxtClient = ThunderIDNuxtClient.getInstance();
    await client.updateUserCredentials(payload, session.sessionId);
    return {success: true};
  } catch (err) {
    throw createError({
      statusCode: err instanceof ThunderIDAPIError ? err.statusCode : 500,
      statusMessage: `Failed to update user credentials: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});
