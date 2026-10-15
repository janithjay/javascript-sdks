// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/node';
import {createError, defineEventHandler, getQuery} from 'h3';
import type {H3Event} from 'h3';
import type {ThunderIDRevokeUserSessionsResult} from '../../../../types';
import ThunderIDNuxtClient from '../../../ThunderIDNuxtClient';
import {verifyAndRehydrateSession} from '../../../utils/serverSession';
import {useRuntimeConfig} from '#imports';

/**
 * DELETE /api/auth/user/sessions
 *
 * Revokes the signed-in user's SSO sessions using the signed-in user's server-held session.
 *
 * Query: optional `exceptCurrent` (`true` or `false`), which keeps the session that issued the access token. No
 * session ID, token, or URL is accepted from the browser.
 *
 * Response: `{success: true}` or `{success: false, message, statusCode?}`, where `message` is built on the server and never repeats the upstream reply. A failed upstream call returns `200` with `success: false`; `401` means an invalid session and `400` a malformed query.
 */
export default defineEventHandler(async (event: H3Event): Promise<ThunderIDRevokeUserSessionsResult> => {
  const config: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig();
  const sessionSecret: string | undefined = config.thunderid?.sessionSecret;

  const session: Awaited<ReturnType<typeof verifyAndRehydrateSession>> = await verifyAndRehydrateSession(
    event,
    sessionSecret,
  );

  if (!session) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized: Invalid or expired session.'});
  }

  const {exceptCurrent} = getQuery(event);

  if (exceptCurrent !== undefined && exceptCurrent !== 'true' && exceptCurrent !== 'false') {
    throw createError({statusCode: 400, statusMessage: 'Invalid `exceptCurrent` parameter.'});
  }

  try {
    await ThunderIDNuxtClient.getInstance().revokeUserSessions(
      {exceptCurrent: exceptCurrent === 'true'},
      session.sessionId,
    );

    return {success: true};
  } catch (error) {
    const statusCode: number | undefined = error instanceof ThunderIDAPIError ? error.statusCode : undefined;

    return statusCode === undefined
      ? {message: 'Failed to revoke sessions.', success: false}
      : {message: `Failed to revoke sessions (HTTP ${statusCode}).`, statusCode, success: false};
  }
});
