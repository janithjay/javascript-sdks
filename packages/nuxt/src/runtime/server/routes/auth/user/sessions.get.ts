// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {mapSelectPageError, parseSelectPageQuery} from '@thunderid/node';
import type {SSOSessionListResponse, SelectPageQueryResult} from '@thunderid/node';
import {createError, defineEventHandler, getQuery} from 'h3';
import type {H3Event} from 'h3';
import type {ThunderIDGetUserSessionsResult} from '../../../../types';
import ThunderIDNuxtClient from '../../../ThunderIDNuxtClient';
import {verifyAndRehydrateSession} from '../../../utils/serverSession';
import {useRuntimeConfig} from '#imports';

/**
 * GET /api/auth/user/sessions
 *
 * Loads one page of the signed-in user's SSO sessions using the signed-in user's server-held session.
 *
 * Query: optional `limit` and `offset`. No session ID, token, or URL is accepted from the browser.
 *
 * Response: `{success: true, page}` or `{success: false, message, statusCode?}`, where `message` is built on the server and never repeats the upstream reply. A failed upstream call returns `200` with `success: false`; `401` means an invalid session and `400` a malformed query.
 */
export default defineEventHandler(async (event: H3Event): Promise<ThunderIDGetUserSessionsResult> => {
  const config: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig();
  const sessionSecret: string | undefined = config.thunderid?.sessionSecret;

  const session: Awaited<ReturnType<typeof verifyAndRehydrateSession>> = await verifyAndRehydrateSession(
    event,
    sessionSecret,
  );

  if (!session) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized: Invalid or expired session.'});
  }

  const checked: SelectPageQueryResult = parseSelectPageQuery(getQuery(event));

  if (checked.invalid !== undefined) {
    throw createError({statusCode: 400, statusMessage: `Invalid \`${checked.invalid}\` parameter.`});
  }

  try {
    const page: SSOSessionListResponse = await ThunderIDNuxtClient.getInstance().getUserSessions(
      {limit: checked.query.limit, offset: checked.query.offset},
      session.sessionId,
    );

    return {page, success: true};
  } catch (error) {
    return {...mapSelectPageError(error, 'sessions'), success: false};
  }
});
