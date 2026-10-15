// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/node';
import {createError, defineEventHandler, getRouterParam} from 'h3';
import type {H3Event} from 'h3';
import type {ThunderIDRevokeUserSessionResult} from '../../../../types';
import ThunderIDNuxtClient from '../../../ThunderIDNuxtClient';
import {verifyAndRehydrateSession} from '../../../utils/serverSession';
import {useRuntimeConfig} from '#imports';

/**
 * DELETE /api/auth/user/sessions/:sessionId
 *
 * Revokes one of the signed-in user's SSO sessions using the signed-in user's server-held session. Which sessions
 * the caller may revoke is the ThunderID server's decision: it only revokes sessions of the user the access token
 * belongs to.
 *
 * Response: `{success: true}` or `{success: false, message, statusCode?}`, where `message` is built on the server and never repeats the upstream reply. A failed upstream call returns `200` with `success: false`, and `statusCode` 404 means the session is already gone; `401` means an invalid session and `400` a missing session identifier.
 */
export default defineEventHandler(async (event: H3Event): Promise<ThunderIDRevokeUserSessionResult> => {
  const config: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig();
  const sessionSecret: string | undefined = config.thunderid?.sessionSecret;

  const session: Awaited<ReturnType<typeof verifyAndRehydrateSession>> = await verifyAndRehydrateSession(
    event,
    sessionSecret,
  );

  if (!session) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized: Invalid or expired session.'});
  }

  const ssoSessionId: string | undefined = getRouterParam(event, 'sessionId', {decode: true});

  if (!ssoSessionId?.trim()) {
    throw createError({statusCode: 400, statusMessage: 'Invalid `sessionId` parameter.'});
  }

  try {
    await ThunderIDNuxtClient.getInstance().revokeUserSession(ssoSessionId, session.sessionId);

    return {success: true};
  } catch (error) {
    const statusCode: number | undefined = error instanceof ThunderIDAPIError ? error.statusCode : undefined;

    return statusCode === undefined
      ? {message: 'Failed to revoke the session.', success: false}
      : {message: `Failed to revoke the session (HTTP ${statusCode}).`, statusCode, success: false};
  }
});
